import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';

export class TransactionMonitor {
  constructor(network) {
    this.network = network;
    this.providers = new Map();
    this.networks = {
      mainnet: {
        name: 'Arbitrum One',
        chainId: 42161,
        rpcUrl: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
        explorerUrl: 'https://arbiscan.io'
      },
      sepolia: {
        name: 'Arbitrum Sepolia',
        chainId: 421614,
        rpcUrl: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
        explorerUrl: 'https://sepolia.arbiscan.io'
      },
      goerli: {
        name: 'Arbitrum Goerli (Deprecated)',
        chainId: 421613,
        rpcUrl: process.env.ARBITRUM_GOERLI_RPC || 'https://goerli-rollup.arbitrum.io/rpc',
        explorerUrl: 'https://goerli.arbiscan.io'
      },
      ethereum: {
        name: 'Ethereum Mainnet',
        chainId: 1,
        rpcUrl: process.env.ETHEREUM_RPC || 'https://mainnet.infura.io/v3/',
        explorerUrl: 'https://etherscan.io'
      }
    };
    
    this.activeMonitors = new Map(); // Store active monitoring processes
    this.confirmationThreshold = 2; // Number of confirmations to wait for
  }

  /**
   * Get provider for the specified network
   * @param {string} network - Network name
   * @returns {ethers.Provider} Provider instance
   */
  getProvider(network = this.network) {
    if (this.providers.has(network)) {
      return this.providers.get(network);
    }

    const networkConfig = this.networks[network];
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    this.providers.set(network, provider);
    
    return provider;
  }

  /**
   * Start monitoring a transaction
   * @param {string} txHash - Transaction hash to monitor
   * @param {Function} onUpdate - Callback for status updates
   * @param {Object} options - Monitoring options
   */
  async startMonitoring(txHash, onUpdate, options = {}) {
    const {
      timeout = 300000, // 5 minutes default timeout
      confirmations = this.confirmationThreshold,
      pollInterval = 5000 // 5 seconds
    } = options;

    if (!txHash || !txHash.startsWith('0x')) {
      throw new Error('Invalid transaction hash');
    }

    logger.info(`Starting transaction monitoring for ${txHash} on ${this.network}`);
    
    try {
      const provider = this.getProvider();
      const networkConfig = this.networks[this.network];
      
      // Initial status
      onUpdate?.({
        status: 'pending',
        confirmations: 0,
        message: 'Transaction submitted, waiting for confirmation...',
        explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
      });

      const startTime = Date.now();
      let confirmed = false;
      let receipt = null;

      // Create monitoring promise with timeout
      const monitoringPromise = new Promise((resolve, reject) => {
        const monitorId = setInterval(async () => {
          try {
            // Check timeout
            if (Date.now() - startTime > timeout) {
              clearInterval(monitorId);
              this.activeMonitors.delete(txHash);
              reject(new Error(`Transaction monitoring timed out after ${timeout / 1000} seconds`));
              return;
            }

            // Get transaction receipt
            const currentReceipt = await provider.getTransactionReceipt(txHash);
            
            if (currentReceipt) {
              receipt = currentReceipt;
              const currentBlock = await provider.getBlockNumber();
              const confirmationCount = currentBlock - currentReceipt.blockNumber;

              // Update status based on confirmations
              if (confirmationCount >= confirmations) {
                if (!confirmed) {
                  confirmed = true;
                  clearInterval(monitorId);
                  this.activeMonitors.delete(txHash);

                  const finalStatus = {
                    status: currentReceipt.status === 1 ? 'confirmed' : 'failed',
                    confirmations: confirmationCount,
                    blockNumber: currentReceipt.blockNumber,
                    gasUsed: currentReceipt.gasUsed.toString(),
                    effectiveGasPrice: currentReceipt.gasPrice?.toString(),
                    transactionIndex: currentReceipt.index,
                    contractAddress: currentReceipt.contractAddress,
                    message: currentReceipt.status === 1 
                      ? `Transaction confirmed with ${confirmationCount} confirmations`
                      : 'Transaction failed during execution',
                    explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`,
                    receipt: this.formatReceipt(currentReceipt)
                  };

                  onUpdate?.(finalStatus);
                  resolve(finalStatus);
                }
              } else {
                // Still waiting for confirmations
                onUpdate?.({
                  status: 'confirming',
                  confirmations: confirmationCount,
                  blockNumber: currentReceipt.blockNumber,
                  message: `Transaction mined, waiting for confirmations (${confirmationCount}/${confirmations})`,
                  explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
                });
              }
            } else {
              // Transaction still pending
              onUpdate?.({
                status: 'pending',
                confirmations: 0,
                message: 'Transaction submitted, waiting to be mined...',
                explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
              });
            }
          } catch (error) {
            logger.error(`Error monitoring transaction ${txHash}:`, error);
            clearInterval(monitorId);
            this.activeMonitors.delete(txHash);
            
            onUpdate?.({
              status: 'error',
              confirmations: 0,
              error: error.message,
              message: `Error monitoring transaction: ${error.message}`,
              explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
            });
            
            reject(error);
          }
        }, pollInterval);

        // Store monitoring ID for cleanup
        this.activeMonitors.set(txHash, monitorId);
      });

      return await monitoringPromise;

    } catch (error) {
      logger.error(`Failed to start monitoring transaction ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Get current transaction status
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction status
   */
  async getTransactionStatus(txHash) {
    try {
      const provider = this.getProvider();
      const networkConfig = this.networks[this.network];
      
      const [transaction, receipt] = await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash)
      ]);

      if (!transaction) {
        return {
          found: false,
          status: 'not_found',
          message: 'Transaction not found on blockchain',
          explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
        };
      }

      if (!receipt) {
        return {
          found: true,
          status: 'pending',
          confirmations: 0,
          message: 'Transaction is pending confirmation',
          transaction: this.formatTransaction(transaction),
          explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
        };
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        found: true,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.gasPrice?.toString(),
        contractAddress: receipt.contractAddress,
        message: receipt.status === 1 
          ? `Transaction confirmed with ${confirmations} confirmations`
          : 'Transaction failed during execution',
        transaction: this.formatTransaction(transaction),
        receipt: this.formatReceipt(receipt),
        explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`
      };

    } catch (error) {
      logger.error(`Failed to get transaction status for ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed transaction information
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Detailed transaction info
   */
  async getTransactionDetails(txHash) {
    try {
      const provider = this.getProvider();
      const networkConfig = this.networks[this.network];

      const [transaction, receipt, block] = await Promise.all([
        provider.getTransaction(txHash),
        provider.getTransactionReceipt(txHash),
        provider.getTransaction(txHash).then(tx => tx ? provider.getBlock(tx.blockNumber) : null)
      ]);

      if (!transaction) {
        return null;
      }

      const currentBlock = await provider.getBlockNumber();
      const confirmations = receipt ? currentBlock - receipt.blockNumber : 0;

      return {
        hash: txHash,
        status: receipt ? (receipt.status === 1 ? 'success' : 'failed') : 'pending',
        confirmations,
        block: block ? {
          number: block.number,
          timestamp: block.timestamp,
          hash: block.hash
        } : null,
        transaction: this.formatTransaction(transaction),
        receipt: receipt ? this.formatReceipt(receipt) : null,
        network: networkConfig.name,
        explorerUrl: `${networkConfig.explorerUrl}/tx/${txHash}`,
        contractAddress: receipt?.contractAddress
      };

    } catch (error) {
      logger.error(`Failed to get transaction details for ${txHash}:`, error);
      throw error;
    }
  }

  /**
   * Wait for transaction confirmation with detailed progress
   * @param {string} txHash - Transaction hash
   * @param {number} confirmations - Number of confirmations to wait for
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<Object>} Final confirmation result
   */
  async waitForConfirmation(txHash, confirmations = 2, onProgress = null) {
    logger.info(`Waiting for ${confirmations} confirmations for transaction ${txHash}`);
    
    return new Promise((resolve, reject) => {
      this.startMonitoring(txHash, (status) => {
        onProgress?.(status);
        
        if (status.status === 'confirmed' || status.status === 'failed') {
          resolve(status);
        } else if (status.status === 'error') {
          reject(new Error(status.error || 'Transaction monitoring failed'));
        }
      }, { confirmations, timeout: 600000 }); // 10 minute timeout
    });
  }

  /**
   * Format transaction object for API response
   * @param {Object} transaction - Raw transaction object
   * @returns {Object} Formatted transaction
   */
  formatTransaction(transaction) {
    return {
      hash: transaction.hash,
      to: transaction.to,
      from: transaction.from,
      value: transaction.value.toString(),
      gasLimit: transaction.gasLimit.toString(),
      gasPrice: transaction.gasPrice?.toString(),
      maxFeePerGas: transaction.maxFeePerGas?.toString(),
      maxPriorityFeePerGas: transaction.maxPriorityFeePerGas?.toString(),
      nonce: transaction.nonce,
      data: transaction.data,
      chainId: transaction.chainId
    };
  }

  /**
   * Format transaction receipt for API response  
   * @param {Object} receipt - Raw transaction receipt
   * @returns {Object} Formatted receipt
   */
  formatReceipt(receipt) {
    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      blockHash: receipt.blockHash,
      transactionIndex: receipt.index,
      from: receipt.from,
      to: receipt.to,
      gasUsed: receipt.gasUsed.toString(),
      cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
      effectiveGasPrice: receipt.gasPrice?.toString(),
      status: receipt.status,
      contractAddress: receipt.contractAddress,
      logs: receipt.logs?.map(log => ({
        address: log.address,
        topics: log.topics,
        data: log.data,
        blockNumber: log.blockNumber,
        transactionIndex: log.transactionIndex,
        logIndex: log.index
      })) || []
    };
  }

  /**
   * Stop monitoring a transaction
   * @param {string} txHash - Transaction hash
   */
  stopMonitoring(txHash) {
    const monitorId = this.activeMonitors.get(txHash);
    if (monitorId) {
      clearInterval(monitorId);
      this.activeMonitors.delete(txHash);
      logger.info(`Stopped monitoring transaction ${txHash}`);
    }
  }

  /**
   * Stop all active monitoring
   */
  stopAllMonitoring() {
    for (const [txHash, monitorId] of this.activeMonitors) {
      clearInterval(monitorId);
    }
    this.activeMonitors.clear();
    logger.info('Stopped all transaction monitoring');
  }

  /**
   * Get network information
   * @returns {Object} Network configuration
   */
  getNetworkInfo() {
    return this.networks[this.network];
  }
}