#!/usr/bin/env node

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 ArbitPy Backend Setup');
console.log('========================');

async function checkDependency(command, name) {
  return new Promise((resolve) => {
    const process = spawn(command, ['--version'], { stdio: 'pipe' });
    process.on('close', (code) => {
      if (code === 0) {
        console.log(`✅ ${name} is installed`);
        resolve(true);
      } else {
        console.log(`❌ ${name} is not installed`);
        resolve(false);
      }
    });
    process.on('error', () => {
      console.log(`❌ ${name} is not installed`);
      resolve(false);
    });
  });
}

async function createDirectory(dirPath) {
  try {
    await fs.access(dirPath);
    console.log(`✅ Directory exists: ${dirPath}`);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
    console.log(`✅ Created directory: ${dirPath}`);
  }
}

async function createEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  try {
    await fs.access(envPath);
    console.log('✅ .env file already exists');
  } catch {
    try {
      const envExample = await fs.readFile(envExamplePath, 'utf8');
      await fs.writeFile(envPath, envExample);
      console.log('✅ Created .env file from .env.example');
    } catch (error) {
      console.log('❌ Failed to create .env file:', error.message);
    }
  }
}

async function main() {
  console.log('\n1. Checking system dependencies...');
  
  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  
  if (majorVersion >= 18) {
    console.log(`✅ Node.js ${nodeVersion} (supported)`);
  } else {
    console.log(`❌ Node.js ${nodeVersion} (requires 18+)`);
    process.exit(1);
  }
  
  // Check optional dependencies
  console.log('\n2. Checking optional compiler dependencies...');
  await checkDependency('vyper', 'Vyper compiler');
  await checkDependency('solc', 'Solidity compiler');
  await checkDependency('redis-server', 'Redis server');
  
  console.log('\n3. Creating necessary directories...');
  const directories = ['logs', 'temp', 'uploads'];
  for (const dir of directories) {
    await createDirectory(path.join(__dirname, '..', dir));
  }
  
  console.log('\n4. Setting up environment configuration...');
  await createEnvFile();
  
  console.log('\n5. Installing npm dependencies...');
  await new Promise((resolve, reject) => {
    const npmProcess = spawn('npm', ['install'], { 
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    
    npmProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Dependencies installed successfully');
        resolve();
      } else {
        console.log('❌ Failed to install dependencies');
        reject(new Error('npm install failed'));
      }
    });
  });
  
  console.log('\n🎉 Setup completed successfully!');
  console.log('\nNext steps:');
  console.log('1. Edit .env file with your configuration');
  console.log('2. Start the development server: npm run dev');
  console.log('3. Or start production server: npm start');
  console.log('\nAPI will be available at: http://localhost:5000');
}

main().catch(console.error);