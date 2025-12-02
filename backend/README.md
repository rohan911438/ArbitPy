# ArbitPy Backend API

## Overview

The ArbitPy Backend API provides a comprehensive REST API for smart contract compilation, deployment, and management. It supports both Vyper and Solidity contracts with deployment to multiple blockchain networks.

## Features

- **Multi-language Compilation**: Support for Vyper and Solidity smart contracts
- **Multi-chain Deployment**: Deploy to Ethereum, Arbitrum, Polygon, Optimism, and their testnets
- **AI Integration**: Gemini AI integration for smart contract assistance
- **Real-time Communication**: WebSocket support for live compilation and deployment updates
- **Analytics & Monitoring**: Comprehensive analytics and usage tracking
- **User Management**: User profiles, contract storage, and settings
- **Caching**: Redis-compatible caching for improved performance
- **Rate Limiting**: API rate limiting for security and resource management
- **Comprehensive Logging**: Winston-based logging with multiple levels

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Vyper compiler (optional, for Vyper compilation)
- Solidity compiler (optional, for Solidity compilation)
- Redis (optional, for caching)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd arbitpy-playground/backend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

The API will be available at `http://localhost:5000`.

## API Endpoints

### Compilation Endpoints
- `POST /api/v1/compile/vyper` - Compile Vyper contracts
- `POST /api/v1/compile/solidity` - Compile Solidity contracts
- `GET /api/v1/compile/status/:jobId` - Check compilation status

### Deployment Endpoints
- `POST /api/v1/deploy` - Deploy compiled contracts
- `GET /api/v1/deploy/networks` - Get supported networks
- `POST /api/v1/deploy/estimate` - Estimate deployment costs
- `POST /api/v1/deploy/verify` - Verify contracts on block explorers

### AI Endpoints
- `POST /api/v1/ai/chat` - AI chat for contract assistance
- `POST /api/v1/ai/generate` - Generate contract code
- `POST /api/v1/ai/analyze` - Analyze existing contracts

### Contract Management
- `GET /api/v1/contracts` - Get contract templates
- `GET /api/v1/contracts/:id` - Get specific contract
- `POST /api/v1/contracts` - Save user contracts

### User Management
- `GET /api/v1/users/profile` - Get user profile
- `POST /api/v1/users/register` - Register new user
- `PUT /api/v1/users/settings` - Update user settings
- `GET /api/v1/users/contracts` - Get user's contracts

### Analytics
- `GET /api/v1/analytics/stats` - Platform statistics
- `GET /api/v1/analytics/usage` - Usage metrics
- `GET /api/v1/analytics/contracts` - Contract analytics

### Utilities
- `POST /api/v1/utils/validate-address` - Validate Ethereum addresses
- `POST /api/v1/utils/gas-estimate` - Estimate gas costs
- `POST /api/v1/utils/format-code` - Format contract code
- `GET /api/v1/utils/health` - API health check

## Configuration

### Environment Variables

Key environment variables (see `.env.example` for full list):

```bash
# Server Configuration
PORT=5000
NODE_ENV=development

# API Configuration
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Blockchain Networks
ETHEREUM_RPC=your-ethereum-rpc-url
ARBITRUM_RPC=https://arb1.arbitrum.io/rpc

# Database
MONGODB_URL=mongodb://localhost:27017/arbitpy

# Caching
REDIS_URL=redis://localhost:6379
```

### Network Configuration

Supported blockchain networks:

| Network | Chain ID | Type | RPC Endpoint |
|---------|----------|------|-------------|
| Ethereum | 1 | Mainnet | Configurable |
| Sepolia | 11155111 | Testnet | Configurable |
| Arbitrum One | 42161 | Mainnet | https://arb1.arbitrum.io/rpc |
| Arbitrum Sepolia | 421614 | Testnet | https://sepolia-rollup.arbitrum.io/rpc |
| Polygon | 137 | Mainnet | https://polygon-rpc.com |
| Mumbai | 80001 | Testnet | https://rpc-mumbai.maticvigil.com |
| Optimism | 10 | Mainnet | https://mainnet.optimism.io |
| Optimism Sepolia | 11155420 | Testnet | https://sepolia.optimism.io |

## API Usage Examples

### Compile Vyper Contract

```bash
curl -X POST http://localhost:5000/api/v1/compile/vyper \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "# @version ^0.3.7\n@external\ndef hello() -> String[32]:\n    return \"Hello, ArbitPy!\"",
    "contractName": "HelloWorld",
    "options": {
      "optimize": true
    }
  }'
```

### Deploy Contract

```bash
curl -X POST http://localhost:5000/api/v1/deploy \
  -H "Content-Type: application/json" \
  -d '{
    "bytecode": "0x608060405234801561001057600080fd5b50...",
    "abi": [...],
    "privateKey": "0x...",
    "network": "sepolia",
    "constructorArgs": []
  }'
```

### AI Chat

```bash
curl -X POST http://localhost:5000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me create an ERC20 token in Vyper",
    "context": {
      "language": "vyper",
      "topic": "tokens"
    }
  }'
```

## WebSocket Events

Connect to WebSocket at `ws://localhost:5000/socket.io` for real-time updates:

### Client Events
- `compile_start` - Start compilation
- `deploy_start` - Start deployment
- `join_room` - Join user-specific room

### Server Events
- `compile_progress` - Compilation progress updates
- `compile_complete` - Compilation finished
- `deploy_progress` - Deployment progress updates
- `deploy_complete` - Deployment finished
- `error` - Error notifications

## Architecture

### Directory Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   ├── middleware/       # Express middleware
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic services
│   ├── utils/           # Utility functions
│   └── server.js        # Main server file
├── logs/               # Log files
├── temp/               # Temporary compilation files
├── uploads/            # File uploads
└── package.json
```

### Service Classes

- **VyperCompiler**: Handles Vyper contract compilation
- **SolidityCompiler**: Handles Solidity contract compilation  
- **ContractDeployer**: Manages multi-chain contract deployment
- **Logger**: Winston-based logging system
- **CacheManager**: Redis-compatible caching

### Middleware

- **CORS**: Cross-origin resource sharing
- **Rate Limiting**: API request throttling
- **Request Validation**: Input validation and sanitization
- **Error Handling**: Centralized error management
- **Logging**: Request/response logging

## Development

### Scripts

```bash
# Start development server with hot reload
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Adding New Features

1. **New API Endpoint**:
   - Add route handler in `src/routes/`
   - Add business logic in `src/services/`
   - Update middleware as needed

2. **New Compiler**:
   - Create compiler class in `src/services/`
   - Add compilation route
   - Update configuration

3. **New Network**:
   - Add network config in `config.js`
   - Update `ContractDeployer` service
   - Test deployment functionality

## Security Considerations

- **Rate Limiting**: Prevents API abuse
- **Input Validation**: Validates all user inputs
- **Private Key Handling**: Never log or store private keys
- **CORS**: Restricts cross-origin requests
- **Environment Variables**: Sensitive data in env vars only

## Monitoring & Logging

### Log Levels
- `error`: System errors and failures
- `warn`: Warning conditions
- `info`: General information
- `debug`: Detailed debugging information

### Log Files
- `logs/app.log`: Combined application logs
- `logs/error.log`: Error-only logs
- Console output in development mode

### Health Monitoring
- `GET /api/v1/utils/health`: API health status
- Process uptime and memory usage
- Database connection status
- External service availability

## Production Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Environment Setup

1. Set production environment variables
2. Configure database connections
3. Set up Redis for caching
4. Configure logging for production
5. Set up monitoring and alerts

### Performance Optimization

- Enable Redis caching
- Configure rate limiting
- Use production logging level
- Enable compression middleware
- Set up load balancing

## Support

For issues and questions:
- Create GitHub issues for bugs
- Check logs for error details
- Ensure all dependencies are installed
- Verify environment configuration

## License

MIT License - see LICENSE file for details.