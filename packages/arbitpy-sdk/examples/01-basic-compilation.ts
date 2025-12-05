// Basic Compilation Example
// This example shows how to compile Python-like code to Vyper and Solidity

import ArbitPySDK from '@arbitpy/sdk';

async function basicCompilation() {
  // Initialize SDK
  const sdk = new ArbitPySDK({
    apiUrl: process.env.ARBITPY_API_URL || 'http://localhost:5000/api/v1',
    apiKey: process.env.ARBITPY_API_KEY,
  });

  // Python-like smart contract code
  const pythonCode = `
# Simple Counter Contract
count: public(uint256)

@external
def __init__():
    self.count = 0

@external
def increment():
    self.count += 1

@external
def decrement():
    assert self.count > 0, "Count cannot be negative"
    self.count -= 1

@external
@view
def get_count() -> uint256:
    return self.count
`;

  try {
    console.log('🔄 Compiling to Vyper...');
    
    // Compile to Vyper
    const vyperResult = await sdk.compiler.compileVyper(pythonCode, {
      optimization: true,
      version: 'latest'
    });

    if (vyperResult.success) {
      console.log('✅ Vyper compilation successful!');
      console.log('📄 Contract ABI:', JSON.stringify(vyperResult.abi, null, 2));
      console.log('📦 Bytecode length:', vyperResult.bytecode?.length);
      console.log('⛽ Gas estimate:', vyperResult.gasEstimate);
      
      if (vyperResult.warnings?.length) {
        console.log('⚠️ Warnings:', vyperResult.warnings);
      }
    } else {
      console.log('❌ Vyper compilation failed:');
      vyperResult.errors?.forEach(error => {
        console.log(`   Line ${error.line}: ${error.message}`);
      });
    }

    console.log('\n🔄 Compiling to Solidity...');
    
    // Compile to Solidity
    const solidityResult = await sdk.compiler.compileSolidity(pythonCode, {
      optimization: true,
      version: 'latest'
    });

    if (solidityResult.success) {
      console.log('✅ Solidity compilation successful!');
      console.log('📄 Contract ABI:', JSON.stringify(solidityResult.abi, null, 2));
      console.log('📦 Bytecode length:', solidityResult.bytecode?.length);
      console.log('⛽ Gas estimate:', solidityResult.gasEstimate);
    } else {
      console.log('❌ Solidity compilation failed:');
      solidityResult.errors?.forEach(error => {
        console.log(`   Line ${error.line}: ${error.message}`);
      });
    }

    // Get compilation statistics
    console.log('\n📊 Getting compilation statistics...');
    const stats = await sdk.compiler.getCompilationStats();
    console.log('Statistics:', {
      totalCompilations: stats.totalCompilations,
      successRate: `${(stats.successRate * 100).toFixed(2)}%`,
      averageTime: `${stats.averageCompilationTime}ms`,
    });

    // Validate code syntax
    console.log('\n🔍 Validating code syntax...');
    const validation = await sdk.compiler.validateCode(pythonCode);
    
    if (validation.valid) {
      console.log('✅ Code syntax is valid');
    } else {
      console.log('❌ Code has syntax errors:');
      validation.errors.forEach(error => {
        console.log(`   Line ${error.line}:${error.column} - ${error.message}`);
      });
    }

    // Get example contracts
    console.log('\n📚 Getting example contracts...');
    const examples = await sdk.compiler.getExamples('token');
    console.log(`Found ${examples.contracts.length} token examples`);
    
    examples.contracts.slice(0, 2).forEach(contract => {
      console.log(`- ${contract.name}: ${contract.description}`);
      console.log(`  Features: ${contract.features.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error during compilation:', error.message);
  }
}

// Event handling example
async function compilationWithEvents() {
  const sdk = new ArbitPySDK();

  // Listen to compilation events
  sdk.on('compilation:started', ({ sessionId }) => {
    console.log(`🔄 Compilation started (Session: ${sessionId})`);
  });

  sdk.on('compilation:completed', (result) => {
    console.log(`✅ Compilation completed (Session: ${result.sessionId})`);
  });

  sdk.on('compilation:failed', ({ sessionId, error }) => {
    console.log(`❌ Compilation failed (Session: ${sessionId}): ${error}`);
  });

  // Trigger compilation
  await sdk.compiler.compileVyper('# Simple contract\ncount: public(uint256)');
}

// Run the example
if (require.main === module) {
  Promise.resolve()
    .then(() => basicCompilation())
    .then(() => console.log('\n' + '='.repeat(50) + '\n'))
    .then(() => compilationWithEvents())
    .catch(console.error);
}

export { basicCompilation, compilationWithEvents };