import { ethers } from 'ethers';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';

/**
 * ArbitPy Master Contract Service
 * Handles all blockchain interactions with the deployed ArbitPyMaster contract
 */
class ArbitPyMasterService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY');
    this.contractAddress = process.env.ARBITPY_MASTER_ADDRESS || '';
    
    // Contract ABI (you'll get this from Remix after deployment)
    this.contractABI = [
      // Simplified ABI - you'll replace this with the full ABI from compilation
      "function getPlatformStats() view returns (uint256 totalTVL, uint256 totalVolume, uint256 totalArbitrageProfit, uint256 totalPoolCount)",
      "function getUserPosition(address user) view returns (uint256 totalDeposited, uint256 totalWithdrawn, uint256 pendingRewards, uint256 lastInteractionBlock)",
      "function getPoolInfo(uint256 poolId) view returns (address token, uint256 totalSupply, uint256 rewardRate, uint256 lastRewardBlock, uint256 accRewardPerShare, bool active)",
      "function getUserTokenBalance(address user, address token) view returns (uint256)",
      "function totalTVL() view returns (uint256)",
      "function totalVolume() view returns (uint256)",
      "function totalArbitrageProfit() view returns (uint256)",
      "function platformFee() view returns (uint256)",
      "function flashLoansEnabled() view returns (bool)",
      "function arbitrageEnabled() view returns (bool)",
      
      // Events for monitoring
      "event ArbitrageExecuted(address indexed user, address tokenA, address tokenB, uint256 amountIn, uint256 profit, uint256 timestamp)",
      "event LiquidityAdded(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
      "event LiquidityRemoved(address indexed user, address indexed token, uint256 amount, uint256 timestamp)",
      "event RewardsClaimed(address indexed user, uint256 amount, uint256 timestamp)",
      "event FlashLoanExecuted(address indexed user, address token, uint256 amount, uint256 fee)",
      "event StrategyExecuted(address indexed user, string strategyType, uint256 inputAmount, uint256 outputAmount)"
    ];

    if (this.contractAddress) {
      this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
      this.setupEventListeners();
    } else {
      logger.warn('ArbitPyMaster contract address not configured');
    }
  }

  /**
   * Set up event listeners for real-time monitoring
   */
  setupEventListeners() {
    if (!this.contract) return;

    // Listen for arbitrage events
    this.contract.on('ArbitrageExecuted', (user, tokenA, tokenB, amountIn, profit, timestamp, event) => {
      logger.info('Arbitrage executed:', {
        user,
        tokenA,
        tokenB,
        amountIn: ethers.formatEther(amountIn),
        profit: ethers.formatEther(profit),
        timestamp: Number(timestamp),
        txHash: event.transactionHash
      });

      // Clear relevant caches
      cacheManager.delete(`platform:stats`);
      cacheManager.delete(`user:position:${user}`);
    });

    // Listen for liquidity events
    this.contract.on('LiquidityAdded', (user, token, amount, timestamp, event) => {
      logger.info('Liquidity added:', {
        user,
        token,
        amount: ethers.formatEther(amount),
        timestamp: Number(timestamp),
        txHash: event.transactionHash
      });

      cacheManager.delete(`platform:stats`);
      cacheManager.delete(`user:position:${user}`);
    });

    this.contract.on('LiquidityRemoved', (user, token, amount, timestamp, event) => {
      logger.info('Liquidity removed:', {
        user,
        token,
        amount: ethers.formatEther(amount),
        timestamp: Number(timestamp),
        txHash: event.transactionHash
      });

      cacheManager.delete(`platform:stats`);
      cacheManager.delete(`user:position:${user}`);
    });

    // Listen for flash loan events
    this.contract.on('FlashLoanExecuted', (user, token, amount, fee, event) => {
      logger.info('Flash loan executed:', {
        user,
        token,
        amount: ethers.formatEther(amount),
        fee: ethers.formatEther(fee),
        txHash: event.transactionHash
      });

      cacheManager.delete(`platform:stats`);
    });
  }

  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const cacheKey = 'platform:stats';
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [totalTVL, totalVolume, totalArbitrageProfit, totalPoolCount] = await this.contract.getPlatformStats();
      
      const stats = {
        totalTVL: ethers.formatEther(totalTVL),
        totalVolume: ethers.formatEther(totalVolume),
        totalArbitrageProfit: ethers.formatEther(totalArbitrageProfit),
        totalPoolCount: Number(totalPoolCount),
        timestamp: Date.now()
      };

      await cacheManager.set(cacheKey, stats, 30); // Cache for 30 seconds
      return stats;
    } catch (error) {
      logger.error('Error fetching platform stats:', error);
      throw error;
    }
  }

  /**
   * Get user position information
   */
  async getUserPosition(userAddress) {
    const cacheKey = `user:position:${userAddress}`;
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      if (!ethers.isAddress(userAddress)) {
        throw new Error('Invalid address');
      }

      const [totalDeposited, totalWithdrawn, pendingRewards, lastInteractionBlock] = 
        await this.contract.getUserPosition(userAddress);
      
      const position = {
        userAddress,
        totalDeposited: ethers.formatEther(totalDeposited),
        totalWithdrawn: ethers.formatEther(totalWithdrawn),
        pendingRewards: ethers.formatEther(pendingRewards),
        lastInteractionBlock: Number(lastInteractionBlock),
        netPosition: ethers.formatEther(totalDeposited - totalWithdrawn + pendingRewards),
        timestamp: Date.now()
      };

      await cacheManager.set(cacheKey, position, 15); // Cache for 15 seconds
      return position;
    } catch (error) {
      logger.error('Error fetching user position:', error);
      throw error;
    }
  }

  /**
   * Get pool information
   */
  async getPoolInfo(poolId) {
    const cacheKey = `pool:info:${poolId}`;
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [token, totalSupply, rewardRate, lastRewardBlock, accRewardPerShare, active] = 
        await this.contract.getPoolInfo(poolId);
      
      const poolInfo = {
        poolId: Number(poolId),
        token,
        totalSupply: ethers.formatEther(totalSupply),
        rewardRate: ethers.formatEther(rewardRate),
        lastRewardBlock: Number(lastRewardBlock),
        accRewardPerShare: ethers.formatEther(accRewardPerShare),
        active,
        timestamp: Date.now()
      };

      await cacheManager.set(cacheKey, poolInfo, 60); // Cache for 1 minute
      return poolInfo;
    } catch (error) {
      logger.error('Error fetching pool info:', error);
      throw error;
    }
  }

  /**
   * Get user's token balance in a specific pool
   */
  async getUserTokenBalance(userAddress, tokenAddress) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      if (!ethers.isAddress(userAddress) || !ethers.isAddress(tokenAddress)) {
        throw new Error('Invalid address');
      }

      const balance = await this.contract.getUserTokenBalance(userAddress, tokenAddress);
      return {
        userAddress,
        tokenAddress,
        balance: ethers.formatEther(balance),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error fetching user token balance:', error);
      throw error;
    }
  }

  /**
   * Get contract configuration
   */
  async getContractConfig() {
    const cacheKey = 'contract:config';
    const cached = await cacheManager.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      const [platformFee, flashLoansEnabled, arbitrageEnabled] = await Promise.all([
        this.contract.platformFee(),
        this.contract.flashLoansEnabled(),
        this.contract.arbitrageEnabled()
      ]);

      const config = {
        platformFee: Number(platformFee),
        platformFeePercentage: Number(platformFee) / 100, // Convert basis points to percentage
        flashLoansEnabled,
        arbitrageEnabled,
        contractAddress: this.contractAddress,
        timestamp: Date.now()
      };

      await cacheManager.set(cacheKey, config, 300); // Cache for 5 minutes
      return config;
    } catch (error) {
      logger.error('Error fetching contract config:', error);
      throw error;
    }
  }

  /**
   * Get recent transactions for a user
   */
  async getUserTransactions(userAddress, limit = 10) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      if (!ethers.isAddress(userAddress)) {
        throw new Error('Invalid address');
      }

      const currentBlock = await this.provider.getBlockNumber();
      const fromBlock = Math.max(0, currentBlock - 10000); // Look back 10k blocks

      // Get various event types
      const [arbitrageEvents, liquidityAddedEvents, liquidityRemovedEvents, rewardEvents] = await Promise.all([
        this.contract.queryFilter(
          this.contract.filters.ArbitrageExecuted(userAddress),
          fromBlock,
          'latest'
        ),
        this.contract.queryFilter(
          this.contract.filters.LiquidityAdded(userAddress),
          fromBlock,
          'latest'
        ),
        this.contract.queryFilter(
          this.contract.filters.LiquidityRemoved(userAddress),
          fromBlock,
          'latest'
        ),
        this.contract.queryFilter(
          this.contract.filters.RewardsClaimed(userAddress),
          fromBlock,
          'latest'
        )
      ]);

      // Combine and format all events
      const allEvents = [
        ...arbitrageEvents.map(event => ({
          type: 'arbitrage',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: event.args.timestamp ? Number(event.args.timestamp) : null,
          details: {
            tokenA: event.args.tokenA,
            tokenB: event.args.tokenB,
            amountIn: ethers.formatEther(event.args.amountIn),
            profit: ethers.formatEther(event.args.profit)
          }
        })),
        ...liquidityAddedEvents.map(event => ({
          type: 'liquidity_added',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: event.args.timestamp ? Number(event.args.timestamp) : null,
          details: {
            token: event.args.token,
            amount: ethers.formatEther(event.args.amount)
          }
        })),
        ...liquidityRemovedEvents.map(event => ({
          type: 'liquidity_removed',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: event.args.timestamp ? Number(event.args.timestamp) : null,
          details: {
            token: event.args.token,
            amount: ethers.formatEther(event.args.amount)
          }
        })),
        ...rewardEvents.map(event => ({
          type: 'rewards_claimed',
          txHash: event.transactionHash,
          blockNumber: event.blockNumber,
          timestamp: event.args.timestamp ? Number(event.args.timestamp) : null,
          details: {
            amount: ethers.formatEther(event.args.amount)
          }
        }))
      ];

      // Sort by block number (most recent first) and limit
      const sortedEvents = allEvents
        .sort((a, b) => b.blockNumber - a.blockNumber)
        .slice(0, limit);

      return {
        userAddress,
        transactions: sortedEvents,
        totalCount: allEvents.length
      };
    } catch (error) {
      logger.error('Error fetching user transactions:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for various operations
   */
  async estimateGas(operation, params) {
    try {
      if (!this.contract) {
        throw new Error('Contract not initialized');
      }

      let gasEstimate;
      
      switch (operation) {
        case 'addLiquidity':
          gasEstimate = await this.contract.addLiquidity.estimateGas(params.poolId, params.amount);
          break;
        case 'removeLiquidity':
          gasEstimate = await this.contract.removeLiquidity.estimateGas(params.poolId, params.amount);
          break;
        case 'claimRewards':
          gasEstimate = await this.contract.claimRewards.estimateGas();
          break;
        case 'executeArbitrage':
          gasEstimate = await this.contract.executeArbitrage.estimateGas(params);
          break;
        case 'flashLoan':
          gasEstimate = await this.contract.flashLoan.estimateGas(params.token, params.amount, params.data);
          break;
        default:
          throw new Error('Unknown operation');
      }

      return {
        operation,
        gasEstimate: gasEstimate.toString(),
        gasPrice: await this.provider.getGasPrice(),
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error estimating gas:', error);
      throw error;
    }
  }

  /**
   * Update contract address (for redeployments)
   */
  updateContractAddress(newAddress) {
    if (!ethers.isAddress(newAddress)) {
      throw new Error('Invalid contract address');
    }

    this.contractAddress = newAddress;
    this.contract = new ethers.Contract(this.contractAddress, this.contractABI, this.provider);
    this.setupEventListeners();
    
    // Clear all caches
    cacheManager.clear();
    
    logger.info('Contract address updated:', newAddress);
  }
}

export default new ArbitPyMasterService();