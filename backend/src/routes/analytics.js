import express from 'express';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/analytics/stats:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Analytics]
 */
router.get('/stats', async (req, res) => {
  try {
    const cacheKey = 'analytics:platform:stats';
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Mock analytics data - in production this would come from database
    const stats = {
      totalUsers: 12543,
      totalContracts: 8921,
      totalCompilations: 45632,
      totalDeployments: 3421,
      activeUsers24h: 1234,
      activeUsers7d: 5678,
      contractsByCategory: {
        defi: 3456,
        nft: 2134,
        governance: 1876,
        gaming: 987,
        other: 468
      },
      compilationsByLanguage: {
        vyper: 32145,
        solidity: 13487
      },
      deploymentsByNetwork: {
        ethereum: 1543,
        arbitrum: 987,
        polygon: 654,
        optimism: 237
      },
      popularContracts: [
        { id: 'defi-token', name: 'Advanced DeFi Token', views: 2143 },
        { id: 'evolution-nft', name: 'Evolution NFT Collection', views: 1876 },
        { id: 'yield-vault', name: 'Automated Yield Vault', views: 1654 },
        { id: 'dao-governance', name: 'DAO Governance System', views: 1432 }
      ],
      recentActivity: [
        {
          type: 'compilation',
          user: '0x1234...5678',
          contract: 'Token Contract',
          timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
        },
        {
          type: 'deployment',
          user: '0xabcd...efgh',
          contract: 'NFT Collection',
          network: 'arbitrum',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString()
        },
        {
          type: 'user_joined',
          user: '0x9876...1234',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
        }
      ]
    };
    
    await cacheManager.set(cacheKey, stats, 300); // 5 minutes cache
    
    res.json({
      success: true,
      stats
    });
    
  } catch (error) {
    logger.error('Failed to get analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get analytics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/usage:
 *   get:
 *     summary: Get usage metrics over time
 *     tags: [Analytics]
 */
router.get('/usage', async (req, res) => {
  try {
    const { period = '7d', metric = 'compilations' } = req.query;
    
    const cacheKey = `analytics:usage:${period}:${metric}`;
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Generate mock time series data
    const generateTimeSeriesData = (days, baseValue) => {
      const data = [];
      const now = new Date();
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // Add some randomness to make it look realistic
        const variance = Math.random() * 0.4 + 0.8; // 80-120% of base
        const value = Math.floor(baseValue * variance);
        
        data.push({
          date: date.toISOString().split('T')[0],
          value: value
        });
      }
      
      return data;
    };
    
    let data = [];
    let days = 7;
    let baseValue = 150;
    
    switch (period) {
      case '24h':
        days = 24;
        baseValue = 25;
        break;
      case '7d':
        days = 7;
        baseValue = 150;
        break;
      case '30d':
        days = 30;
        baseValue = 150;
        break;
      case '90d':
        days = 90;
        baseValue = 150;
        break;
    }
    
    switch (metric) {
      case 'compilations':
        data = generateTimeSeriesData(days, baseValue);
        break;
      case 'deployments':
        data = generateTimeSeriesData(days, Math.floor(baseValue * 0.3));
        break;
      case 'users':
        data = generateTimeSeriesData(days, Math.floor(baseValue * 0.8));
        break;
      case 'contracts':
        data = generateTimeSeriesData(days, Math.floor(baseValue * 0.6));
        break;
    }
    
    const result = {
      success: true,
      period,
      metric,
      data,
      total: data.reduce((sum, item) => sum + item.value, 0),
      average: Math.floor(data.reduce((sum, item) => sum + item.value, 0) / data.length)
    };
    
    await cacheManager.set(cacheKey, result, 600); // 10 minutes cache
    
    res.json(result);
    
  } catch (error) {
    logger.error('Failed to get usage metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get usage metrics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/contracts:
 *   get:
 *     summary: Get contract analytics
 *     tags: [Analytics]
 */
router.get('/contracts', async (req, res) => {
  try {
    const { category, sortBy = 'popularity', limit = 20 } = req.query;
    
    const cacheKey = `analytics:contracts:${category || 'all'}:${sortBy}:${limit}`;
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    // Mock contract analytics
    let contracts = [
      {
        id: 'defi-token',
        name: 'Advanced DeFi Token',
        category: 'defi',
        views: 2143,
        deployments: 156,
        forks: 89,
        rating: 4.7,
        createdAt: '2024-01-15'
      },
      {
        id: 'evolution-nft',
        name: 'Evolution NFT Collection', 
        category: 'nft',
        views: 1876,
        deployments: 134,
        forks: 67,
        rating: 4.5,
        createdAt: '2024-01-20'
      },
      {
        id: 'yield-vault',
        name: 'Automated Yield Vault',
        category: 'defi', 
        views: 1654,
        deployments: 98,
        forks: 45,
        rating: 4.8,
        createdAt: '2024-01-25'
      },
      {
        id: 'dao-governance',
        name: 'DAO Governance System',
        category: 'governance',
        views: 1432,
        deployments: 87,
        forks: 34,
        rating: 4.6,
        createdAt: '2024-02-01'
      },
      {
        id: 'gaming-items',
        name: 'Gaming Item System',
        category: 'gaming',
        views: 987,
        deployments: 76,
        forks: 23,
        rating: 4.3,
        createdAt: '2024-02-05'
      }
    ];
    
    // Filter by category
    if (category && category !== 'all') {
      contracts = contracts.filter(contract => contract.category === category);
    }
    
    // Sort contracts
    switch (sortBy) {
      case 'popularity':
        contracts.sort((a, b) => b.views - a.views);
        break;
      case 'deployments':
        contracts.sort((a, b) => b.deployments - a.deployments);
        break;
      case 'rating':
        contracts.sort((a, b) => b.rating - a.rating);
        break;
      case 'recent':
        contracts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    // Apply limit
    contracts = contracts.slice(0, parseInt(limit));
    
    const result = {
      success: true,
      contracts,
      total: contracts.length,
      filters: { category, sortBy, limit }
    };
    
    await cacheManager.set(cacheKey, result, 900); // 15 minutes cache
    
    res.json(result);
    
  } catch (error) {
    logger.error('Failed to get contract analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contract analytics',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/analytics/networks:
 *   get:
 *     summary: Get network deployment statistics
 *     tags: [Analytics]
 */
router.get('/networks', async (req, res) => {
  try {
    const cacheKey = 'analytics:networks:stats';
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return res.json(cached);
    }
    
    const networkStats = [
      {
        network: 'ethereum',
        name: 'Ethereum Mainnet',
        deployments: 1543,
        gasUsed: '245.7M',
        avgGasPrice: '25.4 gwei',
        successRate: 94.2,
        popularContracts: ['defi-token', 'yield-vault', 'dao-governance']
      },
      {
        network: 'arbitrum',
        name: 'Arbitrum One',
        deployments: 987,
        gasUsed: '12.3M',
        avgGasPrice: '0.1 gwei',
        successRate: 96.8,
        popularContracts: ['evolution-nft', 'gaming-items']
      },
      {
        network: 'polygon',
        name: 'Polygon Mainnet',
        deployments: 654,
        gasUsed: '89.2M',
        avgGasPrice: '30.2 gwei',
        successRate: 95.1,
        popularContracts: ['defi-token', 'evolution-nft']
      },
      {
        network: 'optimism',
        name: 'Optimism',
        deployments: 237,
        gasUsed: '5.7M',
        avgGasPrice: '0.001 gwei',
        successRate: 97.3,
        popularContracts: ['yield-vault']
      }
    ];
    
    const result = {
      success: true,
      networks: networkStats,
      totalDeployments: networkStats.reduce((sum, network) => sum + network.deployments, 0),
      avgSuccessRate: networkStats.reduce((sum, network) => sum + network.successRate, 0) / networkStats.length
    };
    
    await cacheManager.set(cacheKey, result, 1800); // 30 minutes cache
    
    res.json(result);
    
  } catch (error) {
    logger.error('Failed to get network analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network analytics',
      message: error.message
    });
  }
});

export default router;