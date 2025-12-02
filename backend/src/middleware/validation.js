import Joi from 'joi';
import { logger } from '../utils/logger.js';

// Validation schemas
const compilationSchema = Joi.object({
  code: Joi.string().required().min(1).max(50000),
  optimization: Joi.boolean().default(true),
  version: Joi.string().default('latest')
});

const deploymentSchema = Joi.object({
  bytecode: Joi.string().required().pattern(/^0x[a-fA-F0-9]+$/),
  abi: Joi.array().required(),
  network: Joi.string().valid('mainnet', 'sepolia', 'goerli').default('sepolia'),
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
  const { error, value } = compilationSchema.validate(req.body);
  
  if (error) {
    logger.warn(`Compilation validation failed: ${error.details[0].message}`);
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

export const validateDeploymentRequest = (req, res, next) => {
  const { error, value } = deploymentSchema.validate(req.body);
  
  if (error) {
    logger.warn(`Deployment validation failed: ${error.details[0].message}`);
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