# ArbitPy SDK Examples

This directory contains comprehensive examples showing how to use the ArbitPy SDK for various tasks.

## Quick Start

```bash
npm install @arbitpy/sdk
```

## Basic Usage

```typescript
import ArbitPySDK from '@arbitpy/sdk';

const sdk = new ArbitPySDK({
  apiUrl: 'https://api.arbitpy.com/v1',
  apiKey: 'your-api-key', // Optional
});

// Compile Python-like code to Vyper
const result = await sdk.compiler.compileVyper(`
# Simple token contract
name: public(String[64])
symbol: public(String[32])
decimals: public(uint256)
balanceOf: public(HashMap[address, uint256])
totalSupply: public(uint256)

@external
def __init__(_name: String[64], _symbol: String[32]):
    self.name = _name
    self.symbol = _symbol
    self.decimals = 18
    self.totalSupply = 1000000 * 10**18
    self.balanceOf[msg.sender] = self.totalSupply
`);

console.log('Compilation result:', result);
```

## Examples

1. **[Basic Compilation](./01-basic-compilation.js)** - Compile Python-like code to Vyper/Solidity
2. **[Contract Deployment](./02-contract-deployment.js)** - Deploy contracts to different networks
3. **[Contract Interaction](./03-contract-interaction.js)** - Interact with deployed contracts
4. **[AI Assistant](./04-ai-assistant.js)** - Use AI for code review, generation, and optimization
5. **[Full Workflow](./05-full-workflow.js)** - Complete end-to-end example
6. **[Event Listening](./06-event-handling.js)** - Handle SDK events and contract events
7. **[Multi-Network Deployment](./07-multi-network.js)** - Deploy to multiple networks
8. **[Token Contract](./08-token-contract.js)** - Create and deploy ERC-20 token
9. **[NFT Contract](./09-nft-contract.js)** - Create and deploy NFT contract
10. **[DeFi Integration](./10-defi-integration.js)** - Build DeFi applications

## Environment Setup

Create a `.env` file in your project:

```
ARBITPY_API_URL=https://api.arbitpy.com/v1
ARBITPY_API_KEY=your-api-key
PRIVATE_KEY=your-private-key-for-deployment
INFURA_KEY=your-infura-key
```

## TypeScript Support

All examples include TypeScript versions with full type safety and IntelliSense support.