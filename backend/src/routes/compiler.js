import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import { validateCompilationRequest } from '../middleware/validation.js';
import { VyperCompiler } from '../services/VyperCompiler.js';
import { SolidityCompiler } from '../services/SolidityCompiler.js';
import { RustCompiler } from '../services/RustCompiler.js';
import { CodeAnalyzer } from '../services/CodeAnalyzer.js';

const router = express.Router();

/**
 * @swagger
 * /api/v1/compile/vyper:
 *   post:
 *     summary: Compile Python-like code to Vyper
 *     tags: [Compilation]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Python-like smart contract code
 *               optimization:
 *                 type: boolean
 *                 default: true
 *               version:
 *                 type: string
 *                 default: "latest"
 *     responses:
 *       200:
 *         description: Compilation successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionId:
 *                   type: string
 *                 output:
 *                   type: string
 *                 abi:
 *                   type: array
 *                 bytecode:
 *                   type: string
 *                 warnings:
 *                   type: array
 *                 gasEstimate:
 *                   type: object
 */
router.post('/vyper', validateCompilationRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { code, optimization = true, version = 'latest' } = req.body;
  
  try {
    logger.info(`Starting Vyper compilation session: ${sessionId}`);
    
    // Check cache first
    const cacheKey = `vyper_compile_${Buffer.from(code).toString('base64').slice(0, 32)}`;
    const cachedResult = await cacheManager.get(cacheKey);
    
    if (cachedResult) {
      logger.info(`Returning cached result for session: ${sessionId}`);
      return res.json({
        ...cachedResult,
        sessionId,
        cached: true
      });
    }
    
    // Emit compilation start event
    const io = req.app.get('socketio');
    io.to(`compilation-${sessionId}`).emit('compilation-status', {
      status: 'started',
      message: 'Starting Vyper compilation...'
    });
    
    // Initialize compiler
    const compiler = new VyperCompiler(version, optimization);
    
    // Compile code
    const result = await compiler.compile(code, {
      onProgress: (progress) => {
        io.to(`compilation-${sessionId}`).emit('compilation-progress', progress);
      }
    });
    
    // Cache successful results
    if (result.success) {
      await cacheManager.set(cacheKey, result, 3600); // Cache for 1 hour
    }
    
    // Emit completion event
    io.to(`compilation-${sessionId}`).emit('compilation-complete', {
      sessionId,
      success: result.success,
      output: result.output
    });
    
    logger.info(`Vyper compilation completed for session: ${sessionId}, Success: ${result.success}`);
    
    res.json({
      ...result,
      sessionId
    });
    
  } catch (error) {
    logger.error(`Vyper compilation failed for session ${sessionId}:`, error);
    
    const io = req.app.get('socketio');
    io.to(`compilation-${sessionId}`).emit('compilation-error', {
      sessionId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Compilation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/compile/solidity:
 *   post:
 *     summary: Compile Python-like code to Solidity
 *     tags: [Compilation]
 */
router.post('/solidity', validateCompilationRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { code, optimization = true, version = '0.8.19' } = req.body;
  
  try {
    logger.info(`Starting Solidity compilation session: ${sessionId}`);
    
    const cacheKey = `solidity_compile_${Buffer.from(code).toString('base64').slice(0, 32)}`;
    const cachedResult = await cacheManager.get(cacheKey);
    
    if (cachedResult) {
      return res.json({ ...cachedResult, sessionId, cached: true });
    }
    
    const io = req.app.get('socketio');
    io.to(`compilation-${sessionId}`).emit('compilation-status', {
      status: 'started',
      message: 'Converting to Solidity...'
    });
    
    const compiler = new SolidityCompiler(version, optimization);
    const result = await compiler.compile(code, {
      onProgress: (progress) => {
        io.to(`compilation-${sessionId}`).emit('compilation-progress', progress);
      }
    });
    
    if (result.success) {
      await cacheManager.set(cacheKey, result, 3600);
    }
    
    io.to(`compilation-${sessionId}`).emit('compilation-complete', {
      sessionId,
      success: result.success,
      output: result.output
    });
    
    logger.info(`Solidity compilation completed for session: ${sessionId}, Success: ${result.success}`);
    
    res.json({ ...result, sessionId });
    
  } catch (error) {
    logger.error(`Solidity compilation failed for session ${sessionId}:`, error);
    
    const io = req.app.get('socketio');
    io.to(`compilation-${sessionId}`).emit('compilation-error', {
      sessionId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Compilation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/compile/rust:
 *   post:
 *     summary: Compile Python-like code to Rust (Stylus)
 *     tags: [Compilation]
 */
router.post('/rust', validateCompilationRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { code, optimization = true } = req.body;
  
  try {
    logger.info(`Starting Rust compilation session: ${sessionId}`);
    
    const cacheKey = `rust_compile_${Buffer.from(code).toString('base64').slice(0, 32)}`;
    const cachedResult = await cacheManager.get(cacheKey);
    
    if (cachedResult) {
      return res.json({ ...cachedResult, sessionId, cached: true });
    }
    
    const io = req.app.get('socketio');
    io.to(`compilation-${sessionId}`).emit('compilation-status', {
      status: 'started',
      message: 'Converting to Rust for Stylus...'
    });
    
    const compiler = new RustCompiler(optimization);
    const result = await compiler.compile(code, {
      onProgress: (progress) => {
        io.to(`compilation-${sessionId}`).emit('compilation-progress', progress);
      }
    });
    
    if (result.success) {
      await cacheManager.set(cacheKey, result, 3600);
    }
    
    io.to(`compilation-${sessionId}`).emit('compilation-complete', {
      sessionId,
      success: result.success,
      output: result.output
    });
    
    logger.info(`Rust compilation completed for session: ${sessionId}, Success: ${result.success}`);
    
    res.json({ ...result, sessionId });
    
  } catch (error) {
    logger.error(`Rust compilation failed for session ${sessionId}:`, error);
    
    const io = req.app.get('socketio');
    io.to(`compilation-${sessionId}`).emit('compilation-error', {
      sessionId,
      error: error.message
    });
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Compilation failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/compile/analyze:
 *   post:
 *     summary: Analyze code for security vulnerabilities and optimizations
 *     tags: [Compilation]
 */
router.post('/analyze', validateCompilationRequest, async (req, res) => {
  const sessionId = uuidv4();
  const { code, analysisType = 'full' } = req.body;
  
  try {
    logger.info(`Starting code analysis session: ${sessionId}`);
    
    const analyzer = new CodeAnalyzer();
    const result = await analyzer.analyze(code, analysisType);
    
    logger.info(`Code analysis completed for session: ${sessionId}`);
    
    res.json({
      success: true,
      sessionId,
      ...result
    });
    
  } catch (error) {
    logger.error(`Code analysis failed for session ${sessionId}:`, error);
    
    res.status(500).json({
      success: false,
      sessionId,
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * @swagger
 * /api/v1/compile/status/{sessionId}:
 *   get:
 *     summary: Get compilation status
 *     tags: [Compilation]
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/status/:sessionId', async (req, res) => {
  const { sessionId } = req.params;
  
  try {
    const status = await cacheManager.get(`compilation_status_${sessionId}`);
    
    if (!status) {
      return res.status(404).json({
        error: 'Session not found',
        sessionId
      });
    }
    
    res.json({
      sessionId,
      ...status
    });
    
  } catch (error) {
    logger.error(`Failed to get compilation status for session ${sessionId}:`, error);
    
    res.status(500).json({
      error: 'Failed to get status',
      sessionId
    });
  }
});

export default router;