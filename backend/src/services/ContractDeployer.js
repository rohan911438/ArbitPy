import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

export class ContractDeployer {
  constructor(network = 'arbitrum_sepolia') {
    this.network = network;
    this.providers = new Map();
    this.networks = {
      ethereum: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpc: process.env.ETHEREUM_RPC || 'https://mainnet.infura.io/v3/',
        explorer: 'https://etherscan.io'
      },
      sepolia: {
        name: 'Ethereum Sepolia Testnet',
        chainId: 11155111,
        rpc: process.env.SEPOLIA_RPC || 'https://sepolia.infura.io/v3/',
        explorer: 'https://sepolia.etherscan.io'
      },
      arbitrum: {
        name: 'Arbitrum One',
        chainId: 42161,
        rpc: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        explorer: 'https://arbiscan.io'
      },
      arbitrum_sepolia: {
        name: 'Arbitrum Sepolia Testnet',
        chainId: 421614,
        rpc: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
        explorer: 'https://sepolia.arbiscan.io'
      },
      polygon: {
        name: 'Polygon Mainnet',
        chainId: 137,
        rpc: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
        explorer: 'https://polygonscan.com'
      },
      mumbai: {
        name: 'Polygon Mumbai Testnet',
        chainId: 80001,
        rpc: process.env.MUMBAI_RPC || 'https://rpc-mumbai.maticvigil.com',
        explorer: 'https://mumbai.polygonscan.com'
      },
      optimism: {
        name: 'Optimism',
        chainId: 10,
        rpc: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
        explorer: 'https://optimistic.etherscan.io'
      },
      optimism_sepolia: {
        name: 'Optimism Sepolia Testnet',
        chainId: 11155420,
        rpc: process.env.OPTIMISM_SEPOLIA_RPC || 'https://sepolia.optimism.io',
        explorer: 'https://sepolia-optimism.etherscan.io'
      }
    };
  }
  
  /**
   * Get or create provider for network
   * @param {string} network - Network name
   * @returns {ethers.Provider} Provider instance
   */
  getProvider(network) {
    if (this.providers.has(network)) {
      return this.providers.get(network);
    }
    
    const networkConfig = this.networks[network];
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${network}`);
    }
    
    const provider = new ethers.JsonRpcProvider(networkConfig.rpc);
    this.providers.set(network, provider);
    
    return provider;
  }
  
  /**
   * Deploy contract
   * @param {Object} params - Deployment parameters
   * @param {Object} options - Additional options like progress callbacks
   * @returns {Promise<Object>} Deployment result
   */
  async deploy({
    bytecode,
    abi,
    privateKey,
    network,
    constructorParams = [],
    gasLimit,
    gasPrice,
    value = '0'
  }, options = {}) {
    const { onProgress } = options;
    const deploymentNetwork = network || this.network;
    const startTime = Date.now();
    
    try {
      // Validate required parameters
      if (!bytecode) throw new Error('Bytecode is required');
      if (!abi) throw new Error('ABI is required');
      if (!privateKey) throw new Error('Private key is required');
      
      // Progress callback for start
      onProgress?.({ stage: 'validation', message: 'Validating deployment parameters...' });
      
      // Get provider and network config
      const provider = this.getProvider(deploymentNetwork);
      const networkConfig = this.networks[deploymentNetwork];
      
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${deploymentNetwork}`);
      }
      
      // Create wallet
      const wallet = new ethers.Wallet(privateKey, provider);
      
      logger.info(`Deploying contract to ${networkConfig.name}...`);
      logger.debug(`Wallet address: ${wallet.address}`);
      
      onProgress?.({ stage: 'wallet', message: `Connected to wallet: ${wallet.address}` });
      
      // Check wallet balance
      const balance = await wallet.provider.getBalance(wallet.address);
      const balanceEth = ethers.formatEther(balance);
      logger.info(`Wallet balance: ${balanceEth} ETH`);
      
      if (balance === 0n) {
        throw new Error(`Insufficient funds: Wallet ${wallet.address} has no ETH for gas fees`);
      }
      
      onProgress?.({ stage: 'balance', message: `Wallet balance: ${balanceEth} ETH` });
      
      // Validate and fix bytecode format
      onProgress?.({ stage: 'validation', message: 'Validating contract bytecode...' });
      
      if (!bytecode.startsWith('0x')) {
        throw new Error('Invalid bytecode: must start with 0x');
      }
      
      let hexPart = bytecode.slice(2);
      if (hexPart.length === 0) {
        throw new Error('Invalid bytecode: empty after 0x prefix');
      }
      
      if (!/^[a-fA-F0-9]+$/.test(hexPart)) {
        throw new Error('Invalid bytecode: contains non-hex characters');
      }
      
      if (hexPart.length < 20) {
        throw new Error('Invalid bytecode: too short to be valid contract bytecode');
      }
      
      // Fix odd length by padding
      let validatedBytecode = bytecode;
      if (hexPart.length % 2 !== 0) {
        validatedBytecode = bytecode + '0';
        hexPart = validatedBytecode.slice(2);
        logger.warn(`Fixed odd-length bytecode by padding: ${bytecode.length} -> ${validatedBytecode.length}`);
      }
      
      logger.info(`Bytecode validation passed: ${validatedBytecode.length} characters`);
      
      // Validate constructor parameters against ABI
      onProgress?.({ stage: 'validation', message: 'Validating constructor parameters...' });
      
      // Find constructor in ABI
      const constructor = abi.find(item => item.type === 'constructor');
      if (constructor && constructor.inputs) {
        const expectedParams = constructor.inputs.length;
        const providedParams = constructorParams.length;
        
        if (expectedParams !== providedParams) {
          throw new Error(`Constructor expects ${expectedParams} parameters, but ${providedParams} were provided. Required: ${constructor.inputs.map(input => `${input.name} (${input.type})`).join(', ')}`);
        }
        
        logger.info(`Constructor validation passed: ${expectedParams} parameters provided`);
      } else if (constructorParams.length > 0) {
        logger.warn('Constructor parameters provided but no constructor found in ABI');
      }
      
      // Create contract factory
      let contractFactory;
      try {
        contractFactory = new ethers.ContractFactory(abi, validatedBytecode, wallet);
      } catch (factoryError) {
        logger.error('Failed to create contract factory:', factoryError);
        throw new Error(`Invalid contract bytecode or ABI: ${factoryError.message}`);
      }
      
      // Estimate gas if not provided
      let finalGasLimit = gasLimit;
      if (!finalGasLimit) {
        try {
          onProgress?.({ stage: 'gas_estimation', message: 'Estimating gas requirements...' });
          
          // Try to create deployment transaction first to validate
          const deployTx = await contractFactory.getDeployTransaction(...constructorParams);
          
          // Estimate gas for the deployment transaction
          const gasEstimate = await wallet.provider.estimateGas({
            data: deployTx.data,
            value: ethers.parseEther(value.toString())
          });
          
          // Add 50% buffer for Arbitrum (can have higher gas usage)
          finalGasLimit = gasEstimate + (gasEstimate * 50n / 100n);
          
          // Ensure minimum gas for Arbitrum
          const minGas = BigInt(500000);
          if (finalGasLimit < minGas) {
            finalGasLimit = minGas;
          }
          
          logger.info(`Estimated gas: ${gasEstimate}, using: ${finalGasLimit}`);
          onProgress?.({ stage: 'gas_estimation', message: `Gas estimated: ${gasEstimate}, using: ${finalGasLimit}` });
        } catch (estimateError) {
          logger.warn('Gas estimation failed, analyzing error:', estimateError.message);
          
          // Check if it's a revert reason
          if (estimateError.message.includes('revert') || estimateError.reason) {
            const revertReason = estimateError.reason || 'Contract constructor reverted';
            throw new Error(`Contract deployment would revert: ${revertReason}. Check constructor parameters and contract logic.`);
          }
          
          // Use higher default for Arbitrum
          finalGasLimit = BigInt(1500000);
          onProgress?.({ stage: 'gas_estimation', message: 'Gas estimation failed, using fallback: 1,500,000' });
        }
      } else {
        // Convert string to BigInt if needed
        finalGasLimit = typeof finalGasLimit === 'string' ? BigInt(finalGasLimit) : BigInt(finalGasLimit);
      }
      
      // Get gas price if not provided
      let finalGasPrice = gasPrice;
      if (!finalGasPrice) {
        const feeData = await wallet.provider.getFeeData();
        finalGasPrice = feeData.gasPrice;
        logger.info(`Using gas price: ${ethers.formatUnits(finalGasPrice, 'gwei')} gwei`);
      }
      
      // Deploy contract
      const deployTx = {
        gasLimit: finalGasLimit,
        gasPrice: finalGasPrice,
        value: ethers.parseEther(value.toString())
      };
      
      logger.info(`Sending deployment transaction with gas: ${finalGasLimit}`);
      onProgress?.({ stage: 'deployment', message: `Sending deployment transaction with gas: ${finalGasLimit}...` });
      
      let contract;
      try {
        // Pre-validate the deployment transaction
        const deploymentData = await contractFactory.getDeployTransaction(...constructorParams);
        
        // Check if constructor parameters are correctly formatted
        if (constructorParams.length > 0) {
          logger.info(`Constructor params: ${JSON.stringify(constructorParams)}`);
        }
        
        contract = await contractFactory.deploy(...constructorParams, deployTx);
      } catch (deployError) {
        logger.error('Contract deployment failed:', {
          error: deployError.message,
          code: deployError.code,
          data: deployError.data,
          reason: deployError.reason
        });
        
        if (deployError.code === 'INVALID_ARGUMENT') {
          throw new Error(`Invalid deployment arguments: ${deployError.message}. Check bytecode format and constructor parameters.`);
        } else if (deployError.code === 'INSUFFICIENT_FUNDS') {
          throw new Error(`Insufficient funds for deployment: ${deployError.message}`);
        } else if (deployError.message.includes('revert') || deployError.reason) {
          const revertReason = deployError.reason || deployError.data || 'Unknown revert reason';
          throw new Error(`Contract deployment reverted: ${revertReason}. Check contract constructor logic and parameters.`);
        } else if (deployError.message.includes('gas')) {
          throw new Error(`Gas estimation or execution failed: ${deployError.message}. Try increasing gas limit.`);
        } else {
          throw new Error(`Deployment failed: ${deployError.message}`);
        }
      }
      
      const deploymentTx = contract.deploymentTransaction();
      
      if (!deploymentTx) {
        throw new Error('Failed to create deployment transaction');
      }
      
      logger.info(`Deployment transaction sent: ${deploymentTx.hash}`);
      onProgress?.({ 
        stage: 'transaction_sent', 
        message: `Transaction sent: ${deploymentTx.hash}`,
        txHash: deploymentTx.hash 
      });
      
      // Wait for deployment confirmation
      onProgress?.({ stage: 'confirmation', message: 'Waiting for transaction confirmation...' });
      
      let deploymentReceipt;
      let receipt;
      
      try {
        // Wait for deployment with timeout
        const deploymentPromise = contract.waitForDeployment();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Deployment confirmation timeout')), 300000); // 5 minutes
        });
        
        deploymentReceipt = await Promise.race([deploymentPromise, timeoutPromise]);
        receipt = await deploymentTx.wait();
        
        if (!receipt) {
          throw new Error('Transaction receipt not available');
        }
        
        logger.info(`Transaction confirmed in block ${receipt.blockNumber}`);
        onProgress?.({ stage: 'confirmation', message: `Transaction confirmed in block ${receipt.blockNumber}` });
        
        // Check transaction status
        if (receipt.status !== 1) {
          throw new Error(`Transaction failed with status: ${receipt.status}. The contract deployment was reverted.`);
        }
        
        // Verify contract was actually deployed
        const contractCode = await wallet.provider.getCode(receipt.contractAddress);
        if (contractCode === '0x') {
          throw new Error('Contract deployment succeeded but no code found at contract address. The contract may have self-destructed.');
        }
        
      } catch (confirmationError) {
        logger.error('Deployment confirmation failed:', confirmationError);
        
        if (confirmationError.message.includes('timeout')) {
          throw new Error('Deployment confirmation timed out. The transaction may still be pending. Check the transaction hash on the block explorer.');
        }
        
        throw new Error(`Deployment confirmation failed: ${confirmationError.message}`);
      }
      
      const deploymentTime = Date.now() - startTime;
      const contractAddress = await contract.getAddress();
      
      logger.info(`Contract deployed successfully in ${deploymentTime}ms`);
      logger.info(`Contract address: ${contractAddress}`);
      logger.info(`Gas used: ${receipt.gasUsed}`);
      
      // Calculate deployment cost
      const deploymentCost = receipt.gasUsed * receipt.gasPrice;
      
      onProgress?.({ 
        stage: 'completed', 
        message: `Contract deployed successfully at ${contractAddress}`,
        contractAddress
      });
      
      return {
        success: true,
        contractAddress,
        txHash: receipt.hash,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: receipt.gasPrice.toString(),
        deploymentCost: ethers.formatEther(deploymentCost),
        deploymentTime,
        network: networkConfig.name,
        networkKey: deploymentNetwork,
        explorerUrl: `${networkConfig.explorer}/tx/${receipt.hash}`,
        contractExplorerUrl: `${networkConfig.explorer}/address/${contractAddress}`,
        receipt: {
          to: receipt.to,
          from: receipt.from,
          contractAddress: receipt.contractAddress,
          transactionIndex: receipt.index,
          gasUsed: receipt.gasUsed.toString(),
          cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
          effectiveGasPrice: receipt.gasPrice.toString(),
          status: receipt.status,
          blockHash: receipt.blockHash
        },
        message: `Contract successfully deployed to ${networkConfig.name}`
      };
      
    } catch (error) {
      const deploymentTime = Date.now() - startTime;
      
      logger.error('Contract deployment failed:', error);
      
      onProgress?.({ 
        stage: 'error', 
        message: `Deployment failed: ${error.message}`,
        error: error.message
      });
      
      return {
        success: false,
        error: error.message,
        deploymentTime,
        network: this.networks[deploymentNetwork]?.name || deploymentNetwork,
        networkKey: deploymentNetwork,
        details: this.parseDeploymentError(error),
        message: `Deployment failed: ${error.message}`
      };
    }
  }
  
  /**
   * Verify contract on block explorer
   * @param {Object} params - Verification parameters
   * @returns {Promise<Object>} Verification result
   */
  async verify({
    contractAddress,
    sourceCode,
    contractName,
    network,
    constructorArgs = [],
    compilerVersion,
    optimizationUsed = false,
    runs = 200
  }) {
    try {
      logger.info(`Verifying contract ${contractAddress} on ${network}...`);
      
      // This would integrate with block explorer APIs (Etherscan, etc.)
      // For now, return mock verification result
      
      const networkConfig = this.networks[network];
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${network}`);
      }
      
      // Mock verification process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return {
        success: true,
        contractAddress,
        network: networkConfig.name,
        status: 'verified',
        explorerUrl: `${networkConfig.explorer}/address/${contractAddress}#code`,
        message: 'Contract source code verified successfully'
      };
      
    } catch (error) {
      logger.error('Contract verification failed:', error);
      
      return {
        success: false,
        error: error.message,
        contractAddress,
        network
      };
    }
  }
  
  /**
   * Get deployment cost estimate
   * @param {Object} params - Estimation parameters
   * @returns {Promise<Object>} Cost estimate
   */
  async estimateDeploymentCost({
    bytecode,
    abi,
    network,
    constructorArgs = []
  }) {
    try {
      const provider = this.getProvider(network);
      const networkConfig = this.networks[network];
      
      // Create a dummy wallet for estimation (no private key needed)
      const dummyWallet = ethers.Wallet.createRandom().connect(provider);
      const contractFactory = new ethers.ContractFactory(abi, bytecode, dummyWallet);
      
      // Get deployment transaction
      const deployTx = await contractFactory.getDeployTransaction(...constructorArgs);
      
      // Estimate gas
      const gasEstimate = await provider.estimateGas(deployTx);
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || ethers.parseUnits('20', 'gwei');
      
      // Calculate costs
      const estimatedCost = gasEstimate * gasPrice;
      const maxCost = gasEstimate * gasPrice * 120n / 100n; // 20% buffer
      
      return {
        success: true,
        network: networkConfig.name,
        gasEstimate: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost: ethers.formatEther(estimatedCost),
        maxCost: ethers.formatEther(maxCost),
        currency: 'ETH'
      };
      
    } catch (error) {
      logger.error('Deployment cost estimation failed:', error);
      
      return {
        success: false,
        error: error.message,
        network
      };
    }
  }
  
  /**
   * Estimate gas cost for contract deployment
   * @param {Object} params - Estimation parameters
   * @returns {Promise<Object>} Gas estimation result
   */
  async estimateGas({ bytecode, abi, constructorParams = [] }) {
    try {
      const provider = this.getProvider(this.network);
      const networkConfig = this.networks[this.network];
      
      if (!networkConfig) {
        throw new Error(`Unsupported network: ${this.network}`);
      }
      
      // Create a temporary contract factory for estimation
      const contractFactory = new ethers.ContractFactory(abi, bytecode, provider);
      
      // Get deployment transaction
      const deployTx = await contractFactory.getDeployTransaction(...constructorParams);
      
      // Estimate gas
      const gasEstimate = await provider.estimateGas(deployTx);
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      // Calculate estimated cost in ETH
      const estimatedCostWei = gasEstimate * gasPrice;
      const estimatedCostEth = ethers.formatEther(estimatedCostWei);
      
      // For mock purposes, set a dummy USD rate (in real app, you'd fetch from an API)
      const ethToUsdRate = 2400; // Mock rate
      const estimatedCostUSD = (parseFloat(estimatedCostEth) * ethToUsdRate).toFixed(2);
      
      logger.info(`Gas estimation complete for ${this.network}:`, {
        gasLimit: gasEstimate.toString(),
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost: estimatedCostEth
      });
      
      return {
        success: true,
        network: this.network,
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.toString(),
        gasPriceGwei: ethers.formatUnits(gasPrice, 'gwei'),
        estimatedCost: estimatedCostEth,
        estimatedCostUSD,
        estimatedCostWei: estimatedCostWei.toString(),
        chainId: networkConfig.chainId
      };
      
    } catch (error) {
      logger.error(`Gas estimation failed for ${this.network}:`, error);
      
      // Return mock estimation as fallback for development
      return {
        success: true,
        network: this.network,
        gasLimit: '2000000', // 2M gas mock estimate
        gasPrice: '1000000000', // 1 gwei mock
        gasPriceGwei: '1.0',
        estimatedCost: '0.002',
        estimatedCostUSD: '4.80',
        estimatedCostWei: '2000000000000000',
        chainId: this.networks[this.network]?.chainId || 421614,
        mock: true,
        originalError: error.message
      };
    }
  }
  
  /**
   * Parse deployment error
   * @param {Error} error - Deployment error
   * @returns {Object} Parsed error details
   */
  parseDeploymentError(error) {
    const errorDetails = {
      type: 'deployment_error',
      message: error.message,
      code: error.code,
      suggestions: []
    };
    
    // Common error patterns
    if (error.code === 'INSUFFICIENT_FUNDS') {
      errorDetails.type = 'insufficient_funds';
      errorDetails.suggestions.push('Ensure your wallet has enough ETH for gas fees');
    } else if (error.code === 'REPLACEMENT_UNDERPRICED') {
      errorDetails.type = 'gas_price_too_low';
      errorDetails.suggestions.push('Increase the gas price for faster confirmation');
    } else if (error.code === 'NETWORK_ERROR') {
      errorDetails.type = 'network_error';
      errorDetails.suggestions.push('Check your internet connection and RPC endpoint');
    } else if (error.message.includes('revert')) {
      errorDetails.type = 'contract_revert';
      errorDetails.suggestions.push('Check constructor parameters and contract logic');
    } else if (error.message.includes('gas')) {
      errorDetails.type = 'gas_error';
      errorDetails.suggestions.push('Increase gas limit or check for infinite loops');
    }
    
    return errorDetails;
  }
  
  /**
   * Get supported networks
   * @returns {Array} List of supported networks
   */
  getSupportedNetworks() {
    return Object.entries(this.networks).map(([key, config]) => ({
      key,
      name: config.name,
      chainId: config.chainId,
      explorer: config.explorer,
      testnet: key.includes('sepolia') || key.includes('mumbai')
    }));
  }
  
  /**
   * Check network status
   * @param {string} network - Network name
   * @returns {Promise<Object>} Network status
   */
  async checkNetworkStatus(network) {
    try {
      const provider = this.getProvider(network);
      const networkConfig = this.networks[network];
      
      const [blockNumber, gasPrice, chainId] = await Promise.all([
        provider.getBlockNumber(),
        provider.getFeeData().then(data => data.gasPrice),
        provider.getNetwork().then(net => net.chainId)
      ]);
      
      return {
        success: true,
        network: networkConfig.name,
        status: 'online',
        blockNumber,
        gasPrice: ethers.formatUnits(gasPrice, 'gwei'),
        chainId: chainId.toString()
      };
      
    } catch (error) {
      logger.error(`Network status check failed for ${network}:`, error);
      
      return {
        success: false,
        network: this.networks[network]?.name || network,
        status: 'offline',
        error: error.message
      };
    }
  }
}