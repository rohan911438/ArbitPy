import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import { validateDeploymentRequest } from '../middleware/validation.js';
import { ContractDeployer } from '../services/ContractDeployer.js';
import { TransactionMonitor } from '../services/TransactionMonitor.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/deploy/contract:
 *   post:
 *     summary: Deploy compiled contract to Arbitrum
 *     tags: [Deployment]
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
 *                 enum: [mainnet, sepolia, goerli]
 *               constructorParams:
 *                 type: array
 *               gasLimit:
 *                 type: string
 *               gasPrice:
 *                 type: string
 *               privateKey:
 *                 type: string
 *                 description: Private key for deployment (use with caution)
 */
router.post('/contract', validateDeploymentRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { 
    bytecode, 
    abi, 
    network = 'sepolia', 
    constructorParams = [], 
    gasLimit,
    gasPrice,
    privateKey
  } = req.body;
  
  try {
    logger.info(`Starting contract deployment session: ${sessionId} on ${network}`);
    
    // Emit deployment start event
    const io = req.app.get('socketio');
    io.to(`deployment-${sessionId}`).emit('deployment-status', {
      status: 'started',
      message: `Starting deployment on ${network}...`,
      sessionId
    });
    
    // Initialize deployer
    const deployer = new ContractDeployer(network);
    
    // Deploy contract
    const result = await deployer.deploy({
      bytecode,
      abi,
      constructorParams,
      gasLimit,
      gasPrice,
      privateKey
    }, {
      onProgress: (progress) => {
        io.to(`deployment-${sessionId}`).emit('deployment-progress', {
          ...progress,
          sessionId
        });
      }
    });
    
    // Start monitoring if deployment was successful
    if (result.success && result.txHash) {
      const monitor = new TransactionMonitor(network);
      monitor.startMonitoring(result.txHash, (status) => {
        io.to(`deployment-${sessionId}`).emit('transaction-update', {
          sessionId,
          txHash: result.txHash,
          ...status
        });
      });
    }
    
    // Cache deployment result
    await cacheManager.set(`deployment_${sessionId}`, result, 86400); // 24 hours
    
    // Emit completion event
    io.to(`deployment-${sessionId}`).emit('deployment-complete', {
      sessionId,
      success: result.success,
      ...result
    });
    
    logger.info(`Contract deployment completed for session: ${sessionId}, Success: ${result.success}`);
    
    res.json({
      success: result.success,
      sessionId,
      txHash: result.txHash,
      contractAddress: result.contractAddress,
      gasUsed: result.gasUsed,
      deploymentCost: result.deploymentCost,
      blockNumber: result.blockNumber,
      network,
      explorerUrl: result.explorerUrl,
      message: result.message
    });
    
  } catch (error) {
    logger.error(`Contract deployment failed for session ${sessionId}:`, error);
    
    const io = req.app.get('socketio');
    io.to(`deployment-${sessionId}`).emit('deployment-error', {
      sessionId,
      error: error.message,
      details: error.details || 'Unknown error occurred'
    });
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Deployment failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/deploy/estimate-gas:
 *   post:
 *     summary: Estimate gas cost for contract deployment
 *     tags: [Deployment]
 */
router.post('/estimate-gas', async (req, res) => {
  const { bytecode, abi, network = 'sepolia', constructorParams = [] } = req.body;
  
  try {
    logger.info(`Estimating gas for deployment on ${network}`);
    
    const deployer = new ContractDeployer(network);
    const gasEstimate = await deployer.estimateGas({
      bytecode,
      abi,
      constructorParams
    });
    
    res.json({
      success: true,
      network,
      gasEstimate: gasEstimate.gasLimit,
      gasPrice: gasEstimate.gasPrice,
      estimatedCost: gasEstimate.estimatedCost,
      estimatedCostUSD: gasEstimate.estimatedCostUSD,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error('Gas estimation failed:', error);
    
    res.status(500).json({
      success: false,
      error: 'Gas estimation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/deploy/verify:
 *   post:
 *     summary: Verify contract on block explorer
 *     tags: [Deployment]
 */
router.post('/verify', async (req, res) => {
  const sessionId = uuidv4();
  const { 
    contractAddress, 
    sourceCode, 
    contractName, 
    compilerVersion,
    network = 'sepolia',
    constructorParams = []
  } = req.body;
  
  try {
    logger.info(`Starting contract verification for ${contractAddress} on ${network}`);
    
    const deployer = new ContractDeployer(network);
    const result = await deployer.verifyContract({
      contractAddress,
      sourceCode,
      contractName,
      compilerVersion,
      constructorParams
    });
    
    // Cache verification result
    await cacheManager.set(`verification_${contractAddress}`, result, 86400);
    
    logger.info(`Contract verification completed for ${contractAddress}: ${result.success}`);
    
    res.json({
      success: result.success,
      sessionId,
      contractAddress,
      network,
      verificationUrl: result.verificationUrl,
      status: result.status,
      message: result.message
    });
    
  } catch (error) {
    logger.error(`Contract verification failed for ${contractAddress}:`, error);
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Verification failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/deploy/status/{sessionId}:
 *   get:
 *     summary: Get deployment status
 *     tags: [Deployment]
 */
router.get('/status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const deployment = await cacheManager.get(`deployment_${sessionId}`);
    
    if (!deployment) {
      return res.status(404).json({
        error: 'Deployment session not found',
        sessionId
      });
    }
    
    // Get transaction status if available
    let transactionStatus = null;
    if (deployment.txHash) {
      const monitor = new TransactionMonitor(deployment.network || 'sepolia');
      transactionStatus = await monitor.getTransactionStatus(deployment.txHash);
    }
    
    res.json({
      sessionId,
      deployment,
      transaction: transactionStatus
    });
    
  } catch (error) {
    logger.error(`Failed to get deployment status for session ${sessionId}:`, error);
    
    res.status(500).json({
      error: 'Failed to get deployment status',
      sessionId
    });
  }
});

/**
 * @swagger
 * /api/v1/deploy/transaction/{txHash}:
 *   get:
 *     summary: Get transaction details
 *     tags: [Deployment]
 */
router.get('/transaction/:txHash', async (req, res) => {
  const { txHash } = req.params;
  const { network = 'sepolia' } = req.query;
  
  try {
    const monitor = new TransactionMonitor(network);
    const transaction = await monitor.getTransactionDetails(txHash);
    
    if (!transaction) {
      return res.status(404).json({
        error: 'Transaction not found',
        txHash
      });
    }
    
    res.json({
      txHash,
      network,
      ...transaction
    });
    
  } catch (error) {
    logger.error(`Failed to get transaction details for ${txHash}:`, error);
    
    res.status(500).json({
      error: 'Failed to get transaction details',
      txHash
    });
  }
});

/**
 * @swagger
 * /api/v1/deploy/networks:
 *   get:
 *     summary: Get supported networks
 *     tags: [Deployment]
 */
router.get('/networks', (req, res) => {
  const networks = {
    mainnet: {
      name: 'Arbitrum One',
      chainId: 42161,
      rpcUrl: 'https://arb1.arbitrum.io/rpc',
      explorerUrl: 'https://arbiscan.io',
      currency: 'ETH',
      testnet: false
    },
    sepolia: {
      name: 'Arbitrum Sepolia',
      chainId: 421614,
      rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://sepolia.arbiscan.io',
      currency: 'ETH',
      testnet: true
    },
    goerli: {
      name: 'Arbitrum Goerli (Deprecated)',
      chainId: 421613,
      rpcUrl: 'https://goerli-rollup.arbitrum.io/rpc',
      explorerUrl: 'https://goerli.arbiscan.io',
      currency: 'ETH',
      testnet: true,
      deprecated: true
    }
  };
  
  res.json({
    networks,
    default: 'sepolia',
    recommended: 'sepolia'
  });
});

export default router;