#!/usr/bin/env node

/**
 * Pre-deployment check script for ArbitPy Playground
 * Verifies that everything is ready for Vercel deployment
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ArbitPy Deployment Check\n');

// Check required files
const requiredFiles = [
  'vercel.json',
  'package.json',
  'env.vercel',
  'api/ai.js',
  'src/main.tsx',
  'backend/src/server.js'
];

let allChecks = true;

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  if (!exists) allChecks = false;
});

// Check package.json dependencies
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = [
  '@google/generative-ai',
  'ethers',
  'react',
  'vite'
];

requiredDeps.forEach(dep => {
  const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
  console.log(`${exists ? '✅' : '❌'} ${dep} ${exists ? `(${exists})` : ''}`);
  if (!exists) allChecks = false;
});

// Check environment variables
console.log('\n🔧 Checking environment configuration...');
const envTemplate = fs.readFileSync('env.vercel', 'utf8');
const requiredEnvVars = [
  'VITE_CONTRACT_ADDRESS=0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56',
  'GEMINI_API_KEY=AIzaSyBInWubdwFk4QPpXCsvlH2NfhMDNBsmVo8',
  'VITE_ARBITRUM_SEPOLIA_RPC',
  'VITE_NETWORK_ID=421614'
];

requiredEnvVars.forEach(envVar => {
  const [key] = envVar.split('=');
  const exists = envTemplate.includes(key);
  console.log(`${exists ? '✅' : '❌'} ${key}`);
  if (!exists) allChecks = false;
});

// Check contract address consistency
console.log('\n📋 Checking contract address consistency...');
const correctAddress = '0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56';
const readmeContent = fs.readFileSync('README.md', 'utf8');
const contractMatches = readmeContent.match(/0x[a-fA-F0-9]{40}/g) || [];
const consistentAddresses = contractMatches.every(addr => addr === correctAddress);
console.log(`${consistentAddresses ? '✅' : '❌'} Contract address consistency in README`);
if (!consistentAddresses) {
  console.log('   Found addresses:', [...new Set(contractMatches)]);
  allChecks = false;
}

// Final result
console.log('\n' + '='.repeat(50));
if (allChecks) {
  console.log('🎉 ALL CHECKS PASSED! Ready for deployment.');
  console.log('\n🚀 Next steps:');
  console.log('1. git add . && git commit -m "Prepare for deployment"');
  console.log('2. git push origin main');
  console.log('3. Deploy to Vercel using the button in README.md');
  console.log('4. Configure environment variables in Vercel dashboard');
} else {
  console.log('❌ Some checks failed. Please fix the issues above.');
  process.exit(1);
}

console.log('\n📖 For detailed deployment guide, see VERCEL_DEPLOYMENT.md');