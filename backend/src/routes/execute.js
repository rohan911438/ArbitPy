import express from 'express';
import { ethers } from 'ethers';
import { body, validationResult } from 'express-validator';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/execute/function:
 *   post:
 *     summary: Execute a function on a deployed contract
 *     tags: [Execute]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contractAddress
 *               - abi
 *               - functionName
 *               - network
 *             properties:
 *               contractAddress:
 *                 type: string
 *                 description: Address of the deployed contract
 *               abi:
 *                 type: array
 *                 description: Contract ABI
 *               functionName:
 *                 type: string
 *                 description: Name of the function to call
 *               parameters:
 *                 type: array
 *                 description: Parameters to pass to the function
 *               network:
 *                 type: string
 *                 description: Network to execute on
 *               privateKey:
 *                 type: string
 *                 description: Private key for write operations (optional)
 *               gasLimit:
 *                 type: string
 *                 description: Gas limit (optional)
 *               gasPrice:
 *                 type: string
 *                 description: Gas price (optional)
 *               value:
 *                 type: string
 *                 description: ETH value to send with transaction (optional)
 */
router.post('/function', [
  body('contractAddress').isEthereumAddress().withMessage('Valid contract address required'),
  body('abi').isArray().withMessage('ABI must be an array'),
  body('functionName').notEmpty().withMessage('Function name is required'),
  body('network').notEmpty().withMessage('Network is required'),
  body('parameters').optional().isArray().withMessage('Parameters must be an array'),
  body('privateKey').optional().isString(),
  body('gasLimit').optional().isString(),
  body('gasPrice').optional().isString(),
  body('value').optional().isString()
], async (req, res) => {
  try {
    // Validate request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      contractAddress,
      abi,
      functionName,
      parameters = [],
      network,
      privateKey,
      gasLimit,
      gasPrice,
      value = '0'
    } = req.body;

    logger.info(`Executing function ${functionName} on contract ${contractAddress} on ${network}`);

    // Get provider for network
    const provider = getProvider(network);
    if (!provider) {
      return res.status(400).json({
        success: false,
        message: `Unsupported network: ${network}`
      });
    }

    // Create contract instance
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Check if function exists in ABI
    const functionFragment = abi.find(item => 
      item.type === 'function' && item.name === functionName
    );

    if (!functionFragment) {
      return res.status(400).json({
        success: false,
        message: `Function ${functionName} not found in contract ABI`
      });
    }

    // Determine if this is a read or write operation
    const isReadOnly = functionFragment.stateMutability === 'view' || 
                      functionFragment.stateMutability === 'pure';

    let result;
    let txHash = null;
    let gasUsed = null;

    if (isReadOnly) {
      // Read-only function call
      try {
        result = await contract[functionName](...parameters);
        
        // Format result for JSON response
        if (result && typeof result === 'object' && result._isBigNumber) {
          result = result.toString();
        } else if (Array.isArray(result)) {
          result = result.map(item => 
            item && typeof item === 'object' && item._isBigNumber ? item.toString() : item
          );
        }

        logger.info(`Read function ${functionName} executed successfully`);

        return res.json({
          success: true,
          type: 'read',
          result,
          functionName,
          parameters,
          contractAddress,
          network
        });

      } catch (error) {
        logger.error(`Read function execution failed: ${error.message}`);
        return res.status(400).json({
          success: false,
          message: `Function execution failed: ${error.message}`
        });
      }

    } else {
      // Write function - requires private key
      if (!privateKey) {
        return res.status(400).json({
          success: false,
          message: 'Private key required for write operations'
        });
      }

      try {
        // Create signer
        const wallet = new ethers.Wallet(privateKey, provider);
        const contractWithSigner = contract.connect(wallet);

        // Prepare transaction options
        const txOptions = {};
        if (gasLimit) txOptions.gasLimit = gasLimit;
        if (gasPrice) txOptions.gasPrice = gasPrice;
        if (value !== '0') txOptions.value = ethers.parseEther(value);

        // Execute transaction
        const tx = await contractWithSigner[functionName](...parameters, txOptions);
        txHash = tx.hash;

        logger.info(`Write function ${functionName} transaction sent: ${txHash}`);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        gasUsed = receipt.gasUsed.toString();

        logger.info(`Write function ${functionName} confirmed in block ${receipt.blockNumber}`);

        return res.json({
          success: true,
          type: 'write',
          txHash,
          blockNumber: receipt.blockNumber,
          gasUsed,
          functionName,
          parameters,
          contractAddress,
          network,
          explorerUrl: getExplorerUrl(network, txHash)
        });

      } catch (error) {
        logger.error(`Write function execution failed: ${error.message}`);
        return res.status(400).json({
          success: false,
          message: `Transaction failed: ${error.message}`,
          txHash
        });
      }
    }

  } catch (error) {
    logger.error(`Function execution error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/execute/simulate:
 *   post:
 *     summary: Simulate function execution without sending transaction
 *     tags: [Execute]
 */
router.post('/simulate', [
  body('contractAddress').isEthereumAddress().withMessage('Valid contract address required'),
  body('abi').isArray().withMessage('ABI must be an array'),
  body('functionName').notEmpty().withMessage('Function name is required'),
  body('network').notEmpty().withMessage('Network is required'),
  body('parameters').optional().isArray().withMessage('Parameters must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      contractAddress,
      abi,
      functionName,
      parameters = [],
      network,
      fromAddress = '0x0000000000000000000000000000000000000001'
    } = req.body;

    const provider = getProvider(network);
    const contract = new ethers.Contract(contractAddress, abi, provider);

    // Simulate the call
    try {
      const result = await contract[functionName].staticCall(...parameters, {
        from: fromAddress
      });

      res.json({
        success: true,
        result: formatResult(result),
        functionName,
        parameters,
        contractAddress,
        network
      });

    } catch (error) {
      res.status(400).json({
        success: false,
        message: `Simulation failed: ${error.message}`
      });
    }

  } catch (error) {
    logger.error(`Function simulation error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Helper functions
function getProvider(network) {
  const providers = {
    mainnet: 'https://eth.llamarpc.com',
    sepolia: 'https://ethereum-sepolia.blockpi.network/v1/rpc/public',
    arbitrum: 'https://arb1.arbitrum.io/rpc',
    arbitrum_sepolia: 'https://sepolia-rollup.arbitrum.io/rpc',
    polygon: 'https://polygon.llamarpc.com',
    optimism: 'https://op-pokt.nodies.app'
  };

  const rpcUrl = providers[network];
  if (!rpcUrl) return null;

  return new ethers.JsonRpcProvider(rpcUrl);
}

function getExplorerUrl(network, txHash) {
  const explorers = {
    mainnet: `https://etherscan.io/tx/${txHash}`,
    sepolia: `https://sepolia.etherscan.io/tx/${txHash}`,
    arbitrum: `https://arbiscan.io/tx/${txHash}`,
    arbitrum_sepolia: `https://sepolia.arbiscan.io/tx/${txHash}`,
    polygon: `https://polygonscan.com/tx/${txHash}`,
    optimism: `https://optimistic.etherscan.io/tx/${txHash}`
  };

  return explorers[network] || '#';
}

function formatResult(result) {
  if (result && typeof result === 'object' && result._isBigNumber) {
    return result.toString();
  } else if (Array.isArray(result)) {
    return result.map(item => 
      item && typeof item === 'object' && item._isBigNumber ? item.toString() : item
    );
  }
  return result;
}

export default router;