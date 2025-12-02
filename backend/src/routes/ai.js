import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import { validateAIRequest } from '../middleware/validation.js';

const router = express.Router();

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyBEjSJaPV3Hqc21B7sWmKtO9rlkSJSbDoE';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Chat with ArbitPy AI Assistant
 *     tags: [AI Assistant]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *             properties:
 *               message:
 *                 type: string
 *                 description: User message to the AI assistant
 *               context:
 *                 type: string
 *                 description: Additional context or code
 *               sessionId:
 *                 type: string
 *                 description: Session ID for conversation continuity
 *               model:
 *                 type: string
 *                 default: gemini-1.5-flash
 *                 enum: [gemini-1.5-flash, gemini-1.5-pro]
 */
router.post('/chat', validateAIRequest, async (req, res) => {
  const sessionId = req.body.sessionId || uuidv4();
  const { message, context = '', model = 'gemini-1.5-flash' } = req.body;
  
  try {
    logger.info(`AI chat request - Session: ${sessionId}`);
    
    // Check rate limiting for this session
    const rateLimitKey = `ai_rate_limit_${req.ip}`;
    const requestCount = await cacheManager.get(rateLimitKey) || 0;
    
    if (requestCount >= 20) { // 20 requests per hour per IP
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many AI requests. Please wait before trying again.',
        retryAfter: 3600
      });
    }
    
    // Increment rate limit counter
    await cacheManager.set(rateLimitKey, requestCount + 1, 3600);
    
    // Build system prompt
    const systemPrompt = `You are ArbitPy AI, an expert Vyper smart contract development assistant specializing in:

🔸 **Vyper Smart Contract Development**: Writing secure, gas-efficient Vyper contracts
🔸 **Python to Vyper Translation**: Converting Python-like syntax to proper Vyper
🔸 **DeFi Protocols**: DEXs, lending, staking, governance, yield farming, AMMs
🔸 **Security Best Practices**: Reentrancy protection, access controls, input validation
🔸 **Gas Optimization**: Efficient storage patterns, loop optimization, function modifiers
🔸 **Arbitrum Integration**: Layer 2 specific optimizations and features
🔸 **Smart Contract Architecture**: Design patterns, upgradeability, modularity

**Response Guidelines:**
- Provide detailed, actionable advice with practical examples
- Include complete, functional code when relevant
- Explain security implications and potential vulnerabilities
- Suggest gas optimizations with before/after comparisons
- Use markdown formatting for better readability
- Be conversational but professional
- Focus on Vyper/blockchain development
- Highlight best practices with ✅ and warnings with ⚠️
- Mark gas optimization tips with ⚡ and security tips with 🛡️

**Code Formatting:**
- Use \`\`\`vyper for Vyper code blocks
- Include inline comments explaining complex logic
- Follow Vyper best practices and conventions
- Provide complete, deployable examples when possible

${context ? `**Additional Context:**\n${context}\n` : ''}

**User Question:** ${message}`;

    // Check cache for similar requests
    const cacheKey = `ai_response_${Buffer.from(systemPrompt).toString('base64').slice(0, 32)}`;
    const cachedResponse = await cacheManager.get(cacheKey);
    
    if (cachedResponse) {
      logger.info(`Returning cached AI response for session: ${sessionId}`);
      return res.json({
        success: true,
        sessionId,
        response: cachedResponse.response,
        cached: true,
        timestamp: new Date().toISOString()
      });
    }
    
    // Call Gemini API
    const apiUrl = model === 'gemini-1.5-pro' 
      ? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent'
      : GEMINI_API_URL;
      
    const response = await axios.post(`${apiUrl}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 2048,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH", 
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE"
        }
      ]
    }, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      
      // Cache successful responses
      await cacheManager.set(cacheKey, { response: aiResponse }, 1800); // 30 minutes
      
      // Extract code blocks if present
      const codeBlocks = aiResponse.match(/```vyper\n([\s\S]*?)\n```/g) || [];
      const extractedCode = codeBlocks.map(block => 
        block.replace(/```vyper\n/, '').replace(/\n```/, '')
      );
      
      logger.info(`AI response generated successfully for session: ${sessionId}`);
      
      res.json({
        success: true,
        sessionId,
        response: aiResponse,
        codeBlocks: extractedCode,
        model,
        timestamp: new Date().toISOString()
      });
      
    } else {
      throw new Error('Invalid API response structure');
    }
    
  } catch (error) {
    logger.error(`AI chat request failed for session ${sessionId}:`, error);
    
    let errorMessage = 'Sorry, I encountered an error while processing your request.';
    let statusCode = 500;
    
    if (error.response?.status === 403) {
      errorMessage = '🔑 **API Key Issue**: The API key might be invalid or has reached its quota limit.';
      statusCode = 403;
    } else if (error.response?.status === 429) {
      errorMessage = '⏱️ **Rate Limited**: Too many requests. Please wait a moment and try again.';
      statusCode = 429;
    } else if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      errorMessage = '⏰ **Timeout**: The AI service took too long to respond. Please try again.';
      statusCode = 408;
    } else if (error.message.includes('network') || error.code === 'ENOTFOUND') {
      errorMessage = '📡 **Network Error**: Unable to connect to AI service. Please check your connection.';
      statusCode = 503;
    }
    
    errorMessage += '\n\n**Suggestions:**\n• Try rephrasing your question\n• Check your internet connection\n• Wait a moment and try again\n• Use simpler, more specific queries';
    
    res.status(statusCode).json({
      success: false,
      sessionId,
      error: errorMessage,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * @swagger
 * /api/v1/ai/code-review:
 *   post:
 *     summary: AI-powered code review
 *     tags: [AI Assistant]
 */
router.post('/code-review', validateAIRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { code, reviewType = 'comprehensive' } = req.body;
  
  try {
    logger.info(`AI code review request - Session: ${sessionId}, Type: ${reviewType}`);
    
    const reviewPrompts = {
      security: 'Focus on security vulnerabilities, attack vectors, and potential exploits',
      gas: 'Focus on gas optimization opportunities and efficiency improvements',
      style: 'Focus on code style, best practices, and readability',
      comprehensive: 'Perform a comprehensive review covering security, gas optimization, style, and best practices'
    };
    
    const systemPrompt = `You are an expert Vyper smart contract auditor. Please review the following code and ${reviewPrompts[reviewType]}.

**Code to Review:**
\`\`\`vyper
${code}
\`\`\`

**Review Focus:** ${reviewType}

Please provide:
1. **Overall Assessment** (⭐ Rating out of 5)
2. **Security Issues** 🛡️ (High/Medium/Low priority)
3. **Gas Optimization Opportunities** ⚡
4. **Code Quality & Style** ✨
5. **Recommendations** 📝
6. **Fixed Code Example** (if needed)

Use clear markdown formatting and prioritize issues by severity.`;

    // Check cache
    const cacheKey = `code_review_${Buffer.from(code + reviewType).toString('base64').slice(0, 32)}`;
    const cachedReview = await cacheManager.get(cacheKey);
    
    if (cachedReview) {
      return res.json({
        success: true,
        sessionId,
        review: cachedReview.review,
        cached: true
      });
    }
    
    // Call AI service
    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent reviews
        topK: 20,
        topP: 0.9,
        maxOutputTokens: 3000,
      }
    });
    
    const review = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (review) {
      await cacheManager.set(cacheKey, { review }, 3600); // Cache for 1 hour
      
      res.json({
        success: true,
        sessionId,
        review,
        reviewType,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Failed to generate code review');
    }
    
  } catch (error) {
    logger.error(`AI code review failed for session ${sessionId}:`, error);
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Code review failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/ai/generate-contract:
 *   post:
 *     summary: Generate smart contract from description
 *     tags: [AI Assistant]
 */
router.post('/generate-contract', validateAIRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { description, contractType = 'general', features = [] } = req.body;
  
  try {
    logger.info(`AI contract generation request - Session: ${sessionId}, Type: ${contractType}`);
    
    const systemPrompt = `You are an expert Vyper smart contract developer. Generate a complete, production-ready Vyper smart contract based on the following requirements:

**Contract Description:** ${description}
**Contract Type:** ${contractType}
**Requested Features:** ${features.join(', ') || 'Standard functionality'}

**Requirements:**
- Write complete, deployable Vyper code
- Include comprehensive security measures
- Add detailed comments explaining functionality
- Follow Vyper best practices and conventions
- Include proper access controls and validations
- Optimize for gas efficiency
- Add events for important state changes
- Include error handling and require statements

**Please provide:**
1. **Complete Vyper Contract Code**
2. **Deployment Instructions**
3. **Usage Examples**
4. **Security Considerations**
5. **Gas Estimates**

Use proper markdown formatting with vyper code blocks.`;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.6,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      }
    });
    
    const generatedContent = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (generatedContent) {
      // Extract the main contract code
      const codeMatch = generatedContent.match(/```vyper\n([\s\S]*?)\n```/);
      const contractCode = codeMatch ? codeMatch[1] : '';
      
      res.json({
        success: true,
        sessionId,
        contract: {
          code: contractCode,
          fullResponse: generatedContent,
          description,
          contractType,
          features
        },
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Failed to generate contract');
    }
    
  } catch (error) {
    logger.error(`AI contract generation failed for session ${sessionId}:`, error);
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Contract generation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/ai/explain-code:
 *   post:
 *     summary: Explain smart contract code
 *     tags: [AI Assistant]
 */
router.post('/explain-code', validateAIRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { code, explanationType = 'detailed' } = req.body;
  
  try {
    logger.info(`AI code explanation request - Session: ${sessionId}`);
    
    const explanationTypes = {
      simple: 'Provide a simple, beginner-friendly explanation',
      detailed: 'Provide a detailed technical explanation',
      security: 'Focus on security aspects and potential vulnerabilities',
      gas: 'Focus on gas usage and optimization opportunities'
    };
    
    const systemPrompt = `Please explain this Vyper smart contract code. ${explanationTypes[explanationType]}.

**Code to Explain:**
\`\`\`vyper
${code}
\`\`\`

**Explanation Type:** ${explanationType}

Please provide:
1. **Overview** - What does this contract do?
2. **Function Breakdown** - Explain each function
3. **Key Features** - Important functionality
4. **Security Analysis** - Security considerations
5. **Gas Efficiency** - Gas usage notes
6. **Usage Examples** - How to interact with this contract

Use clear markdown formatting and emoji icons for better readability.`;

    const response = await axios.post(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      contents: [{
        parts: [{
          text: systemPrompt
        }]
      }],
      generationConfig: {
        temperature: 0.4,
        topK: 30,
        topP: 0.9,
        maxOutputTokens: 2500,
      }
    });
    
    const explanation = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (explanation) {
      res.json({
        success: true,
        sessionId,
        explanation,
        explanationType,
        timestamp: new Date().toISOString()
      });
    } else {
      throw new Error('Failed to generate explanation');
    }
    
  } catch (error) {
    logger.error(`AI code explanation failed for session ${sessionId}:`, error);
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Code explanation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/ai/models:
 *   get:
 *     summary: Get available AI models
 *     tags: [AI Assistant]
 */
router.get('/models', (req, res) => {
  const models = {
    'gemini-1.5-flash': {
      name: 'Gemini 1.5 Flash',
      description: 'Fast responses, good for general queries',
      speed: 'fast',
      accuracy: 'high',
      costPerRequest: 'low'
    },
    'gemini-1.5-pro': {
      name: 'Gemini 1.5 Pro',
      description: 'Advanced reasoning, best for complex tasks',
      speed: 'slower',
      accuracy: 'highest',
      costPerRequest: 'higher'
    }
  };
  
  res.json({
    models,
    default: 'gemini-1.5-flash',
    recommended: 'gemini-1.5-flash'
  });
});

export default router;