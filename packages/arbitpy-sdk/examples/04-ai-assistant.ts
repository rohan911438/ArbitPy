// AI Assistant Example
// This example showcases all AI capabilities of ArbitPy SDK

import ArbitPySDK from '@arbitpy/sdk';

async function aiAssistantDemo() {
  // Initialize SDK
  const sdk = new ArbitPySDK({
    apiUrl: process.env.ARBITPY_API_URL || 'http://localhost:5000/api/v1',
    apiKey: process.env.ARBITPY_API_KEY,
  });

  console.log('🤖 ArbitPy AI Assistant Demo');
  console.log('='.repeat(40));

  try {
    // Example 1: Chat with AI
    console.log('\n💬 Example 1: Chat Interaction');
    
    const chatSession = sdk.ai.createSession();
    
    const chatResponse = await sdk.ai.chat(
      "Hello! I'm new to smart contract development. Can you help me understand what a smart contract is?",
      { sessionId: chatSession }
    );

    console.log('🤖 AI Response:');
    console.log(chatResponse.message);

    // Follow-up question
    const followUp = await sdk.ai.chat(
      "Can you show me a simple example of a smart contract in Python-like syntax?",
      { sessionId: chatSession }
    );

    console.log('\n🤖 AI Follow-up:');
    console.log(followUp.message);
    if (followUp.code) {
      console.log('\n📝 Example Code:');
      console.log(followUp.code);
    }

    // Example 2: Code Review
    console.log('\n🔍 Example 2: Code Review');
    
    const buggyContract = `
# Buggy token contract with security issues
balanceOf: public(HashMap[address, uint256])
totalSupply: public(uint256)

@external
def __init__():
    self.totalSupply = 1000000
    self.balanceOf[msg.sender] = self.totalSupply

@external
def transfer(to: address, amount: uint256):
    # Bug: No balance check
    self.balanceOf[msg.sender] -= amount
    self.balanceOf[to] += amount

@external
def mint(to: address, amount: uint256):
    # Bug: No access control
    self.balanceOf[to] += amount
    self.totalSupply += amount
`;

    const reviewResult = await sdk.ai.reviewCode(buggyContract, {
      reviewType: 'security',
      focusAreas: ['access-control', 'overflow', 'balance-checks']
    });

    console.log('📊 Security Review Results:');
    console.log(`Overall Score: ${reviewResult.score.overall}/100`);
    console.log(`Security Risk: ${reviewResult.summary.securityRisk.toUpperCase()}`);
    console.log(`Found ${reviewResult.issues.length} issues:\n`);

    reviewResult.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.severity.toUpperCase()}: ${issue.title}`);
      console.log(`   Line ${issue.line}: ${issue.description}`);
      console.log(`   💡 Suggestion: ${issue.suggestion}`);
      console.log('');
    });

    // Example 3: Contract Generation
    console.log('\n🏗️ Example 3: Contract Generation');
    
    const generationResult = await sdk.ai.generateContract(
      "Create a simple voting contract where users can propose options and vote on them. Include vote counting and result declaration.",
      {
        contractType: 'dao',
        features: ['proposal-creation', 'voting', 'result-calculation'],
        complexity: 'intermediate'
      }
    );

    if (generationResult.contracts.length > 0) {
      const votingContract = generationResult.contracts[0];
      console.log(`📄 Generated Contract: ${votingContract.name}`);
      console.log(`📝 Description: ${votingContract.description}`);
      console.log(`🎯 Features: ${votingContract.features.join(', ')}`);
      console.log(`⛽ Estimated Gas: ${votingContract.estimatedGas}`);
      console.log('\n💻 Generated Code:');
      console.log(votingContract.code);
    }

    // Example 4: Code Optimization
    console.log('\n⚡ Example 4: Code Optimization');
    
    const inefficientContract = `
# Inefficient contract - multiple optimization opportunities
data: public(HashMap[uint256, uint256])
array: public(uint256[1000])

@external
def store_data(key: uint256, value: uint256):
    self.data[key] = value
    # Inefficient: unnecessary storage write
    self.data[key + 1] = value

@external
def batch_update():
    # Inefficient: loop with expensive operations
    for i in range(100):
        self.array[i] = i * 2
        self.data[i] = i * 3
`;

    const optimizationResult = await sdk.ai.optimizeCode(inefficientContract, {
      optimizationType: 'gas',
      aggressiveness: 'moderate'
    });

    console.log('⚡ Optimization Results:');
    console.log(`Estimated Gas Savings: ${optimizationResult.metrics.gasSavingsEstimate}`);
    console.log(`Security Improvement: +${optimizationResult.metrics.securityImprovement}%`);
    console.log(`Readability Score: ${optimizationResult.metrics.readabilityScore}/100`);
    console.log('\n🔧 Optimizations Applied:');

    optimizationResult.optimizations.forEach((opt, index) => {
      console.log(`${index + 1}. ${opt.type.toUpperCase()}: ${opt.description}`);
      console.log(`   Impact: ${opt.impact.toUpperCase()}`);
      if (opt.gasSavings) {
        console.log(`   Gas Savings: ${opt.gasSavings}`);
      }
      console.log('');
    });

    console.log('💻 Optimized Code:');
    console.log(optimizationResult.optimizedCode);

    // Example 5: Code Explanation
    console.log('\n📚 Example 5: Code Explanation');
    
    const complexContract = `
# Advanced DeFi contract with multiple features
interface ERC20:
    def transfer(to: address, amount: uint256) -> bool: nonpayable
    def balanceOf(account: address) -> uint256: view

liquidity_pools: public(HashMap[address, uint256])
rewards: public(HashMap[address, uint256])
staking_time: public(HashMap[address, uint256])

@external
def stake(token: address, amount: uint256):
    assert ERC20(token).transfer(self, amount), "Transfer failed"
    self.liquidity_pools[token] += amount
    self.staking_time[msg.sender] = block.timestamp
    self._calculate_rewards(msg.sender, token)

@internal
def _calculate_rewards(user: address, token: address):
    staked_duration: uint256 = block.timestamp - self.staking_time[user]
    reward: uint256 = self.liquidity_pools[token] * staked_duration / 86400
    self.rewards[user] += reward
`;

    const explanationResult = await sdk.ai.explainCode(complexContract, {
      level: 'intermediate',
      focus: 'functionality'
    });

    console.log('📖 Contract Explanation:');
    console.log(explanationResult.explanation.overview);
    console.log('\n🔧 Functions:');
    
    explanationResult.explanation.functions.forEach(func => {
      console.log(`• ${func.name}: ${func.purpose}`);
      console.log(`  Gas Complexity: ${func.complexity.toUpperCase()}`);
      console.log(`  Parameters: ${func.parameters.map(p => `${p.name}(${p.type})`).join(', ')}`);
    });

    console.log('\n🔒 Security Analysis:');
    console.log(`Risks: ${explanationResult.explanation.security.risks.join(', ')}`);
    console.log(`Safeguards: ${explanationResult.explanation.security.safeguards.join(', ')}`);

    // Example 6: Debugging Help
    console.log('\n🐛 Example 6: Debugging Assistance');
    
    const buggyCode = `
# Contract with runtime error
balance: public(uint256)

@external
def withdraw(amount: uint256):
    self.balance -= amount  # This will underflow if amount > balance
    send(msg.sender, amount)
`;

    const debugResult = await sdk.ai.debugCode(
      buggyCode,
      "Transaction reverted with panic code 0x11 (arithmetic underflow/overflow)",
      { context: "User tried to withdraw more than their balance" }
    );

    console.log('🔧 Debug Results:');
    debugResult.bugs.forEach(bug => {
      console.log(`• ${bug.type.toUpperCase()} (${bug.severity}): ${bug.description}`);
      console.log(`  Fix: ${bug.fix}`);
      console.log(`  Example: ${bug.example}`);
    });

    // Example 7: Get Templates
    console.log('\n📋 Example 7: Contract Templates');
    
    const templates = await sdk.ai.getTemplates('token');
    
    console.log(`Found ${templates.templates.length} token templates:`);
    templates.templates.slice(0, 3).forEach(template => {
      console.log(`• ${template.name} (${template.complexity})`);
      console.log(`  ${template.description}`);
      console.log(`  Use Case: ${template.useCase}`);
      console.log(`  Features: ${template.features.join(', ')}`);
    });

    console.log(`\nCommon Patterns:`);
    templates.patterns.slice(0, 2).forEach(pattern => {
      console.log(`• ${pattern.name}: ${pattern.description}`);
      console.log(`  Benefits: ${pattern.benefits.join(', ')}`);
      console.log(`  Gas Impact: ${pattern.gasImpact.toUpperCase()}`);
    });

    // Example 8: Session Management
    console.log('\n💾 Example 8: Session Management');
    
    const sessions = sdk.ai.getActiveSessions();
    console.log(`Active sessions: ${sessions.length}`);
    
    const history = sdk.ai.getSessionHistory(chatSession);
    if (history) {
      console.log(`Conversation history for session ${chatSession}:`);
      history.conversationHistory.forEach((msg, index) => {
        console.log(`${index + 1}. ${msg.role.toUpperCase()}: ${msg.content.substring(0, 100)}...`);
      });
    }

    // Check AI model status
    const modelStatus = await sdk.ai.getModelStatus();
    console.log('\n🤖 AI Model Status:');
    console.log(`Model: ${modelStatus.model} v${modelStatus.version}`);
    console.log(`Available: ${modelStatus.available ? '✅' : '❌'}`);
    console.log(`Max tokens per request: ${modelStatus.tokensPerRequest.max}`);
    console.log(`Capabilities: ${modelStatus.capabilities.join(', ')}`);

    console.log('\n🎉 AI Assistant Demo Completed!');

  } catch (error) {
    console.error('❌ AI Assistant demo failed:', error.message);
  }
}

// Interactive AI session example
async function interactiveAISession() {
  const sdk = new ArbitPySDK();
  const sessionId = sdk.ai.createSession();

  console.log('🎯 Interactive AI Session Started');
  console.log('Type "exit" to end the session\n');

  // In a real application, you'd use readline or a similar library
  // This is a simplified example
  const questions = [
    "What's the difference between Vyper and Solidity?",
    "Can you help me create a simple NFT contract?",
    "What are the security best practices for smart contracts?",
    "How do I optimize gas costs in my contracts?"
  ];

  for (const question of questions) {
    console.log(`👤 User: ${question}`);
    
    try {
      const response = await sdk.ai.chat(question, { sessionId });
      console.log(`🤖 AI: ${response.message}\n`);
      
      if (response.code) {
        console.log('📝 Generated Code:');
        console.log(response.code);
        console.log('');
      }
    } catch (error) {
      console.error(`❌ Error: ${error.message}\n`);
    }
  }

  console.log('👋 Interactive session ended');
}

// Run examples
if (require.main === module) {
  Promise.resolve()
    .then(() => aiAssistantDemo())
    .then(() => console.log('\n' + '='.repeat(50) + '\n'))
    .then(() => interactiveAISession())
    .catch(console.error);
}

export { aiAssistantDemo, interactiveAISession };