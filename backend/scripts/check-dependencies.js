#!/usr/bin/env node

import { spawn } from 'child_process';

console.log('🔍 Checking ArbitPy Backend Dependencies');
console.log('========================================');

const dependencies = [
  { command: 'node', args: ['--version'], name: 'Node.js', required: true },
  { command: 'npm', args: ['--version'], name: 'npm', required: true },
  { command: 'vyper', args: ['--version'], name: 'Vyper Compiler', required: false },
  { command: 'solc', args: ['--version'], name: 'Solidity Compiler', required: false },
  { command: 'redis-server', args: ['--version'], name: 'Redis Server', required: false },
  { command: 'mongod', args: ['--version'], name: 'MongoDB', required: false },
  { command: 'docker', args: ['--version'], name: 'Docker', required: false },
  { command: 'git', args: ['--version'], name: 'Git', required: false }
];

async function checkDependency(dep) {
  return new Promise((resolve) => {
    const process = spawn(dep.command, dep.args, { stdio: 'pipe' });
    let output = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    process.on('close', (code) => {
      const status = code === 0 ? 'installed' : 'not installed';
      const icon = code === 0 ? '✅' : (dep.required ? '❌' : '⚠️');
      const version = code === 0 ? output.trim().split('\n')[0] : 'N/A';
      
      console.log(`${icon} ${dep.name}: ${status}`);
      if (code === 0) {
        console.log(`   Version: ${version}`);
      }
      
      resolve({ name: dep.name, installed: code === 0, required: dep.required, version });
    });
    
    process.on('error', () => {
      const icon = dep.required ? '❌' : '⚠️';
      console.log(`${icon} ${dep.name}: not installed`);
      resolve({ name: dep.name, installed: false, required: dep.required, version: 'N/A' });
    });
  });
}

async function main() {
  const results = [];
  
  for (const dep of dependencies) {
    const result = await checkDependency(dep);
    results.push(result);
  }
  
  console.log('\n📊 Summary:');
  console.log('===========');
  
  const installed = results.filter(r => r.installed);
  const missing = results.filter(r => !r.installed);
  const requiredMissing = missing.filter(r => r.required);
  
  console.log(`✅ Installed: ${installed.length}/${results.length}`);
  console.log(`❌ Missing: ${missing.length}/${results.length}`);
  
  if (requiredMissing.length > 0) {
    console.log('\n🚨 Required dependencies missing:');
    requiredMissing.forEach(dep => {
      console.log(`   - ${dep.name}`);
    });
    console.log('\nPlease install required dependencies before continuing.');
    process.exit(1);
  }
  
  if (missing.length > 0) {
    console.log('\n⚠️  Optional dependencies missing:');
    missing.forEach(dep => {
      console.log(`   - ${dep.name} (optional)`);
    });
  }
  
  console.log('\n📋 Installation Notes:');
  console.log('======================');
  
  const notes = {
    'Vyper Compiler': 'pip install vyper',
    'Solidity Compiler': 'npm install -g solc',
    'Redis Server': 'Download from https://redis.io/download',
    'MongoDB': 'Download from https://www.mongodb.com/download-center',
    'Docker': 'Download from https://www.docker.com/get-started'
  };
  
  missing.forEach(dep => {
    if (notes[dep.name]) {
      console.log(`${dep.name}: ${notes[dep.name]}`);
    }
  });
  
  console.log('\n🎯 System Requirements Met:', requiredMissing.length === 0 ? 'Yes' : 'No');
  
  if (requiredMissing.length === 0) {
    console.log('\n✨ You can proceed with the setup!');
    console.log('Run: npm run setup');
  }
}

main().catch(console.error);