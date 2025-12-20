import express from 'express';
import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/metamask/validate-deployment:
 *   post:
 *     summary: Validate deployment parameters for MetaMask
 *     tags: [MetaMask]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bytecode
 *               - abi
 *               - network
 *             properties:
 *               bytecode:
 *                 type: string
 *               abi:
 *                 type: array
 *               network:
 *                 type: string
 *               constructorParams:
 *                 type: array
 */
router.post('/validate-deployment', async (req, res) => {
  try {
    const { bytecode, abi, network = 'arbitrum_sepolia', constructorParams = [] } = req.body;
    
    // Validate bytecode format
    if (!bytecode || !bytecode.startsWith('0x') || bytecode.length < 4) {
      return res.status(400).json({
        success: false,
        error: 'Invalid bytecode format. Must be hex string with 0x prefix'
      });
    }

    // Validate ABI format
    if (!Array.isArray(abi)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid ABI format. Must be an array'
      });
    }

    // Validate network
    const validNetworks = ['arbitrum_sepolia', 'arbitrum', 'sepolia', 'mainnet'];
    if (!validNetworks.includes(network)) {
      return res.status(400).json({
        success: false,
        error: `Invalid network: ${network}. Supported networks: ${validNetworks.join(', ')}`
      });
    }

    // Try to create a contract factory to validate ABI and bytecode compatibility
    try {
      const tempFactory = new ethers.ContractFactory(abi, bytecode);
      
      // Validate constructor parameters if any
      if (constructorParams.length > 0) {
        tempFactory.getDeployTransaction(...constructorParams);
      }
    } catch (validationError) {
      return res.status(400).json({
        success: false,
        error: `Contract validation failed: ${validationError.message}`
      });
    }

    logger.info(`Deployment parameters validated for network: ${network}`);
    
    res.json({
      success: true,
      message: 'Deployment parameters are valid',
      network,
      estimatedGas: null // Client will estimate gas directly
    });

  } catch (error) {
    logger.error('Deployment validation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Validation failed'
    });
  }
});

/**
 * @swagger
 * /api/v1/metamask/verify-transaction:
 *   post:
 *     summary: Verify transaction status on blockchain
 *     tags: [MetaMask]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - txHash
 *               - network
 *             properties:
 *               txHash:
 *                 type: string
 *               network:
 *                 type: string
 */
router.post('/verify-transaction', async (req, res) => {
  try {
    const { txHash, network = 'arbitrum_sepolia' } = req.body;
    
    if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
      return res.status(400).json({
        success: false,
        error: 'Invalid transaction hash format'
      });
    }

    // Network configurations
    const networks = {
      arbitrum_sepolia: {
        rpc: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
        explorer: 'https://sepolia.arbiscan.io'
      },
      arbitrum: {
        rpc: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        explorer: 'https://arbiscan.io'
      }
    };

    const networkConfig = networks[network];
    if (!networkConfig) {
      return res.status(400).json({
        success: false,
        error: `Unsupported network: ${network}`
      });
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
    
    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
      return res.json({
        success: true,
        status: 'pending',
        confirmed: false,
        message: 'Transaction is pending confirmation'
      });
    }

    // Get current block number for confirmations
    const currentBlock = await provider.getBlockNumber();
    const confirmations = currentBlock - receipt.blockNumber;

    const explorerUrl = `${networkConfig.explorer}/tx/${txHash}`;
    const contractExplorerUrl = receipt.contractAddress 
      ? `${networkConfig.explorer}/address/${receipt.contractAddress}`
      : null;

    res.json({
      success: true,
      status: receipt.status === 1 ? 'success' : 'failed',
      confirmed: true,
      confirmations,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      contractAddress: receipt.contractAddress,
      explorerUrl,
      contractExplorerUrl,
      network: network
    });

  } catch (error) {
    logger.error('Transaction verification failed:', error);
    
    if (error.code === 'NETWORK_ERROR') {
      res.status(503).json({
        success: false,
        error: 'Network connectivity issue. Please try again later.'
      });
    } else {
      res.status(500).json({
        success: false,
        error: error.message || 'Transaction verification failed'
      });
    }
  }
});

/**
 * @swagger
 * /api/v1/metamask/gas-price:
 *   get:
 *     summary: Get current gas price for network
 *     tags: [MetaMask]
 *     parameters:
 *       - in: query
 *         name: network
 *         schema:
 *           type: string
 *         description: Network name
 */
router.get('/gas-price', async (req, res) => {
  try {
    const { network = 'arbitrum_sepolia' } = req.query;
    
    const networks = {
      arbitrum_sepolia: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
      arbitrum: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc'
    };

    const rpcUrl = networks[network];
    if (!rpcUrl) {
      return res.status(400).json({
        success: false,
        error: `Unsupported network: ${network}`
      });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const feeData = await provider.getFeeData();
    
    res.json({
      success: true,
      network,
      gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : null,
      maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, 'gwei') : null,
      maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, 'gwei') : null,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Gas price fetch failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch gas price'
    });
  }
});

export default router;