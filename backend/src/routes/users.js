import express from 'express';
import { logger } from '../utils/logger.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

// Mock user database (in production, use MongoDB/PostgreSQL)
let users = [
  {
    id: 1,
    address: '0x1234567890123456789012345678901234567890',
    username: 'arbitpy_user',
    email: 'user@arbitpy.com',
    createdAt: new Date().toISOString(),
    contracts: [],
    settings: {
      theme: 'dark',
      notifications: true
    }
  }
];

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Users]
 */
router.get('/profile', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required'
      });
    }
    
    const user = users.find(u => u.address.toLowerCase() === address.toLowerCase());
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Don't return sensitive information
    const { email, ...publicProfile } = user;
    
    res.json({
      success: true,
      user: publicProfile
    });
    
  } catch (error) {
    logger.error('Failed to get user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/users/register:
 *   post:
 *     summary: Register new user
 *     tags: [Users]
 */
router.post('/register', validateRequest, async (req, res) => {
  try {
    const { address, username, email } = req.body;
    
    if (!address || !username) {
      return res.status(400).json({
        success: false,
        error: 'Address and username are required'
      });
    }
    
    // Check if user already exists
    const existingUser = users.find(u => 
      u.address.toLowerCase() === address.toLowerCase() || 
      u.username === username
    );
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }
    
    // Create new user
    const newUser = {
      id: users.length + 1,
      address,
      username,
      email: email || '',
      createdAt: new Date().toISOString(),
      contracts: [],
      settings: {
        theme: 'dark',
        notifications: true
      }
    };
    
    users.push(newUser);
    
    const { email: userEmail, ...publicProfile } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: publicProfile
    });
    
    logger.info(`New user registered: ${username} (${address})`);
    
  } catch (error) {
    logger.error('Failed to register user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/users/settings:
 *   put:
 *     summary: Update user settings
 *     tags: [Users]
 */
router.put('/settings', validateRequest, async (req, res) => {
  try {
    const { address, settings } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    const userIndex = users.findIndex(u => 
      u.address.toLowerCase() === address.toLowerCase()
    );
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Update settings
    users[userIndex].settings = {
      ...users[userIndex].settings,
      ...settings
    };
    
    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: users[userIndex].settings
    });
    
    logger.info(`Settings updated for user: ${address}`);
    
  } catch (error) {
    logger.error('Failed to update settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update settings',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/users/contracts:
 *   get:
 *     summary: Get user's contracts
 *     tags: [Users]
 */
router.get('/contracts', async (req, res) => {
  try {
    const { address, limit = 10, offset = 0 } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required'
      });
    }
    
    const user = users.find(u => 
      u.address.toLowerCase() === address.toLowerCase()
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Paginate contracts
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedContracts = user.contracts.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      contracts: paginatedContracts,
      total: user.contracts.length,
      page: Math.floor(startIndex / parseInt(limit)) + 1,
      totalPages: Math.ceil(user.contracts.length / parseInt(limit))
    });
    
  } catch (error) {
    logger.error('Failed to get user contracts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user contracts',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/users/contracts:
 *   post:
 *     summary: Save user contract
 *     tags: [Users]
 */
router.post('/contracts', validateRequest, async (req, res) => {
  try {
    const { address, contract } = req.body;
    
    if (!address || !contract) {
      return res.status(400).json({
        success: false,
        error: 'Address and contract are required'
      });
    }
    
    const userIndex = users.findIndex(u => 
      u.address.toLowerCase() === address.toLowerCase()
    );
    
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Add contract with metadata
    const contractWithMetadata = {
      ...contract,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users[userIndex].contracts.push(contractWithMetadata);
    
    res.status(201).json({
      success: true,
      message: 'Contract saved successfully',
      contract: contractWithMetadata
    });
    
    logger.info(`Contract saved for user: ${address}`);
    
  } catch (error) {
    logger.error('Failed to save contract:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save contract',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/users/stats:
 *   get:
 *     summary: Get user statistics
 *     tags: [Users]
 */
router.get('/stats', async (req, res) => {
  try {
    const { address } = req.query;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address parameter is required'
      });
    }
    
    const user = users.find(u => 
      u.address.toLowerCase() === address.toLowerCase()
    );
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // Calculate user statistics
    const stats = {
      totalContracts: user.contracts.length,
      contractsByType: user.contracts.reduce((acc, contract) => {
        const type = contract.type || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      recentActivity: user.contracts
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5)
        .map(contract => ({
          id: contract.id,
          name: contract.name,
          type: contract.type,
          updatedAt: contract.updatedAt
        })),
      memberSince: user.createdAt
    };
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    logger.error('Failed to get user stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user stats',
      message: error.message
    });
  }
});

export default router;