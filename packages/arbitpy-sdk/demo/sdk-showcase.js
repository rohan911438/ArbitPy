// Quick SDK Demo - Shows the power of ArbitPy SDK
import ArbitPySDK from '../dist/index.esm.js';

console.log('🚀 ArbitPy SDK Demo');
console.log('='.repeat(40));

// Initialize SDK
const sdk = new ArbitPySDK({
  apiUrl: 'http://localhost:5000/api/v1', // Your backend API
});

// Example: Python-like smart contract
const pythonContract = `
# Simple Token Contract in Python-like syntax
name: public(String[64])
symbol: public(String[32])  
decimals: public(uint256)
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])

event Transfer:
    sender: indexed(address)
    receiver: indexed(address)
    value: uint256

@external
def __init__(_name: String[64], _symbol: String[32]):
    self.name = _name
    self.symbol = _symbol
    self.decimals = 18
    self.totalSupply = 1000000 * 10**18
    self.balanceOf[msg.sender] = self.totalSupply

@external
def transfer(_to: address, _value: uint256) -> bool:
    assert self.balanceOf[msg.sender] >= _value, "Insufficient balance"
    self.balanceOf[msg.sender] -= _value
    self.balanceOf[_to] += _value
    log Transfer(msg.sender, _to, _value)
    return True
`;

console.log('📝 Sample Python-like Smart Contract:');
console.log(pythonContract);

console.log('\n💡 With ArbitPy SDK, you can:');
console.log('1. 🔧 Compile Python code to Vyper/Solidity/Rust');
console.log('2. 🚀 Deploy to any EVM network');
console.log('3. 🔗 Interact with contracts type-safely');
console.log('4. 🤖 Get AI assistance for development');

console.log('\n📦 One-line installation:');
console.log('npm install @arbitpy/sdk');

console.log('\n⚡ Usage example:');
console.log(`
import ArbitPySDK from '@arbitpy/sdk';

const sdk = new ArbitPySDK();

// Compile & Deploy in one command
const result = await sdk.createAndDeploy(pythonCode, {
  network: 'arbitrum-sepolia',
  constructorParams: ['My Token', 'MTK']
});

console.log('Contract deployed:', result.contract.address);
`);

console.log('\n🎯 Perfect for hackathons! Professional SDK with:');
console.log('✅ Full TypeScript support');
console.log('✅ Multi-network deployment');  
console.log('✅ AI-powered development');
console.log('✅ Complete documentation');
console.log('✅ Real-time event monitoring');

console.log('\n🏆 This positions ArbitPy as a complete platform, not just a compiler!');