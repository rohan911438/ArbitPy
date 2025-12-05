// Simple test script for ArbitPy SDK
import ArbitPySDK from '../dist/index.esm.js';

console.log('🧪 Testing ArbitPy SDK...');

try {
  // Test 1: SDK initialization
  console.log('1. Testing SDK initialization...');
  const sdk = new ArbitPySDK({
    apiUrl: 'http://localhost:5000/api/v1',
    timeout: 10000
  });

  console.log('✅ SDK initialized successfully');

  // Test 2: Check modules
  console.log('2. Testing module availability...');
  if (sdk.compiler && sdk.deployment && sdk.ai) {
    console.log('✅ All modules available');
  } else {
    throw new Error('❌ Modules not properly initialized');
  }

  // Test 3: Configuration
  console.log('3. Testing configuration...');
  const config = sdk.getConfig();
  if (config.apiUrl === 'http://localhost:5000/api/v1' && config.timeout === 10000) {
    console.log('✅ Configuration working correctly');
  } else {
    throw new Error('❌ Configuration not working');
  }

  // Test 4: Contract creation
  console.log('4. Testing contract creation...');
  const contract = sdk.contract(
    '0x1234567890123456789012345678901234567890',
    [],
    'arbitrum-sepolia'
  );

  if (contract.address && contract.network) {
    console.log('✅ Contract instance created successfully');
  } else {
    throw new Error('❌ Contract creation failed');
  }

  // Test 5: Static methods
  console.log('5. Testing static methods...');
  const version = ArbitPySDK.getVersion();
  const info = ArbitPySDK.getInfo();

  if (version === '1.0.0' && info.name === '@arbitpy/sdk') {
    console.log('✅ Static methods working');
  } else {
    throw new Error('❌ Static methods not working');
  }

  console.log('\n🎉 All tests passed! SDK is ready for use.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}