import express from 'express';
import { logger } from '../utils/logger.js';
import { validateRequest } from '../middleware/validation.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/utils/validate-address:
 *   post:
 *     summary: Validate Ethereum address
 *     tags: [Utils]
 */
router.post('/validate-address', validateRequest, async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        error: 'Address is required'
      });
    }
    
    // Basic Ethereum address validation
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
    
    // Additional checksum validation could be added here
    
    res.json({
      success: true,
      valid: isValidAddress,
      address: address,
      checksummed: isValidAddress ? address : null
    });
    
  } catch (error) {
    logger.error('Failed to validate address:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate address',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/utils/gas-estimate:
 *   post:
 *     summary: Estimate gas for contract deployment
 *     tags: [Utils]
 */
router.post('/gas-estimate', validateRequest, async (req, res) => {
  try {
    const { bytecode, network = 'ethereum' } = req.body;
    
    if (!bytecode) {
      return res.status(400).json({
        success: false,
        error: 'Bytecode is required'
      });
    }
    
    // Mock gas estimation - in production, use web3 provider
    const baseGas = 21000;
    const bytecodeLength = bytecode.replace('0x', '').length;
    const estimatedGas = baseGas + (bytecodeLength / 2) * 200;
    
    // Network-specific gas prices (mock data)
    const gasPrices = {
      ethereum: { slow: 20, standard: 25, fast: 35 },
      arbitrum: { slow: 0.1, standard: 0.1, fast: 0.1 },
      polygon: { slow: 25, standard: 30, fast: 40 },
      optimism: { slow: 0.001, standard: 0.001, fast: 0.001 }
    };
    
    const networkGasPrices = gasPrices[network] || gasPrices.ethereum;
    
    const estimates = {
      gasLimit: Math.ceil(estimatedGas),
      gasPrice: networkGasPrices,
      estimatedCost: {
        slow: `${((estimatedGas * networkGasPrices.slow) / 1e9).toFixed(6)} ETH`,
        standard: `${((estimatedGas * networkGasPrices.standard) / 1e9).toFixed(6)} ETH`,
        fast: `${((estimatedGas * networkGasPrices.fast) / 1e9).toFixed(6)} ETH`
      }
    };
    
    res.json({
      success: true,
      network,
      estimates
    });
    
  } catch (error) {
    logger.error('Failed to estimate gas:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to estimate gas',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/utils/format-code:
 *   post:
 *     summary: Format Vyper/Solidity code
 *     tags: [Utils]
 */
router.post('/format-code', validateRequest, async (req, res) => {
  try {
    const { code, language = 'vyper' } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      });
    }
    
    // Basic code formatting (mock implementation)
    // In production, use proper formatters like prettier for Solidity
    let formattedCode = code;
    
    if (language === 'vyper') {
      // Basic Vyper formatting
      formattedCode = code
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('#')) return trimmed; // Comments
          if (trimmed.startsWith('@')) return trimmed; // Decorators
          if (trimmed.includes(':') && !trimmed.includes('def ')) {
            return trimmed; // Type annotations
          }
          return trimmed;
        })
        .join('\n');
    } else if (language === 'solidity') {
      // Basic Solidity formatting
      formattedCode = code
        .replace(/\s*{\s*/g, ' {\n    ')
        .replace(/\s*}\s*/g, '\n}\n')
        .replace(/;\s*/g, ';\n    ');
    }
    
    res.json({
      success: true,
      language,
      formattedCode,
      originalLength: code.length,
      formattedLength: formattedCode.length
    });
    
  } catch (error) {
    logger.error('Failed to format code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to format code',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/utils/contract-size:
 *   post:
 *     summary: Calculate contract size and complexity
 *     tags: [Utils]
 */
router.post('/contract-size', validateRequest, async (req, res) => {
  try {
    const { code, language = 'vyper' } = req.body;
    
    if (!code) {
      return res.status(400).json({
        success: false,
        error: 'Code is required'
      });
    }
    
    // Calculate basic metrics
    const lines = code.split('\n');
    const totalLines = lines.length;
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed && !trimmed.startsWith('#');
    }).length;
    
    const commentLines = lines.filter(line => 
      line.trim().startsWith('#')
    ).length;
    
    const emptyLines = totalLines - codeLines - commentLines;
    
    // Count functions
    const functionCount = language === 'vyper' 
      ? (code.match(/@external|@internal|@view|@pure/g) || []).length
      : (code.match(/function\s+\w+/g) || []).length;
    
    // Estimate bytecode size (very rough approximation)
    const estimatedBytecodeSize = codeLines * 30; // ~30 bytes per line of code
    
    // Complexity score (simple heuristic)
    const complexityFactors = {
      loops: (code.match(/for\s+|while\s+/g) || []).length * 3,
      conditionals: (code.match(/if\s+|elif\s+|else:/g) || []).length * 2,
      functions: functionCount * 5,
      imports: (code.match(/from\s+|import\s+/g) || []).length * 1
    };
    
    const complexityScore = Object.values(complexityFactors).reduce((a, b) => a + b, 0);
    
    res.json({
      success: true,
      language,
      metrics: {
        totalLines,
        codeLines,
        commentLines,
        emptyLines,
        functionCount,
        estimatedBytecodeSize,
        complexityScore,
        complexityFactors
      },
      analysis: {
        readability: commentLines / totalLines > 0.2 ? 'Good' : 'Needs improvement',
        complexity: complexityScore < 50 ? 'Low' : complexityScore < 100 ? 'Medium' : 'High',
        maintainability: codeLines < 200 ? 'High' : codeLines < 500 ? 'Medium' : 'Low'
      }
    });
    
  } catch (error) {
    logger.error('Failed to analyze contract:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze contract',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/utils/network-info:
 *   get:
 *     summary: Get blockchain network information
 *     tags: [Utils]
 */
router.get('/network-info', async (req, res) => {
  try {
    const { network } = req.query;
    
    const networks = {
      ethereum: {
        chainId: 1,
        name: 'Ethereum Mainnet',
        currency: 'ETH',
        explorer: 'https://etherscan.io',
        rpc: 'https://mainnet.infura.io/v3/',
        avgBlockTime: 12,
        avgGasPrice: '25 gwei',
        maxGasLimit: 30000000
      },
      arbitrum: {
        chainId: 42161,
        name: 'Arbitrum One',
        currency: 'ETH',
        explorer: 'https://arbiscan.io',
        rpc: 'https://arb1.arbitrum.io/rpc',
        avgBlockTime: 0.25,
        avgGasPrice: '0.1 gwei',
        maxGasLimit: 32000000
      },
      polygon: {
        chainId: 137,
        name: 'Polygon Mainnet',
        currency: 'MATIC',
        explorer: 'https://polygonscan.com',
        rpc: 'https://polygon-rpc.com',
        avgBlockTime: 2,
        avgGasPrice: '30 gwei',
        maxGasLimit: 20000000
      },
      optimism: {
        chainId: 10,
        name: 'Optimism',
        currency: 'ETH',
        explorer: 'https://optimistic.etherscan.io',
        rpc: 'https://mainnet.optimism.io',
        avgBlockTime: 2,
        avgGasPrice: '0.001 gwei',
        maxGasLimit: 15000000
      }
    };
    
    if (network) {
      const networkInfo = networks[network];
      if (!networkInfo) {
        return res.status(404).json({
          success: false,
          error: 'Network not found'
        });
      }
      
      res.json({
        success: true,
        network: networkInfo
      });
    } else {
      res.json({
        success: true,
        networks: Object.keys(networks).map(key => ({
          key,
          ...networks[key]
        }))
      });
    }
    
  } catch (error) {
    logger.error('Failed to get network info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get network info',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/utils/health:
 *   get:
 *     summary: API health check
 *     tags: [Utils]
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

export default router;