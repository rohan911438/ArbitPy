// Vercel Serverless Function for ArbitPy AI
// Note: Install @google/generative-ai in package.json for production

let GoogleGenerativeAI;
let genAI;

// Try to import and initialize Gemini AI
try {
  GoogleGenerativeAI = require('@google/generative-ai').GoogleGenerativeAI;
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'AIzaSyBInWubdwFk4QPpXCsvlH2NfhMDNBsmVo8');
} catch (error) {
  console.log('Gemini AI not available, using fallback responses only');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, sessionId } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    // Fallback responses for common questions
    const fallbackAnswers = {
      'what is arbitpy': `# 🐍 ArbitPy Overview

**ArbitPy** is a revolutionary Python-to-blockchain compiler that enables developers to write smart contracts using familiar Python syntax.

## ✨ Key Features:
- 🐍 **Python Native**: Write contracts in Python syntax
- ⚡ **Dual Compilation**: Supports both Solidity and Stylus/Rust
- 💰 **40% Gas Savings**: Stylus compilation reduces costs
- 🚀 **10x Faster Development**: No new language learning required
- 🛡️ **AI-Powered**: Built-in code review and optimization

## 🎯 Perfect For:
- Python developers entering Web3
- Teams wanting faster smart contract development
- Projects requiring gas optimization
- Educational blockchain programming`,

      'how to use arbitpy': `# 📚 ArbitPy Usage Guide

## 🚀 Quick Start:

### 1. **Install Dependencies**
\`\`\`bash
npm install arbitpy-sdk
\`\`\`

### 2. **Write Python Contract**
\`\`\`python
# Simple token contract in Python syntax
class SimpleToken:
    def __init__(self, name, symbol, total_supply):
        self.name = name
        self.symbol = symbol
        self.total_supply = total_supply
        self.balances = {}
    
    def transfer(self, to, amount):
        # Transfer logic here
        pass
\`\`\`

### 3. **Compile & Deploy**
\`\`\`javascript
import { ArbitPyCompiler } from 'arbitpy-sdk';

const compiler = new ArbitPyCompiler();
const result = await compiler.compile(pythonCode);
await compiler.deploy(result.solidity);
\`\`\`

## 📱 **Web Interface**: Use our playground at the deployed URL!`,

      'arbitpy contract address': `# 📋 ArbitPy Contract Information

## 🏷️ **Deployed Contract**
- **Address**: \`0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56\`
- **Network**: Arbitrum Sepolia Testnet
- **Chain ID**: 421614

## 🔗 **Links**
- 🔍 **Explorer**: [View on Arbiscan](https://sepolia.arbiscan.io/address/0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56)
- 📊 **Interact**: [Contract Interface](https://sepolia.arbiscan.io/address/0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56#code)

## ⚙️ **Connection Info**
- **RPC**: https://sepolia-rollup.arbitrum.io/rpc
- **Faucet**: [Arbitrum Sepolia Faucet](https://faucet.arbitrum.io/)

## 💡 **Usage**
Add this address to your MetaMask or use in your dApp configuration.`
    };

    // Check for fallback answers first
    const lowerQuery = query.toLowerCase();
    for (const [key, answer] of Object.entries(fallbackAnswers)) {
      if (lowerQuery.includes(key.replace(/ /g, '')) || lowerQuery.includes(key)) {
        return res.json({
          success: true,
          sessionId: sessionId || 'fallback',
          answer,
          source: 'ArbitPy Knowledge Base',
          fallback: true,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Try AI response
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const prompt = `As an ArbitPy expert assistant, please answer this question about ArbitPy (Python-to-blockchain compiler):

Question: ${query}

Context: ArbitPy is a Python-to-blockchain compiler that lets developers write smart contracts in Python syntax and compile to Solidity or Stylus/Rust for Arbitrum. The contract address is 0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56 on Arbitrum Sepolia.

Please provide a helpful, accurate answer with proper formatting.`;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const answer = response.text();

      res.json({
        success: true,
        sessionId: sessionId || Date.now().toString(),
        answer,
        source: 'ArbitPy AI Assistant',
        timestamp: new Date().toISOString()
      });

    } catch (aiError) {
      console.error('AI service failed:', aiError);
      
      // Provide general fallback
      const generalFallback = `# 🤖 ArbitPy Assistant (Offline Mode)

Thank you for your question about **${query}**. 

## 🔄 **Service Status**
The AI assistant is temporarily unavailable, but here are some quick resources:

## 📚 **Common Topics**
- **Getting Started**: Check our documentation
- **Contract Address**: \`0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56\`
- **Network**: Arbitrum Sepolia Testnet
- **Support**: Create an issue on GitHub

## 🔗 **Helpful Links**
- 🏠 **Home**: [ArbitPy Playground](/)
- 📖 **Docs**: [README.md](https://github.com/rohan911438/arbitpy-playground)
- 🔍 **Explorer**: [View Contract](https://sepolia.arbiscan.io/address/0x8b550Ff0BA4F55f070cafA161E44e84AbeDbBc56)

**💡 Please try again in a few minutes for AI-powered responses!**`;

      res.json({
        success: true,
        sessionId: sessionId || 'fallback',
        answer: generalFallback,
        source: 'ArbitPy Knowledge Base',
        fallback: true,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Please try again later'
    });
  }
}