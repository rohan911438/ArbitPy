// ArbitPy Master Contract ABI
// Use this after compiling and deploying the contract

export const ARBITPY_MASTER_ABI = [
  // Constructor
  {
    "inputs": [
      {"internalType": "address", "name": "_feeRecipient", "type": "address"},
      {"internalType": "address", "name": "_emergencyWithdrawer", "type": "address"}
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },

  // Main Functions
  {
    "inputs": [
      {
        "components": [
          {"internalType": "address", "name": "tokenA", "type": "address"},
          {"internalType": "address", "name": "tokenB", "type": "address"},
          {"internalType": "address", "name": "dexA", "type": "address"},
          {"internalType": "address", "name": "dexB", "type": "address"},
          {"internalType": "uint256", "name": "amountIn", "type": "uint256"},
          {"internalType": "uint256", "name": "minAmountOut", "type": "uint256"},
          {"internalType": "bytes", "name": "routerCallDataA", "type": "bytes"},
          {"internalType": "bytes", "name": "routerCallDataB", "type": "bytes"}
        ],
        "internalType": "struct ArbitPyMaster.ArbitrageParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "executeArbitrage",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  {
    "inputs": [
      {"internalType": "uint256", "name": "poolId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "addLiquidity",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  {
    "inputs": [
      {"internalType": "uint256", "name": "poolId", "type": "uint256"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"}
    ],
    "name": "removeLiquidity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "claimRewards",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "amount", "type": "uint256"},
      {"internalType": "bytes", "name": "data", "type": "bytes"}
    ],
    "name": "flashLoan",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {"internalType": "string", "name": "strategyType", "type": "string"},
      {"internalType": "address", "name": "inputToken", "type": "address"},
      {"internalType": "uint256", "name": "inputAmount", "type": "uint256"},
      {"internalType": "uint256", "name": "minOutputAmount", "type": "uint256"}
    ],
    "name": "executeStrategy",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },

  // View Functions
  {
    "inputs": [{"internalType": "address", "name": "user", "type": "address"}],
    "name": "getUserPosition",
    "outputs": [
      {"internalType": "uint256", "name": "totalDeposited", "type": "uint256"},
      {"internalType": "uint256", "name": "totalWithdrawn", "type": "uint256"},
      {"internalType": "uint256", "name": "pendingRewards", "type": "uint256"},
      {"internalType": "uint256", "name": "lastInteractionBlock", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [
      {"internalType": "address", "name": "user", "type": "address"},
      {"internalType": "address", "name": "token", "type": "address"}
    ],
    "name": "getUserTokenBalance",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [{"internalType": "uint256", "name": "poolId", "type": "uint256"}],
    "name": "getPoolInfo",
    "outputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "totalSupply", "type": "uint256"},
      {"internalType": "uint256", "name": "rewardRate", "type": "uint256"},
      {"internalType": "uint256", "name": "lastRewardBlock", "type": "uint256"},
      {"internalType": "uint256", "name": "accRewardPerShare", "type": "uint256"},
      {"internalType": "bool", "name": "active", "type": "bool"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "getPlatformStats",
    "outputs": [
      {"internalType": "uint256", "name": "_totalTVL", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalVolume", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalArbitrageProfit", "type": "uint256"},
      {"internalType": "uint256", "name": "_totalPoolCount", "type": "uint256"}
    ],
    "stateMutability": "view",
    "type": "function"
  },

  // Admin Functions
  {
    "inputs": [
      {"internalType": "address", "name": "token", "type": "address"},
      {"internalType": "uint256", "name": "rewardRate", "type": "uint256"}
    ],
    "name": "createPool",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [
      {"internalType": "address", "name": "router", "type": "address"},
      {"internalType": "string", "name": "name", "type": "string"}
    ],
    "name": "addAuthorizedRouter",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [{"internalType": "uint256", "name": "newFee", "type": "uint256"}],
    "name": "updatePlatformFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "toggleFlashLoans",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "toggleArbitrage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "pause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "unpause",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },

  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "tokenA", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "tokenB", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amountIn", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "profit", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "ArbitrageExecuted",
    "type": "event"
  },

  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "LiquidityAdded",
    "type": "event"
  },

  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": true, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "LiquidityRemoved",
    "type": "event"
  },

  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "timestamp", "type": "uint256"}
    ],
    "name": "RewardsClaimed",
    "type": "event"
  },

  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "address", "name": "token", "type": "address"},
      {"indexed": false, "internalType": "uint256", "name": "amount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "fee", "type": "uint256"}
    ],
    "name": "FlashLoanExecuted",
    "type": "event"
  },

  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "internalType": "address", "name": "user", "type": "address"},
      {"indexed": false, "internalType": "string", "name": "strategyType", "type": "string"},
      {"indexed": false, "internalType": "uint256", "name": "inputAmount", "type": "uint256"},
      {"indexed": false, "internalType": "uint256", "name": "outputAmount", "type": "uint256"}
    ],
    "name": "StrategyExecuted",
    "type": "event"
  },

  // State Variables (public getters)
  {
    "inputs": [],
    "name": "totalTVL",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "totalVolume",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "totalArbitrageProfit",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "platformFee",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "flashLoansEnabled",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  },

  {
    "inputs": [],
    "name": "arbitrageEnabled",
    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
    "stateMutability": "view",
    "type": "function"
  }
];

// Contract deployment configuration
export const CONTRACT_CONFIG = {
  PLATFORM_FEE: 30, // 0.3%
  FLASH_LOAN_FEE: 9, // 0.09%
  MAX_FEE: 1000, // 10%
  PRECISION: "1000000000000000000", // 1e18
  
  // Strategy types
  STRATEGIES: {
    COMPOUND: "COMPOUND",
    YIELD_FARM: "YIELD_FARM",
    LIQUIDITY_MINING: "LIQUIDITY_MINING"
  },
  
  // Pool IDs
  ETH_POOL_ID: 0
};

// TypeScript interfaces for frontend integration
export interface ArbitrageParams {
  tokenA: string;
  tokenB: string;
  dexA: string;
  dexB: string;
  amountIn: bigint;
  minAmountOut: bigint;
  routerCallDataA: string;
  routerCallDataB: string;
}

export interface UserPosition {
  totalDeposited: bigint;
  totalWithdrawn: bigint;
  pendingRewards: bigint;
  lastInteractionBlock: bigint;
}

export interface PoolInfo {
  token: string;
  totalSupply: bigint;
  rewardRate: bigint;
  lastRewardBlock: bigint;
  accRewardPerShare: bigint;
  active: boolean;
}

export interface PlatformStats {
  totalTVL: bigint;
  totalVolume: bigint;
  totalArbitrageProfit: bigint;
  totalPoolCount: bigint;
}