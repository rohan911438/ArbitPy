# @arbitpy/sdk

[![npm version](https://badge.fury.io/js/@arbitpy/sdk.svg)](https://www.npmjs.com/package/@arbitpy/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)

**Official TypeScript SDK for ArbitPy** - Write smart contracts in Python syntax and deploy to Arbitrum and other EVM networks.

## 🚀 Features

- **🐍 Python-like Syntax**: Write smart contracts using familiar Python syntax
- **🎯 Multi-Target Compilation**: Compile to Vyper, Solidity, or Rust (Stylus)
- **🌐 Multi-Network Support**: Deploy to Arbitrum, Ethereum, Polygon, Optimism, and more
- **🤖 AI-Powered Development**: Built-in AI assistant for code review, generation, and optimization
- **📦 Type-Safe Interactions**: Full TypeScript support with comprehensive type definitions
- **⚡ Event-Driven Architecture**: Real-time compilation and deployment monitoring
- **🔧 Developer Tools**: Debugging, formatting, and optimization utilities

## 📥 Installation

```bash
npm install @arbitpy/sdk
# or
yarn add @arbitpy/sdk
# or
pnpm add @arbitpy/sdk
```

## 🎯 Quick Start

```typescript
import ArbitPySDK from '@arbitpy/sdk';

// Initialize SDK
const sdk = new ArbitPySDK({
  apiUrl: 'https://api.arbitpy.com/v1', // Optional: defaults to localhost
  apiKey: 'your-api-key', // Optional
});

// Write Python-like smart contract
const pythonContract = `
# Simple Counter Contract
count: public(uint256)

@external
def __init__():
    self.count = 0

@external
def increment():
    self.count += 1

@external
@view
def get_count() -> uint256:
    return self.count
`;

// Compile, deploy, and interact
async function main() {
  // 1. Compile to Vyper
  const compilation = await sdk.compiler.compileVyper(pythonContract);
  
  // 2. Deploy to Arbitrum Sepolia
  const deployment = await sdk.deployment.deploy({
    bytecode: compilation.bytecode!,
    abi: compilation.abi!,
    network: 'arbitrum-sepolia',
  });
  
  // 3. Create contract instance
  const contract = sdk.contract(
    deployment.contractAddress,
    compilation.abi!,
    'arbitrum-sepolia'
  );
  
  // 4. Interact with contract
  const count = await contract.call('get_count');
  console.log('Current count:', count.toString());
}
```

## 📚 Core Modules

### 🔧 Compiler

Compile Python-like code to different targets:

```typescript
// Compile to Vyper
const vyperResult = await sdk.compiler.compileVyper(code, {
  optimization: true,
  version: 'latest'
});

// Compile to Solidity
const solidityResult = await sdk.compiler.compileSolidity(code);

// Compile to Rust (Stylus)
const rustResult = await sdk.compiler.compileRust(code);

// Validate syntax
const validation = await sdk.compiler.validateCode(code);

// Get examples
const examples = await sdk.compiler.getExamples('token');
```

### 🚀 Deployment

Deploy contracts to multiple networks:

```typescript
// Deploy contract
const deployment = await sdk.deployment.deploy({
  bytecode: '0x608060405...',
  abi: [...],
  network: 'arbitrum-one',
  constructorParams: ['Token Name', 'TKN'],
  gasLimit: '2000000'
});

// Estimate deployment cost
const estimate = await sdk.deployment.estimateDeploymentGas(
  bytecode, abi, 'ethereum', []
);

// Verify on block explorer
const verification = await sdk.deployment.verifyContract(
  contractAddress, sourceCode, 'arbitrum-one'
);

// Get deployment history
const history = await sdk.deployment.getDeploymentHistory(userAddress);
```

### 🔗 Contract Interaction

Type-safe contract interactions:

```typescript
// Create contract instance
const contract = sdk.contract(address, abi, 'arbitrum-one');

// Read contract data
const balance = await contract.call('balanceOf', [userAddress]);
const name = await contract.call('name');

// Send transactions (requires signer)
const tx = await contract.send('transfer', [recipient, amount], {
  gasLimit: '100000'
});

// Listen to events
contract.addEventListener('Transfer', (event) => {
  console.log('Transfer:', event.args);
});

// Get historical events
const events = await contract.getPastEvents('Transfer', 0, 'latest');
```

### 🤖 AI Assistant

Leverage AI for development:

```typescript
// Chat with AI
const response = await sdk.ai.chat(
  "How do I create a secure token contract?"
);

// Code review
const review = await sdk.ai.reviewCode(contractCode, {
  reviewType: 'security'
});

// Generate contracts
const generated = await sdk.ai.generateContract(
  "Create an NFT marketplace contract",
  { contractType: 'nft', features: ['auction', 'royalties'] }
);

// Optimize code
const optimized = await sdk.ai.optimizeCode(contractCode, {
  optimizationType: 'gas'
});

// Explain code
const explanation = await sdk.ai.explainCode(contractCode, {
  level: 'beginner'
});

// Debug issues
const debugInfo = await sdk.ai.debugCode(
  contractCode,
  "Transaction reverted"
);
```

## 🌐 Supported Networks

### Mainnets
- **Arbitrum One** (`arbitrum-one`)
- **Ethereum** (`ethereum`)
- **Polygon** (`polygon`)
- **Optimism** (`optimism`)
- **Base** (`base`)

### Testnets
- **Arbitrum Sepolia** (`arbitrum-sepolia`)
- **Sepolia** (`sepolia`)
- **Polygon Mumbai** (`polygon-mumbai`)
- **Optimism Sepolia** (`optimism-sepolia`)
- **Base Sepolia** (`base-sepolia`)

## 📊 Event Monitoring

Monitor SDK operations in real-time:

```typescript
// Listen to compilation events
sdk.on('compilation:started', ({ sessionId }) => {
  console.log(`Compilation started: ${sessionId}`);
});

sdk.on('compilation:completed', (result) => {
  console.log(`Compilation completed: ${result.sessionId}`);
});

// Listen to deployment events
sdk.on('deployment:completed', (result) => {
  console.log(`Contract deployed: ${result.contractAddress}`);
});

// Listen to transaction confirmations
sdk.on('transaction:confirmed', ({ hash, blockNumber }) => {
  console.log(`Transaction confirmed: ${hash} (Block: ${blockNumber})`);
});

// Handle errors
sdk.on('error', (error) => {
  console.error('SDK Error:', error.message);
});
```

## 🛠️ Advanced Usage

### Complete Workflow

```typescript
// One-liner for complete workflow
const result = await sdk.createAndDeploy(pythonCode, {
  target: 'vyper',
  network: 'arbitrum-sepolia',
  constructorParams: ['My Token', 'MTK'],
  privateKey: process.env.PRIVATE_KEY,
  optimization: true
});

console.log('Contract deployed:', result.deploymentResult.contractAddress);

// Use the contract immediately
const balance = await result.contract.call('totalSupply');
```

### Custom Provider Integration

```typescript
import { ethers } from 'ethers';

// Use custom provider/signer
const provider = new ethers.JsonRpcProvider('https://your-rpc-url');
const signer = new ethers.Wallet(privateKey, provider);

const contract = sdk.contract(address, abi, 'arbitrum-one');
await contract.connect(signer);

// Now you can send transactions
const tx = await contract.send('mint', [recipient, amount]);
```

### Gas Optimization

```typescript
// Get current gas prices
const gasPrices = await sdk.deployment.getGasPrice('arbitrum-one');

// Estimate gas for function call
const gasEstimate = await contract.estimateGas('transfer', [recipient, amount]);

// Deploy with custom gas settings
const deployment = await sdk.deployment.deploy({
  bytecode, abi, network: 'arbitrum-one',
  gasLimit: gasEstimate,
  gasPrice: gasPrices.fast
});
```

## 🔧 Configuration

### Environment Variables

```bash
# .env file
ARBITPY_API_URL=https://api.arbitpy.com/v1
ARBITPY_API_KEY=your-api-key
PRIVATE_KEY=your-deployment-private-key
```

### SDK Configuration

```typescript
const sdk = new ArbitPySDK({
  apiUrl: 'https://api.arbitpy.com/v1',
  apiKey: process.env.ARBITPY_API_KEY,
  timeout: 30000, // Request timeout in ms
});

// Update configuration dynamically
sdk.updateConfig({
  apiKey: 'new-api-key',
  timeout: 60000
});
```

## 📖 Examples

Check out the [examples directory](./examples) for comprehensive usage examples:

- [Basic Compilation](./examples/01-basic-compilation.ts)
- [Contract Deployment](./examples/02-contract-deployment.ts)
- [Contract Interaction](./examples/03-contract-interaction.ts)
- [AI Assistant](./examples/04-ai-assistant.ts)
- [Full Workflow](./examples/05-full-workflow.ts)
- [Event Handling](./examples/06-event-handling.ts)
- [Multi-Network](./examples/07-multi-network.ts)
- [Token Contract](./examples/08-token-contract.ts)
- [NFT Contract](./examples/09-nft-contract.ts)
- [DeFi Integration](./examples/10-defi-integration.ts)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 🏗️ Building

```bash
# Build the package
npm run build

# Build and watch for changes
npm run dev

# Generate TypeScript declarations
npm run build:types
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/rohan911438/arbitpy-playground.git
cd arbitpy-playground/packages/arbitpy-sdk

# Install dependencies
npm install

# Start development server
npm run dev

# Run tests
npm test
```

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

## 🔗 Links

- **Website**: [https://arbitpy.com](https://arbitpy.com)
- **Documentation**: [https://docs.arbitpy.com](https://docs.arbitpy.com)
- **GitHub**: [https://github.com/rohan911438/arbitpy-playground](https://github.com/rohan911438/arbitpy-playground)
- **Discord**: [https://discord.gg/arbitpy](https://discord.gg/arbitpy)
- **Twitter**: [@ArbitPyDev](https://twitter.com/ArbitPyDev)

## 👥 Team

**BROTHERHOOD Team**
- **Rohan Kumar** - Lead Developer
- GitHub: [@rohan911438](https://github.com/rohan911438)

## 🙏 Acknowledgments

- **Arbitrum Foundation** - For the amazing L2 scaling solution
- **Vyper Team** - For the Pythonic smart contract language  
- **OpenZeppelin** - For security standards and best practices
- **ethers.js** - For the excellent Ethereum library

---

**Built with ❤️ for the Arbitrum ecosystem**