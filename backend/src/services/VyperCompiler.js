import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export class VyperCompiler {
  constructor() {
    this.version = '0.3.7';
    this.tempDir = path.join(process.cwd(), 'temp');
    this.ensureTempDir();
  }
  
  async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }
  
  /**
   * Compile Vyper contract
   * @param {string} sourceCode - Vyper source code
   * @param {string} contractName - Name of the contract
   * @param {Object} options - Compilation options
   * @returns {Promise<Object>} Compilation result
   */
  async compile(sourceCode, contractName = 'Contract', options = {}) {
    const startTime = Date.now();
    let tempFile = null;
    
    try {
      // Validate source code
      if (!sourceCode || typeof sourceCode !== 'string') {
        throw new Error('Invalid source code provided');
      }
      
      // Create temporary file
      const fileName = `${contractName}_${Date.now()}.vy`;
      tempFile = path.join(this.tempDir, fileName);
      
      await fs.writeFile(tempFile, sourceCode, 'utf8');
      
      // Prepare compilation command
      const compileOptions = this.buildCompileOptions(options);
      const command = `vyper ${compileOptions} "${tempFile}"`;
      
      logger.info(`Compiling Vyper contract: ${contractName}`);
      logger.debug(`Command: ${command}`);
      
      // Execute compilation
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000, // 30 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });
      
      if (stderr) {
        logger.warn(`Vyper compilation warnings: ${stderr}`);
      }
      
      // Parse compilation output
      const result = await this.parseCompilationOutput(stdout, contractName, options);
      
      const compilationTime = Date.now() - startTime;
      
      logger.info(`Vyper compilation completed in ${compilationTime}ms`);
      
      return {
        success: true,
        contractName,
        compilationTime,
        compiler: 'vyper',
        version: this.version,
        ...result
      };
      
    } catch (error) {
      const compilationTime = Date.now() - startTime;
      
      logger.error(`Vyper compilation failed: ${error.message}`);
      
      return {
        success: false,
        contractName,
        compilationTime,
        compiler: 'vyper',
        version: this.version,
        error: error.message,
        details: this.parseError(error.message)
      };
      
    } finally {
      // Cleanup temporary file
      if (tempFile) {
        try {
          await fs.unlink(tempFile);
        } catch (cleanupError) {
          logger.warn(`Failed to cleanup temp file: ${cleanupError.message}`);
        }
      }
    }
  }
  
  /**
   * Build compilation options string
   * @param {Object} options - Compilation options
   * @returns {string} Options string
   */
  buildCompileOptions(options) {
    const opts = [];
    
    // Output format options
    if (options.abi !== false) opts.push('-f abi');
    if (options.bytecode !== false) opts.push('-f bytecode');
    if (options.bytecodeRuntime) opts.push('-f bytecode_runtime');
    if (options.ast) opts.push('-f ast');
    if (options.sourceMap) opts.push('-f source_map');
    if (options.methodIdentifiers) opts.push('-f method_identifiers');
    
    // Default to ABI and bytecode if no specific outputs requested
    if (opts.length === 0) {
      opts.push('-f abi,bytecode');
    }
    
    // Optimization level
    if (options.optimize !== undefined) {
      opts.push(`-O ${options.optimize}`);
    }
    
    // EVM version
    if (options.evmVersion) {
      opts.push(`--evm-version ${options.evmVersion}`);
    }
    
    return opts.join(' ');
  }
  
  /**
   * Parse compilation output
   * @param {string} output - Raw compilation output
   * @param {string} contractName - Contract name
   * @param {Object} options - Compilation options
   * @returns {Promise<Object>} Parsed result
   */
  async parseCompilationOutput(output, contractName, options) {
    const result = {};
    
    try {
      // Try to parse as JSON first (for multiple outputs)
      const parsed = JSON.parse(output);
      
      if (parsed.abi) result.abi = parsed.abi;
      if (parsed.bytecode) result.bytecode = parsed.bytecode;
      if (parsed.bytecode_runtime) result.bytecodeRuntime = parsed.bytecode_runtime;
      if (parsed.ast) result.ast = parsed.ast;
      if (parsed.source_map) result.sourceMap = parsed.source_map;
      if (parsed.method_identifiers) result.methodIdentifiers = parsed.method_identifiers;
      
    } catch {
      // If not JSON, treat as raw output (single format)
      if (output.startsWith('[')) {
        // ABI output
        result.abi = JSON.parse(output);
      } else if (output.startsWith('0x')) {
        // Bytecode output
        result.bytecode = output.trim();
      } else {
        // Other formats or raw text
        result.rawOutput = output.trim();
      }
    }
    
    // Calculate additional metadata
    if (result.bytecode) {
      result.bytecodeSize = Math.floor(result.bytecode.replace('0x', '').length / 2);
      result.estimatedGas = this.estimateDeploymentGas(result.bytecode);
    }
    
    return result;
  }
  
  /**
   * Parse compilation error
   * @param {string} errorMessage - Error message
   * @returns {Object} Parsed error details
   */
  parseError(errorMessage) {
    const errorDetails = {
      type: 'compilation_error',
      message: errorMessage,
      line: null,
      column: null,
      suggestions: []
    };
    
    // Extract line and column information
    const lineMatch = errorMessage.match(/line (\d+)/i);
    const columnMatch = errorMessage.match(/column (\d+)/i);
    
    if (lineMatch) errorDetails.line = parseInt(lineMatch[1]);
    if (columnMatch) errorDetails.column = parseInt(columnMatch[1]);
    
    // Categorize error types and provide suggestions
    if (errorMessage.includes('SyntaxError')) {
      errorDetails.type = 'syntax_error';
      errorDetails.suggestions.push('Check for missing colons, incorrect indentation, or invalid syntax');
    } else if (errorMessage.includes('TypeError')) {
      errorDetails.type = 'type_error';
      errorDetails.suggestions.push('Verify variable types and function signatures');
    } else if (errorMessage.includes('NameError')) {
      errorDetails.type = 'name_error';
      errorDetails.suggestions.push('Check if all variables and functions are properly declared');
    } else if (errorMessage.includes('ImportError')) {
      errorDetails.type = 'import_error';
      errorDetails.suggestions.push('Verify import statements and available modules');
    }
    
    return errorDetails;
  }
  
  /**
   * Estimate deployment gas
   * @param {string} bytecode - Contract bytecode
   * @returns {number} Estimated gas
   */
  estimateDeploymentGas(bytecode) {
    const baseGas = 21000;
    const bytecodeLength = bytecode.replace('0x', '').length;
    const codeGas = Math.floor(bytecodeLength / 2) * 200; // ~200 gas per byte
    
    return baseGas + codeGas;
  }
  
  /**
   * Get compiler version
   * @returns {Promise<string>} Compiler version
   */
  async getVersion() {
    try {
      const { stdout } = await execAsync('vyper --version');
      return stdout.trim();
    } catch (error) {
      logger.error('Failed to get Vyper version:', error);
      return this.version;
    }
  }
  
  /**
   * Check if Vyper is installed
   * @returns {Promise<boolean>} Installation status
   */
  async isInstalled() {
    try {
      await execAsync('vyper --version');
      return true;
    } catch {
      return false;
    }
  }
}