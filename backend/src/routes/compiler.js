import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger.js';
import { cacheManager } from '../utils/cache.js';
import { validateCompilationRequest, validateSolidityCompilation, validateRustCompilation, validateVyperCompilation } from '../middleware/validation.js';
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
router.post('/vyper', validateVyperCompilation, async (req, res) => {
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
    const compiler = new VyperCompiler();
    
    // Compile code
    const result = await compiler.compile(code, 'MyContract', {
      optimization,
      version,
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
    
    // Normalize response structure to match frontend expectations
    const normalizedResponse = {
      success: result.success,
      sessionId,
      output: result.vyperCode || result.output || '', // Use vyperCode as output
      abi: result.abi || [],
      bytecode: result.bytecode?.object || result.bytecode || '', // Extract object from nested bytecode
      errors: result.error ? [result.error] : (result.errors || []),
      warnings: result.warnings || [],
      gasEstimate: result.gasEstimate || null,
      // Include additional metadata for debugging
      contractName: result.contractName,
      compiler: result.compiler,
      version: result.version,
      compilationTime: result.compilationTime
    };
    
    res.json(normalizedResponse);
    
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
      output: '',
      abi: [],
      bytecode: '',
      errors: [error.message || 'Compilation failed'],
      warnings: [],
      gasEstimate: null,
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
router.post('/solidity', validateSolidityCompilation, async (req, res) => {
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
    
    const compiler = new SolidityCompiler();
    const result = await compiler.compile(code, 'Contract', {
      optimization,
      version,
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
    
    // Debug logging to identify bytecode issues
    console.log('=== COMPILATION RESULT DEBUG ===');
    console.log('Result success:', result.success);
    console.log('Result keys:', Object.keys(result));
    console.log('Bytecode type:', typeof result.bytecode);
    console.log('Bytecode value:', result.bytecode);
    console.log('Bytecode object:', result.bytecode?.object);
    console.log('Bytecode length:', result.bytecode?.object?.length || result.bytecode?.length);
    console.log('Bytecode hex length (after 0x):', (result.bytecode?.object || result.bytecode)?.slice(2)?.length);
    console.log('Bytecode has even length:', ((result.bytecode?.object || result.bytecode)?.slice(2)?.length % 2 === 0));
    console.log('Source code present:', !!result.sourceCode);
    console.log('Original code present:', !!result.originalCode);
    console.log('=== END DEBUG ===');
    
    // Normalize response structure to match frontend expectations
    // Extract bytecode.object exactly as provided by the compiler service
    const extractedBytecode = result.bytecode?.object || result.bytecode || '';
    
    // Validate extracted bytecode but don't modify it
    if (extractedBytecode && extractedBytecode.startsWith('0x')) {
      const hexPart = extractedBytecode.slice(2);
      if (hexPart.length % 2 !== 0) {
        console.error('WARNING: Extracted bytecode has odd length, this should not happen with real compiler output');
      }
    }
    
    const normalizedResponse = {
      success: result.success,
      sessionId,
      output: result.solidityCode || result.output || '', // Use solidityCode as output
      abi: result.abi || [],
      bytecode: extractedBytecode, // Use exact bytecode from compiler service
      errors: result.error ? [result.error] : (result.errors || []),
      warnings: result.warnings || [],
      gasEstimate: result.gasEstimate || null,
      // Include additional metadata for debugging
      contractName: result.contractName,
      compiler: result.compiler,
      version: result.version,
      compilationTime: result.compilationTime,
      metadata: result.metadata
    };
    
    // Additional debugging for normalized response
    console.log('=== NORMALIZED RESPONSE DEBUG ===');
    console.log('Normalized bytecode:', normalizedResponse.bytecode);
    console.log('Normalized bytecode type:', typeof normalizedResponse.bytecode);
    console.log('Normalized bytecode starts with 0x:', normalizedResponse.bytecode?.startsWith('0x'));
    console.log('Normalized bytecode length:', normalizedResponse.bytecode?.length);
    console.log('Normalized bytecode hex length:', normalizedResponse.bytecode?.slice(2)?.length);
    console.log('Normalized bytecode has even length:', (normalizedResponse.bytecode?.slice(2)?.length % 2 === 0));
    console.log('First 100 chars:', normalizedResponse.bytecode?.substring(0, 100));
    console.log('Last 20 chars:', normalizedResponse.bytecode?.slice(-20));
    console.log('=== END NORMALIZED DEBUG ===');
    
    res.json(normalizedResponse);
    
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
router.post('/rust', validateRustCompilation, async (req, res) => {
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
    
    const compiler = new RustCompiler();
    const result = await compiler.compile({
      code,
      optimization,
      target: 'stylus',
      contractName: 'Contract',
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
    
    // Normalize response structure to match frontend expectations
    const normalizedResponse = {
      success: result.success,
      sessionId,
      output: result.rustCode || result.output || '', // Use rustCode as output
      abi: result.abi || [],
      bytecode: result.wasmBytecode || result.wasm || result.bytecode || '', // Use WASM bytecode for Stylus
      errors: result.error ? [result.error] : (result.errors || []),
      warnings: result.warnings || [],
      gasEstimate: result.gasEstimate || null,
      // Include additional metadata for debugging
      contractName: result.contractName,
      compiler: result.compiler,
      version: result.version,
      compilationTime: result.compilationTime,
      wasmBytecode: result.wasmBytecode,
      target: result.target
    };
    
    res.json(normalizedResponse);
    
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
      output: '',
      abi: [],
      bytecode: '',
      errors: [error.message || 'Compilation failed'],
      warnings: [],
      gasEstimate: null,
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