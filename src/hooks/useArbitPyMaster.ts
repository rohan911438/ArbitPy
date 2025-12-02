import { useState, useEffect, useCallback } from 'react';
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ARBITPY_MASTER_ABI, ArbitrageParams, UserPosition, PoolInfo, PlatformStats } from '../contracts/ArbitPyMasterABI';

// You'll need to update this with your deployed contract address
const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000'; // Update after deployment

export const useArbitPyMaster = () => {
  const { address } = useAccount();
  const [contractAddress, setContractAddress] = useState<string>(CONTRACT_ADDRESS);

  // ======================== READ FUNCTIONS ========================

  // Get platform statistics
  const { data: platformStats, refetch: refetchPlatformStats } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'getPlatformStats',
  });

  // Get user position
  const { data: userPosition, refetch: refetchUserPosition } = useContractRead({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'getUserPosition',
    args: address ? [address] : undefined,
    enabled: !!address,
  });

  // Get pool info
  const getPoolInfo = useCallback(async (poolId: number) => {
    // This would be implemented with dynamic contract reads
    // For now, return a placeholder structure
    return null;
  }, [contractAddress]);

  // Get user token balance
  const getUserTokenBalance = useCallback(async (token: string) => {
    if (!address) return BigInt(0);
    // Implementation would go here
    return BigInt(0);
  }, [address, contractAddress]);

  // ======================== WRITE FUNCTIONS ========================

  // Execute Arbitrage
  const { config: arbitrageConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'executeArbitrage',
  });

  const { write: executeArbitrage, isLoading: isExecutingArbitrage } = useContractWrite({
    ...arbitrageConfig,
    onSuccess: () => {
      refetchPlatformStats();
      refetchUserPosition();
    },
  });

  // Add Liquidity
  const { config: addLiquidityConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'addLiquidity',
  });

  const { write: addLiquidity, isLoading: isAddingLiquidity } = useContractWrite({
    ...addLiquidityConfig,
    onSuccess: () => {
      refetchPlatformStats();
      refetchUserPosition();
    },
  });

  // Remove Liquidity
  const { config: removeLiquidityConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'removeLiquidity',
  });

  const { write: removeLiquidity, isLoading: isRemovingLiquidity } = useContractWrite({
    ...removeLiquidityConfig,
    onSuccess: () => {
      refetchPlatformStats();
      refetchUserPosition();
    },
  });

  // Claim Rewards
  const { config: claimRewardsConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'claimRewards',
  });

  const { write: claimRewards, isLoading: isClaimingRewards } = useContractWrite({
    ...claimRewardsConfig,
    onSuccess: () => {
      refetchUserPosition();
    },
  });

  // Flash Loan
  const { config: flashLoanConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'flashLoan',
  });

  const { write: flashLoan, isLoading: isExecutingFlashLoan } = useContractWrite({
    ...flashLoanConfig,
    onSuccess: () => {
      refetchPlatformStats();
    },
  });

  // Execute Strategy
  const { config: executeStrategyConfig } = usePrepareContractWrite({
    address: contractAddress as `0x${string}`,
    abi: ARBITPY_MASTER_ABI,
    functionName: 'executeStrategy',
  });

  const { write: executeStrategy, isLoading: isExecutingStrategy } = useContractWrite({
    ...executeStrategyConfig,
    onSuccess: () => {
      refetchPlatformStats();
      refetchUserPosition();
    },
  });

  // ======================== HELPER FUNCTIONS ========================

  const formatPlatformStats = useCallback((stats: any): PlatformStats | null => {
    if (!stats) return null;
    return {
      totalTVL: stats[0],
      totalVolume: stats[1],
      totalArbitrageProfit: stats[2],
      totalPoolCount: stats[3],
    };
  }, []);

  const formatUserPosition = useCallback((position: any): UserPosition | null => {
    if (!position) return null;
    return {
      totalDeposited: position[0],
      totalWithdrawn: position[1],
      pendingRewards: position[2],
      lastInteractionBlock: position[3],
    };
  }, []);

  // ======================== CONVENIENCE FUNCTIONS ========================

  const executeArbitrageTransaction = useCallback(
    async (params: ArbitrageParams) => {
      if (!executeArbitrage) return;
      
      try {
        await executeArbitrage({
          args: [params],
          value: params.tokenA === '0x0000000000000000000000000000000000000000' ? params.amountIn : BigInt(0),
        });
      } catch (error) {
        console.error('Arbitrage execution failed:', error);
        throw error;
      }
    },
    [executeArbitrage]
  );

  const addLiquidityTransaction = useCallback(
    async (poolId: number, amount: bigint, isETH = false) => {
      if (!addLiquidity) return;
      
      try {
        await addLiquidity({
          args: [BigInt(poolId), amount],
          value: isETH ? amount : BigInt(0),
        });
      } catch (error) {
        console.error('Add liquidity failed:', error);
        throw error;
      }
    },
    [addLiquidity]
  );

  const removeLiquidityTransaction = useCallback(
    async (poolId: number, amount: bigint) => {
      if (!removeLiquidity) return;
      
      try {
        await removeLiquidity({
          args: [BigInt(poolId), amount],
        });
      } catch (error) {
        console.error('Remove liquidity failed:', error);
        throw error;
      }
    },
    [removeLiquidity]
  );

  const flashLoanTransaction = useCallback(
    async (token: string, amount: bigint, data: string) => {
      if (!flashLoan) return;
      
      try {
        await flashLoan({
          args: [token, amount, data],
        });
      } catch (error) {
        console.error('Flash loan failed:', error);
        throw error;
      }
    },
    [flashLoan]
  );

  const executeStrategyTransaction = useCallback(
    async (
      strategyType: string,
      inputToken: string,
      inputAmount: bigint,
      minOutputAmount: bigint
    ) => {
      if (!executeStrategy) return;
      
      try {
        await executeStrategy({
          args: [strategyType, inputToken, inputAmount, minOutputAmount],
          value: inputToken === '0x0000000000000000000000000000000000000000' ? inputAmount : BigInt(0),
        });
      } catch (error) {
        console.error('Strategy execution failed:', error);
        throw error;
      }
    },
    [executeStrategy]
  );

  // ======================== UTILITY FUNCTIONS ========================

  const calculateProfitPercentage = useCallback((invested: bigint, current: bigint): number => {
    if (invested === BigInt(0)) return 0;
    const profit = current - invested;
    return Number((profit * BigInt(10000)) / invested) / 100;
  }, []);

  const formatTokenAmount = useCallback((amount: bigint, decimals = 18): string => {
    return formatEther(amount);
  }, []);

  const parseTokenAmount = useCallback((amount: string): bigint => {
    return parseEther(amount);
  }, []);

  // ======================== CONTRACT MANAGEMENT ========================

  const updateContractAddress = useCallback((newAddress: string) => {
    setContractAddress(newAddress);
  }, []);

  return {
    // Contract Info
    contractAddress,
    updateContractAddress,

    // Read Data
    platformStats: formatPlatformStats(platformStats),
    userPosition: formatUserPosition(userPosition),
    getPoolInfo,
    getUserTokenBalance,

    // Write Functions
    executeArbitrageTransaction,
    addLiquidityTransaction,
    removeLiquidityTransaction,
    claimRewards,
    flashLoanTransaction,
    executeStrategyTransaction,

    // Loading States
    isExecutingArbitrage,
    isAddingLiquidity,
    isRemovingLiquidity,
    isClaimingRewards,
    isExecutingFlashLoan,
    isExecutingStrategy,

    // Utilities
    calculateProfitPercentage,
    formatTokenAmount,
    parseTokenAmount,
    
    // Refetch Functions
    refetchPlatformStats,
    refetchUserPosition,
  };
};

// ======================== TYPES FOR EXPORT ========================

export interface ArbitPyMasterHook {
  contractAddress: string;
  updateContractAddress: (address: string) => void;
  platformStats: PlatformStats | null;
  userPosition: UserPosition | null;
  executeArbitrageTransaction: (params: ArbitrageParams) => Promise<void>;
  addLiquidityTransaction: (poolId: number, amount: bigint, isETH?: boolean) => Promise<void>;
  removeLiquidityTransaction: (poolId: number, amount: bigint) => Promise<void>;
  flashLoanTransaction: (token: string, amount: bigint, data: string) => Promise<void>;
  executeStrategyTransaction: (
    strategyType: string,
    inputToken: string,
    inputAmount: bigint,
    minOutputAmount: bigint
  ) => Promise<void>;
  isExecutingArbitrage: boolean;
  isAddingLiquidity: boolean;
  isRemovingLiquidity: boolean;
  isClaimingRewards: boolean;
  isExecutingFlashLoan: boolean;
  isExecutingStrategy: boolean;
  calculateProfitPercentage: (invested: bigint, current: bigint) => number;
  formatTokenAmount: (amount: bigint, decimals?: number) => string;
  parseTokenAmount: (amount: string) => bigint;
}

export default useArbitPyMaster;