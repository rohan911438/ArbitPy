import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Validation schemas
const baseSolidityCompilationSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000),
  optimization: Joi.boolean().default(true),
  version: Joi.string().default('latest'),
  contractName: Joi.string().default('Contract')
});

const baseRustCompilationSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000),
  optimization: Joi.boolean().default(true),
  target: Joi.string().valid('stylus').default('stylus'),
  contractName: Joi.string().default('Contract')
});

const baseVyperCompilationSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000),
  optimization: Joi.boolean().default(true),
  version: Joi.string().default('latest'),
  contractName: Joi.string().default('Contract')
});

// Generic compilation schema for backward compatibility
const compilationSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000),
  optimization: Joi.boolean().default(true),
  version: Joi.string().default('latest'),
  target: Joi.string().optional(),
  contractName: Joi.string().default('Contract')
});

const deploymentSchema = Joi.object({
  bytecode: Joi.string().required().pattern(/^0x[a-fA-F0-9]+$/),
  abi: Joi.array().required(),
  network: Joi.string().valid('mainnet', 'sepolia', 'goerli', 'arbitrum_sepolia', 'arbitrum_mainnet', 'arbitrum').default('arbitrum_sepolia'),
  constructorParams: Joi.array().default([]),
  gasLimit: Joi.string().pattern(/^[0-9]+$/),
  gasPrice: Joi.string().pattern(/^[0-9]+$/),
  privateKey: Joi.string().pattern(/^0x[a-fA-F0-9]{64}$/)
});

const aiRequestSchema = Joi.object({
  message: Joi.string().required().min(1).max(4000),
  context: Joi.string().max(10000).default(''),
  sessionId: Joi.string().uuid(),
  model: Joi.string().valid('gemini-1.5-flash', 'gemini-1.5-pro').default('gemini-1.5-flash'),
  code: Joi.string().max(20000),
  reviewType: Joi.string().valid('security', 'gas', 'style', 'comprehensive').default('comprehensive'),
  description: Joi.string().max(2000),
  contractType: Joi.string().valid('token', 'nft', 'defi', 'dao', 'general').default('general'),
  features: Joi.array().items(Joi.string()).default([]),
  explanationType: Joi.string().valid('simple', 'detailed', 'security', 'gas').default('detailed')
});

// Validation middleware functions
export const validateCompilationRequest = (req, res, next) => {
  const { error, value } = compilationSchema.validate(req.body, { allowUnknown: false });
  
  if (error) {
    const errorMessage = error.details[0].message;
    const field = error.details[0].path.join('.');
    logger.warn(`Compilation validation failed for ${req.method} ${req.path}: ${errorMessage}`, {
      field,
      body: req.body,
      userAgent: req.get('User-Agent')
    });
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: errorMessage,
      field,
      details: error.details.map(detail => ({
        message: detail.message,
        path: detail.path.join('.'),
        value: detail.context?.value
      }))
    });
  }
  
  req.body = value;
  next();
};

// Specific validation functions for different compilation types
export const validateSolidityCompilation = (req, res, next) => {
  const { error, value } = baseSolidityCompilationSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details[0].message;
    const field = error.details[0].path.join('.');
    logger.warn(`Solidity compilation validation failed: ${errorMessage}`, {
      field,
      body: req.body
    });
    return res.status(400).json({
      success: false,
      error: 'Solidity validation failed',
      message: errorMessage,
      field
    });
  }
  
  req.body = value;
  next();
};

export const validateRustCompilation = (req, res, next) => {
  const { error, value } = baseRustCompilationSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details[0].message;
    const field = error.details[0].path.join('.');
    logger.warn(`Rust compilation validation failed: ${errorMessage}`, {
      field,
      body: req.body
    });
    return res.status(400).json({
      success: false,
      error: 'Rust validation failed',
      message: errorMessage,
      field
    });
  }
  
  req.body = value;
  next();
};

export const validateVyperCompilation = (req, res, next) => {
  const { error, value } = baseVyperCompilationSchema.validate(req.body);
  
  if (error) {
    const errorMessage = error.details[0].message;
    const field = error.details[0].path.join('.');
    logger.warn(`Vyper compilation validation failed: ${errorMessage}`, {
      field,
      body: req.body
    });
    return res.status(400).json({
      success: false,
      error: 'Vyper validation failed',
      message: errorMessage,
      field
    });
  }
  
  req.body = value;
  next();
};

export const validateDeploymentRequest = (req, res, next) => {
  const { error, value } = deploymentSchema.validate(req.body);
  
  if (error) {
    const errorDetail = error.details[0];
    logger.warn(`Deployment validation failed: "${errorDetail.path[0]}" with value "${errorDetail.context?.value}" ${errorDetail.message}`);
    
    // Provide helpful error messages for common issues
    let helpfulMessage = errorDetail.message;
    if (errorDetail.path[0] === 'bytecode' && errorDetail.context?.value && !errorDetail.context.value.startsWith('0x')) {
      helpfulMessage = 'Bytecode must be compiled contract bytecode (hex string starting with 0x), not source code. Please compile your contract first.';
    } else if (errorDetail.path[0] === 'privateKey') {
      const pkValue = errorDetail.context?.value;
      if (pkValue && pkValue.length > 66) {
        helpfulMessage = `Private key is too long (${pkValue.length} characters). It should be exactly 66 characters (0x + 64 hex digits). Please check for duplicates or extra text.`;
      } else if (pkValue && pkValue.length < 66) {
        helpfulMessage = `Private key is too short (${pkValue.length} characters). It should be exactly 66 characters (0x + 64 hex digits).`;
      } else {
        helpfulMessage = 'Private key must be a valid 64-character hex string with 0x prefix (total 66 characters).';
      }
    }
    
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: helpfulMessage,
      field: errorDetail.path[0],
      originalMessage: errorDetail.message
    });
  }
  
  req.body = value;
  next();
};

export const validateAIRequest = (req, res, next) => {
  const { error, value } = aiRequestSchema.validate(req.body);
  
  if (error) {
    logger.warn(`AI request validation failed: ${error.details[0].message}`);
    return res.status(400).json({
      success: false,
      error: 'Validation failed',
      message: error.details[0].message,
      field: error.details[0].path[0]
    });
  }
  
  req.body = value;
  next();
};

// General validation helper
export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body);
    
    if (error) {
      logger.warn(`Request validation failed: ${error.details[0].message}`);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: error.details[0].message,
        field: error.details[0].path[0]
      });
    }
    
    req.body = value;
    next();
  };
};

// Additional validation schemas for other endpoints
export const contractSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  description: Joi.string().max(500),
  sourceCode: Joi.string().required().min(1).max(50000),
  abi: Joi.array(),
  bytecode: Joi.string(),
  network: Joi.string().valid('mainnet', 'sepolia', 'goerli'),
  tags: Joi.array().items(Joi.string()).max(10)
});

export const userSchema = Joi.object({
  address: Joi.string().pattern(/^0x[a-fA-F0-9]{40}$/).required(),
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark').default('dark'),
    notifications: Joi.boolean().default(true)
  }).default({})
});

export const analyticsSchema = Joi.object({
  event: Joi.string().required(),
  properties: Joi.object().default({}),
  userId: Joi.string(),
  sessionId: Joi.string(),
  timestamp: Joi.date().default(Date.now)
});