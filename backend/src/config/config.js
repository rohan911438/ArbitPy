export const config = {
  // Server Configuration
  port: process.env.PORT || 5000,
  host: process.env.HOST || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // API Configuration
  api: {
    version: process.env.API_VERSION || 'v1',
    basePath: process.env.API_BASE_PATH || '/api',
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://localhost:3000',
      'http://localhost:5174'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key'],
    credentials: true
  },
  
  // Rate Limiting
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000, // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },
  
  // Caching
  cache: {
    ttl: parseInt(process.env.CACHE_TTL) || 3600, // 1 hour
    checkperiod: 600, // 10 minutes
    redisUrl: process.env.REDIS_URL || null
  },
  
  // Database
  database: {
    mongodb: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017/arbitpy',
      dbName: process.env.DB_NAME || 'arbitpy'
    }
  },
  
  // Blockchain Networks
  networks: {
    ethereum: process.env.ETHEREUM_RPC || 'https://mainnet.infura.io/v3/',
    sepolia: process.env.SEPOLIA_RPC || 'https://sepolia.infura.io/v3/',
    arbitrum: process.env.ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
    arbitrumSepolia: process.env.ARBITRUM_SEPOLIA_RPC || 'https://sepolia-rollup.arbitrum.io/rpc',
    polygon: process.env.POLYGON_RPC || 'https://polygon-rpc.com',
    mumbai: process.env.MUMBAI_RPC || 'https://rpc-mumbai.maticvigil.com',
    optimism: process.env.OPTIMISM_RPC || 'https://mainnet.optimism.io',
    optimismSepolia: process.env.OPTIMISM_SEPOLIA_RPC || 'https://sepolia.optimism.io'
  },
  
  // AI Configuration
  ai: {
    geminiApiKey: process.env.GEMINI_API_KEY || 'AIzaSyBInWubdwFk4QPpXCsvlH2NfhMDNBsmVo8',
    maxTokens: 4096,
    temperature: 0.7,
    model: 'gemini-1.5-flash',
    fallbackEnabled: true,
    rateLimitPerHour: 20,
    cacheTimeout: 1800 // 30 minutes
  },
  
  // Security
  security: {
    jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-here',
    sessionSecret: process.env.SESSION_SECRET || 'your-session-secret-here',
    bcryptRounds: 12
  },
  
  // Compilation Settings
  compilation: {
    vyperTimeout: parseInt(process.env.VYPER_TIMEOUT) || 30000,
    solidityTimeout: parseInt(process.env.SOLIDITY_TIMEOUT) || 30000,
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 1048576, // 1MB
    tempDir: 'temp',
    supportedVersions: {
      vyper: ['0.3.7', '0.3.6', '0.3.5'],
      solidity: ['0.8.19', '0.8.18', '0.8.17']
    }
  },
  
  // Deployment Settings
  deployment: {
    defaultGasLimit: parseInt(process.env.DEFAULT_GAS_LIMIT) || 3000000,
    gasPriceBuffer: parseInt(process.env.GAS_PRICE_BUFFER) || 20, // 20% buffer
    maxDeploymentTime: 300000, // 5 minutes
    retryAttempts: 3
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log',
    maxFiles: 5,
    maxSize: '20m',
    format: 'combined'
  },
  
  // WebSocket Configuration
  websocket: {
    path: '/socket.io',
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || [
        'http://localhost:5173',
        'http://localhost:3000'
      ],
      methods: ['GET', 'POST']
    }
  },
  
  // File Upload Configuration
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedExtensions: ['.vy', '.sol', '.json'],
    uploadDir: 'uploads'
  },
  
  // Swagger Documentation
  swagger: {
    title: 'ArbitPy API',
    description: 'API documentation for ArbitPy smart contract playground',
    version: '1.0.0',
    contact: {
      name: 'ArbitPy Team',
      email: 'support@arbitpy.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  }
};