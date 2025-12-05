// Full Workflow Example
// This example demonstrates the complete ArbitPy workflow: compile, deploy, and interact

import ArbitPySDK from '@arbitpy/sdk';
import { ethers } from 'ethers';

async function fullWorkflow() {
  // Initialize SDK
  const sdk = new ArbitPySDK({
    apiUrl: process.env.ARBITPY_API_URL || 'http://localhost:5000/api/v1',
    apiKey: process.env.ARBITPY_API_KEY,
  });

  // Python-like ERC-20 token contract
  const tokenContract = `
# ArbitPy Token Contract
# A simple ERC-20 token implementation

# Events
event Transfer:
    sender: indexed(address)
    receiver: indexed(address)
    value: uint256

event Approval:
    owner: indexed(address)
    spender: indexed(address)
    value: uint256

# Storage variables
name: public(String[64])
symbol: public(String[32])
decimals: public(uint256)
totalSupply: public(uint256)
balanceOf: public(HashMap[address, uint256])
allowance: public(HashMap[address, HashMap[address, uint256]])

@external
def __init__(_name: String[64], _symbol: String[32], _initial_supply: uint256):
    self.name = _name
    self.symbol = _symbol
    self.decimals = 18
    self.totalSupply = _initial_supply * 10**18
    self.balanceOf[msg.sender] = self.totalSupply
    log Transfer(empty(address), msg.sender, self.totalSupply)

@external
def transfer(_to: address, _value: uint256) -> bool:
    assert _to != empty(address), "Cannot transfer to zero address"
    assert self.balanceOf[msg.sender] >= _value, "Insufficient balance"
    
    self.balanceOf[msg.sender] -= _value
    self.balanceOf[_to] += _value
    log Transfer(msg.sender, _to, _value)
    return True

@external
def approve(_spender: address, _value: uint256) -> bool:
    assert _spender != empty(address), "Cannot approve zero address"
    
    self.allowance[msg.sender][_spender] = _value
    log Approval(msg.sender, _spender, _value)
    return True

@external
def transferFrom(_from: address, _to: address, _value: uint256) -> bool:
    assert _to != empty(address), "Cannot transfer to zero address"
    assert self.balanceOf[_from] >= _value, "Insufficient balance"
    assert self.allowance[_from][msg.sender] >= _value, "Insufficient allowance"
    
    self.balanceOf[_from] -= _value
    self.balanceOf[_to] += _value
    self.allowance[_from][msg.sender] -= _value
    
    log Transfer(_from, _to, _value)
    return True
`;

  try {
    console.log('🚀 Starting Full ArbitPy Workflow');
    console.log('='.repeat(50));

    // Step 1: Get AI code review
    console.log('\n🤖 Step 1: AI Code Review');
    const review = await sdk.ai.reviewCode(tokenContract, {
      reviewType: 'comprehensive'
    });

    console.log(`📊 Overall Score: ${review.score.overall}/100`);
    console.log(`🔒 Security Score: ${review.score.security}/100`);
    console.log(`⛽ Gas Efficiency: ${review.score.gasEfficiency}/100`);
    
    if (review.issues.length > 0) {
      console.log(`⚠️ Found ${review.issues.length} issues:`);
      review.issues.slice(0, 3).forEach(issue => {
        console.log(`  - ${issue.severity.toUpperCase()}: ${issue.title}`);
        console.log(`    ${issue.description}`);
      });
    }

    // Step 2: Compile the contract
    console.log('\n⚙️ Step 2: Compilation');
    const compilationResult = await sdk.compiler.compileVyper(tokenContract, {
      optimization: true
    });

    if (!compilationResult.success) {
      throw new Error(`Compilation failed: ${compilationResult.errors?.[0]?.message}`);
    }

    console.log('✅ Compilation successful!');
    console.log(`📦 Bytecode size: ${compilationResult.bytecode!.length / 2 - 1} bytes`);
    console.log(`⛽ Deployment gas estimate: ${compilationResult.gasEstimate?.creation}`);

    // Step 3: Deploy to testnet
    console.log('\n🚀 Step 3: Deployment');
    const deploymentResult = await sdk.deployment.deploy({
      bytecode: compilationResult.bytecode!,
      abi: compilationResult.abi!,
      network: 'arbitrum-sepolia',
      constructorParams: ['ArbitPy Token', 'ARBY', '1000000'] // 1M tokens
    }, process.env.PRIVATE_KEY);

    if (!deploymentResult.success) {
      throw new Error('Deployment failed');
    }

    console.log('✅ Deployment successful!');
    console.log(`📍 Contract Address: ${deploymentResult.contractAddress}`);
    console.log(`🔗 Transaction Hash: ${deploymentResult.transactionHash}`);
    console.log(`🌐 Explorer: ${deploymentResult.explorerUrl}`);

    // Step 4: Wait for confirmation
    console.log('\n⏳ Step 4: Waiting for Confirmation');
    const receipt = await sdk.deployment.waitForConfirmation(
      deploymentResult.transactionHash,
      'arbitrum-sepolia',
      1
    );

    console.log(`✅ Transaction confirmed in block ${receipt.blockNumber}`);
    console.log(`⛽ Gas used: ${receipt.gasUsed?.toString()}`);

    // Step 5: Create contract instance
    console.log('\n🔗 Step 5: Contract Interaction');
    const contract = sdk.contract(
      deploymentResult.contractAddress,
      compilationResult.abi!,
      'arbitrum-sepolia'
    );

    // Connect with provider (read-only)
    const provider = new ethers.JsonRpcProvider('https://sepolia-rollup.arbitrum.io/rpc');
    await contract.connect(provider);

    // Read contract data
    const name = await contract.call('name');
    const symbol = await contract.call('symbol');
    const decimals = await contract.call('decimals');
    const totalSupply = await contract.call('totalSupply');

    console.log(`📄 Token Details:`);
    console.log(`   Name: ${name}`);
    console.log(`   Symbol: ${symbol}`);
    console.log(`   Decimals: ${decimals.toString()}`);
    console.log(`   Total Supply: ${ethers.formatEther(totalSupply.toString())} tokens`);

    // Step 6: Verify contract
    console.log('\n✅ Step 6: Contract Verification');
    try {
      const verificationResult = await sdk.deployment.verifyContract(
        deploymentResult.contractAddress,
        tokenContract,
        'arbitrum-sepolia',
        {
          contractName: 'ArbitPyToken',
          constructorArgs: ['ArbitPy Token', 'ARBY', '1000000'],
          compilerVersion: '0.3.7',
          optimizationUsed: true
        }
      );

      if (verificationResult.success) {
        console.log('✅ Contract verified successfully!');
        console.log(`🔗 Verification URL: ${verificationResult.explorerUrl}`);
      }
    } catch (error) {
      console.log('⚠️ Contract verification failed (this is common on testnets)');
    }

    // Step 7: Get contract info
    console.log('\n📊 Step 7: Contract Analytics');
    const contractInfo = await sdk.deployment.getContractInfo(
      deploymentResult.contractAddress,
      'arbitrum-sepolia'
    );

    console.log(`📈 Contract Statistics:`);
    console.log(`   Balance: ${ethers.formatEther(contractInfo.balance)} ETH`);
    console.log(`   Transaction Count: ${contractInfo.transactionCount}`);
    console.log(`   Verified: ${contractInfo.verified ? '✅' : '❌'}`);

    // Step 8: Listen to events (if signer is available)
    console.log('\n👂 Step 8: Event Listening');
    contract.addEventListener('Transfer', (event) => {
      console.log(`💸 Transfer Event: ${event.args.sender} → ${event.args.receiver}`);
      console.log(`   Amount: ${ethers.formatEther(event.args.value.toString())} tokens`);
    });

    // Get historical events
    const transferEvents = await contract.getPastEvents('Transfer', 0, 'latest');
    console.log(`📚 Found ${transferEvents.length} historical Transfer events`);

    console.log('\n🎉 Full Workflow Completed Successfully!');
    console.log('='.repeat(50));

    return {
      contract: deploymentResult.contractAddress,
      abi: compilationResult.abi,
      network: 'arbitrum-sepolia'
    };

  } catch (error) {
    console.error('❌ Workflow failed:', error.message);
    throw error;
  }
}

// Helper function for monitoring deployment
async function monitorDeployment(sdk: ArbitPySDK) {
  sdk.on('compilation:started', ({ sessionId }) => {
    console.log(`🔄 Compilation started (${sessionId})`);
  });

  sdk.on('compilation:completed', (result) => {
    console.log(`✅ Compilation completed: ${result.sessionId}`);
  });

  sdk.on('deployment:started', ({ sessionId }) => {
    console.log(`🚀 Deployment started (${sessionId})`);
  });

  sdk.on('deployment:completed', (result) => {
    console.log(`✅ Deployment completed: ${result.contractAddress}`);
  });

  sdk.on('transaction:confirmed', ({ hash, blockNumber }) => {
    console.log(`✅ Transaction confirmed: ${hash} (Block: ${blockNumber})`);
  });

  sdk.on('error', (error) => {
    console.error(`❌ SDK Error: ${error.message}`);
  });
}

// Example with the createAndDeploy helper
async function quickWorkflow() {
  const sdk = new ArbitPySDK({
    apiUrl: process.env.ARBITPY_API_URL || 'http://localhost:5000/api/v1',
  });

  const simpleContract = `
# Simple storage contract
stored_value: public(uint256)

@external
def __init__(initial_value: uint256):
    self.stored_value = initial_value

@external
def set_value(new_value: uint256):
    self.stored_value = new_value
`;

  try {
    console.log('⚡ Quick Workflow with createAndDeploy');
    
    const result = await sdk.createAndDeploy(simpleContract, {
      target: 'vyper',
      network: 'arbitrum-sepolia',
      constructorParams: [42],
      privateKey: process.env.PRIVATE_KEY,
      optimization: true
    });

    console.log('🎉 Quick deployment successful!');
    console.log(`📍 Contract: ${result.deploymentResult.contractAddress}`);
    
    // Use the contract instance
    const value = await result.contract.call('stored_value');
    console.log(`📊 Stored value: ${value.toString()}`);

  } catch (error) {
    console.error('❌ Quick workflow failed:', error.message);
  }
}

// Run examples
if (require.main === module) {
  Promise.resolve()
    .then(() => fullWorkflow())
    .then(() => console.log('\n' + '='.repeat(50) + '\n'))
    .then(() => quickWorkflow())
    .catch(console.error);
}

export { fullWorkflow, quickWorkflow, monitorDeployment };