import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import { validateDeploymentRequest } from '../middleware/validation.js';
import { ContractDeployer } from '../services/ContractDeployer.js';
import { TransactionMonitor } from '../services/TransactionMonitor.js';
import { DeploymentDiagnostics } from '../utils/deploymentDiagnostics.js';

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
    network = 'arbitrum_sepolia', 
    constructorParams = [], 
    gasLimit,
    gasPrice,
    privateKey
  } = req.body;
  
  // Debug logging to see exactly what we received
  console.log('=== DEPLOYMENT REQUEST DEBUG ===');
  console.log('Received bytecode type:', typeof bytecode);
  console.log('Received bytecode starts with 0x:', bytecode?.startsWith('0x'));
  console.log('Received bytecode length:', bytecode?.length);
  console.log('Received bytecode hex length:', bytecode?.slice(2)?.length);
  console.log('Received bytecode has even length:', (bytecode?.slice(2)?.length % 2 === 0));
  console.log('Received bytecode (first 100 chars):', bytecode?.substring(0, 100));
  console.log('Received ABI length:', abi?.length);
  console.log('=== END DEPLOYMENT DEBUG ===');
  
  let deploymentResult = null;
  
  try {
    logger.info(`Starting contract deployment session: ${sessionId} on ${network}`);
    
    // Emit deployment start event
    const io = req.app.get('socketio');
    if (io) {
      io.to(`deployment-${sessionId}`).emit('deployment-status', {
        status: 'started',
        message: `Starting deployment on ${network}...`,
        sessionId,
        timestamp: new Date().toISOString()
      });
    }
    
    // Validate network
    const validNetworks = ['mainnet', 'arbitrum_sepolia', 'sepolia', 'goerli'];
    if (!validNetworks.includes(network)) {
      throw new Error(`Invalid network: ${network}. Supported networks: ${validNetworks.join(', ')}`);
    }
    
    // Validate private key format
    if (!privateKey || !privateKey.startsWith('0x') || privateKey.length !== 66) {
      throw new Error('Invalid private key format. Must be 64 hex characters with 0x prefix');
    }
    
    // Validate bytecode format
    if (!bytecode || !bytecode.startsWith('0x') || bytecode.length < 10) {
      throw new Error('Invalid bytecode format. Must be hex string with 0x prefix and contain actual contract bytecode');
    }
    
    // Check if bytecode looks like actual contract bytecode (not source code)
    if (bytecode.length < 100) {
      throw new Error('Bytecode appears to be too short for a valid contract. Ensure you are using compiled bytecode, not source code.');
    }
    
    // Validate hex format after 0x
    const hexPart = bytecode.slice(2);
    if (!/^[a-fA-F0-9]*$/.test(hexPart)) {
      throw new Error('Bytecode contains invalid characters. Must be valid hexadecimal');
    }
    
    if (hexPart.length % 2 !== 0) {
      logger.error(`Received malformed bytecode with odd length: ${bytecode.length} total chars, ${hexPart.length} hex chars`);
      logger.error(`Bytecode: ${bytecode.substring(0, 100)}...`);
      throw new Error(`Bytecode has odd length (${hexPart.length} hex chars). This indicates the bytecode was corrupted during compilation or transmission.`);
    }
    
    // Initialize deployer with proper network mapping
    const networkMap = {
      'sepolia': 'arbitrum_sepolia',
      'mainnet': 'arbitrum',
      'goerli': 'arbitrum_sepolia'
    };
    
    const deploymentNetwork = networkMap[network] || network;
    const deployer = new ContractDeployer(deploymentNetwork);
    
    logger.info(`Deploying to network: ${deploymentNetwork}`);
    
    logger.info(`Deploying contract with validated bytecode length: ${bytecode.length} characters`);
    
    // Deploy contract with enhanced progress tracking
    deploymentResult = await deployer.deploy({
      bytecode, // Use original bytecode without modification
      abi,
      constructorParams,
      gasLimit,
      gasPrice,
      privateKey,
      network: deploymentNetwork
    }, {
      onProgress: (progress) => {
        logger.debug(`Deployment progress: ${progress.stage} - ${progress.message}`);
        
        if (io) {
          io.to(`deployment-${sessionId}`).emit('deployment-progress', {
            ...progress,
            sessionId,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
    
    // Enhanced deployment result validation
    if (!deploymentResult) {
      throw new Error('Deployment returned null result');
    }
    
    if (!deploymentResult.success) {
      throw new Error(deploymentResult.error || deploymentResult.message || 'Deployment failed for unknown reason');
    }
    
    if (!deploymentResult.txHash) {
      throw new Error('Deployment succeeded but no transaction hash returned');
    }
    
    if (!deploymentResult.contractAddress) {
      throw new Error('Deployment succeeded but no contract address returned');
    }
    
    logger.info(`Contract deployed successfully: ${deploymentResult.contractAddress} (tx: ${deploymentResult.txHash})`);
    
    // Start transaction monitoring with enhanced error handling
    try {
      const monitor = new TransactionMonitor(deploymentNetwork);
      
      // Wait for confirmation with detailed progress
      const confirmationResult = await monitor.waitForConfirmation(
        deploymentResult.txHash,
        2, // Wait for 2 confirmations
        (status) => {
          logger.debug(`Transaction ${deploymentResult.txHash} status: ${status.status} (${status.confirmations} confirmations)`);
          
          if (io) {
            io.to(`deployment-${sessionId}`).emit('transaction-update', {
              sessionId,
              txHash: deploymentResult.txHash,
              ...status,
              timestamp: new Date().toISOString()
            });
          }
        }
      );
      
      // Update deployment result with confirmation details
      deploymentResult = {
        ...deploymentResult,
        confirmed: true,
        finalConfirmations: confirmationResult.confirmations,
        finalStatus: confirmationResult.status
      };
      
    } catch (monitorError) {
      logger.warn(`Transaction monitoring failed, but deployment may have succeeded:`, monitorError);
      
      // Don't fail the entire deployment if monitoring fails
      deploymentResult.monitoringError = monitorError.message;
      deploymentResult.confirmed = false;
    }
    
    // Cache deployment result with extended TTL
    await cacheManager.set(`deployment_${sessionId}`, {
      ...deploymentResult,
      network: deploymentNetwork,
      originalNetwork: network,
      timestamp: new Date().toISOString()
    }, 86400 * 7); // 7 days
    
    // Emit completion event
    if (io) {
      io.to(`deployment-${sessionId}`).emit('deployment-complete', {
        sessionId,
        success: true,
        ...deploymentResult,
        timestamp: new Date().toISOString()
      });
    }
    
    logger.info(`Contract deployment completed successfully for session: ${sessionId}`);
    
    // Enhanced response with all relevant deployment information
    res.json({
      success: true,
      sessionId,
      txHash: deploymentResult.txHash,
      transactionHash: deploymentResult.txHash,
      contractAddress: deploymentResult.contractAddress,
      gasUsed: deploymentResult.gasUsed,
      gasPrice: deploymentResult.gasPrice,
      deploymentCost: deploymentResult.deploymentCost,
      deploymentTime: deploymentResult.deploymentTime,
      blockNumber: deploymentResult.blockNumber,
      network: deploymentResult.network,
      networkKey: deploymentNetwork,
      explorerUrl: deploymentResult.explorerUrl,
      contractExplorerUrl: deploymentResult.contractExplorerUrl,
      confirmed: deploymentResult.confirmed,
      finalConfirmations: deploymentResult.finalConfirmations,
      message: deploymentResult.message || 'Contract deployed successfully',
      receipt: deploymentResult.receipt,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    logger.error(`Contract deployment failed for session ${sessionId}:`, error);
    logger.error(`Stack trace:`, error.stack);
    
    // Generate diagnostics for failed deployment
    let diagnostics = null;
    let troubleshootingReport = null;
    
    try {
      // Create deployer instance to get provider
      const deployer = new ContractDeployer(deploymentNetwork);
      const provider = deployer.getProvider(deploymentNetwork);
      
      // Get transaction hash if deployment got that far
      const txHash = deploymentResult?.txHash || deploymentResult?.transactionHash;
      
      // Analyze the failure
      diagnostics = await DeploymentDiagnostics.analyzeFailedDeployment({
        provider,
        txHash,
        bytecode,
        abi,
        constructorParams,
        gasLimit,
        gasPrice
      });
      
      troubleshootingReport = DeploymentDiagnostics.generateTroubleshootingReport(diagnostics, error);
      
      logger.info(`Generated troubleshooting report for session ${sessionId}`, troubleshootingReport);
      
    } catch (diagError) {
      logger.warn(`Failed to generate diagnostics: ${diagError.message}`);
    }
    
    const io = req.app.get('socketio');
    if (io) {
      io.to(`deployment-${sessionId}`).emit('deployment-error', {
        sessionId,
        error: error.message,
        details: error.details || error.message,
        diagnostics,
        troubleshootingReport,
        timestamp: new Date().toISOString()
      });
    }
    
    // Cache error for debugging
    await cacheManager.set(`deployment_error_${sessionId}`, {
      error: error.message,
      stack: error.stack,
      deploymentResult,
      diagnostics,
      troubleshootingReport,
      timestamp: new Date().toISOString()
    }, 86400);
    
    // Determine appropriate HTTP status code
    let statusCode = 500;
    if (error.message.includes('Invalid') || error.message.includes('validation')) {
      statusCode = 400;
    } else if (error.message.includes('Insufficient funds') || error.message.includes('balance')) {
      statusCode = 402; // Payment Required
    } else if (error.message.includes('network') || error.message.includes('RPC')) {
      statusCode = 503; // Service Unavailable
    } else if (error.message.includes('revert') || error.message.includes('reverted')) {
      statusCode = 422; // Unprocessable Entity
    }
    
    res.status(statusCode).json({
      success: false,
      sessionId,
      error: 'Deployment failed',
      message: error.message,
      details: error.details || 'Check logs for more information',
      network: deploymentNetwork,
      troubleshooting: troubleshootingReport,
      diagnostics: diagnostics?.issues || [],
      suggestions: diagnostics?.suggestions || [],
      txHash: deploymentResult?.txHash || deploymentResult?.transactionHash,
      timestamp: new Date().toISOString()
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
  const { bytecode, abi, network = 'arbitrum_sepolia', constructorParams = [] } = req.body;
  
  try {
    logger.info(`Estimating gas for deployment on ${network}`);
    
    // Validate network
    const validNetworks = ['mainnet', 'arbitrum_sepolia', 'sepolia', 'goerli', 'arbitrum'];
    if (!validNetworks.includes(network)) {
      throw new Error(`Invalid network: ${network}. Supported networks: ${validNetworks.join(', ')}`);
    }
    
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