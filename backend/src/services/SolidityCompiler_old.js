import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../utils/logger.js';

const execAsync = promisify(exec);

export class SolidityCompiler {
  constructor() {
    this.version = '0.8.19';
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
   * Compile Solidity contract using mock implementation
   * @param {string} sourceCode - Solidity source code
   * @param {string} contractName - Name of the contract
   * @param {Object} options - Compilation options
   * @returns {Promise<Object>} Compilation result
   */
  async compile(sourceCode, contractName = 'Contract', options = {}) {
    const startTime = Date.now();
    
    try {
      // Validate source code
      if (!sourceCode || typeof sourceCode !== 'string') {
        throw new Error('Invalid source code provided');
      }

      // Extract actual contract name from source code if available
      const contractMatch = sourceCode.match(/contract\s+(\w+)/);
      if (contractMatch) {
        contractName = contractMatch[1];
      }
      
      logger.info(`Mock compiling Solidity contract: ${contractName}`);
      
      // Generate mock compilation result
      const compilationTime = Date.now() - startTime + Math.random() * 100;
      
      // Generate mock ABI
      const abi = this.generateMockABI(sourceCode);
      
      // Generate mock bytecode
      const bytecode = this.generateMockBytecode(contractName);
      
      logger.info(`Mock Solidity compilation completed in ${compilationTime}ms`);
      
      return {
        success: true,
        contractName,
        compilationTime: Math.floor(compilationTime),
        compiler: 'solidity',
        version: this.version,
        warnings: null,
        abi,
        bytecode: {
          object: bytecode,
          opcodes: "PUSH1 0x60 PUSH1 0x40 MSTORE",
          sourceMap: "26:495:0:-;;;;8:9:-1;5:2;;;30:1;27;20:12;5:2;26:495:0;;;;;;;"
        },
        metadata: this.generateMockMetadata(contractName),
        sourceCode
      };
      
    } catch (error) {
      const compilationTime = Date.now() - startTime;
      
      logger.error(`Mock Solidity compilation failed: ${error.message}`);
      
      return {
        success: false,
        contractName,
        compilationTime,
        compiler: 'solidity',
        version: this.version,
        error: error.message,
        details: this.parseError(error.message)
      };
      
    }
  }
  
  /**
   * Build compilation options string
   * @param {Object} options - Compilation options
   * @returns {string} Options string
   */
  buildCompileOptions(options) {
    const opts = [];
    
    // Output selection
    const outputTypes = [];
    if (options.abi !== false) outputTypes.push('abi');
    if (options.bytecode !== false) outputTypes.push('bin');
    if (options.bytecodeRuntime) outputTypes.push('bin-runtime');
    if (options.ast) outputTypes.push('ast');
    if (options.sourceMap) outputTypes.push('srcmap');
    if (options.sourceMapRuntime) outputTypes.push('srcmap-runtime');
    if (options.devDoc) outputTypes.push('devdoc');
    if (options.userDoc) outputTypes.push('userdoc');
    if (options.metadata) outputTypes.push('metadata');
    if (options.storageLayout) outputTypes.push('storage-layout');
    
    // Default outputs if none specified
    if (outputTypes.length === 0) {
      outputTypes.push('abi', 'bin');
    }
    
    opts.push(`--${outputTypes.join(' --')}`);
    
    // Optimization
    if (options.optimize !== false) {
      opts.push('--optimize');
      if (options.optimizeRuns) {
        opts.push(`--optimize-runs ${options.optimizeRuns}`);
      }
    }
    
    // EVM version
    if (options.evmVersion) {
      opts.push(`--evm-version ${options.evmVersion}`);
    }
    
    // Via IR (for newer versions)
    if (options.viaIR) {
      opts.push('--via-ir');
    }
    
    // Combined JSON output for easier parsing
    if (options.combinedJson) {
      opts.push(`--combined-json ${options.combinedJson}`);
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
      // Check if output is combined JSON
      if (options.combinedJson || output.trim().startsWith('{')) {
        const parsed = JSON.parse(output);
        
        // Extract data for the specific contract
        const fullContractName = Object.keys(parsed.contracts || {})[0];
        const contractData = parsed.contracts?.[fullContractName];
        
        if (contractData) {
          if (contractData.abi) {
            result.abi = typeof contractData.abi === 'string' 
              ? JSON.parse(contractData.abi) 
              : contractData.abi;
          }
          if (contractData.bin) result.bytecode = `0x${contractData.bin}`;
          if (contractData['bin-runtime']) result.bytecodeRuntime = `0x${contractData['bin-runtime']}`;
          if (contractData.srcmap) result.sourceMap = contractData.srcmap;
          if (contractData['srcmap-runtime']) result.sourceMapRuntime = contractData['srcmap-runtime'];
          if (contractData.devdoc) result.devDoc = contractData.devdoc;
          if (contractData.userdoc) result.userDoc = contractData.userdoc;
          if (contractData.metadata) result.metadata = contractData.metadata;
        }
        
        if (parsed.sources) result.sources = parsed.sources;
        if (parsed.version) result.compilerVersion = parsed.version;
        
      } else {
        // Parse individual outputs
        const lines = output.split('\n');
        let currentSection = null;
        let currentData = [];
        
        for (const line of lines) {
          if (line.includes('Binary:') || line.includes('Contract JSON ABI')) {
            if (currentSection && currentData.length > 0) {
              this.processSection(result, currentSection, currentData.join('\n'));
            }
            currentSection = line.includes('Binary:') ? 'bytecode' : 'abi';
            currentData = [];
          } else if (line.trim()) {
            currentData.push(line);
          }
        }
        
        // Process final section
        if (currentSection && currentData.length > 0) {
          this.processSection(result, currentSection, currentData.join('\n'));
        }
      }
      
    } catch (parseError) {
      logger.warn('Failed to parse compilation output as JSON, treating as raw:', parseError.message);
      result.rawOutput = output;
    }
    
    // Calculate additional metadata
    if (result.bytecode) {
      result.bytecodeSize = Math.floor(result.bytecode.replace('0x', '').length / 2);
      result.estimatedGas = this.estimateDeploymentGas(result.bytecode);
    }
    
    return result;
  }
  
  /**
   * Process individual output section
   * @param {Object} result - Result object to populate
   * @param {string} section - Section type
   * @param {string} data - Section data
   */
  processSection(result, section, data) {
    switch (section) {
      case 'abi':
        try {
          result.abi = JSON.parse(data);
        } catch {
          result.abi = data;
        }
        break;
      case 'bytecode':
        result.bytecode = data.startsWith('0x') ? data : `0x${data}`;
        break;
      default:
        result[section] = data;
    }
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
      file: null,
      severity: 'error',
      suggestions: []
    };
    
    // Extract location information
    const locationMatch = errorMessage.match(/(\w+\.sol):(\d+):(\d+):/);
    if (locationMatch) {
      errorDetails.file = locationMatch[1];
      errorDetails.line = parseInt(locationMatch[2]);
      errorDetails.column = parseInt(locationMatch[3]);
    }
    
    // Extract severity
    if (errorMessage.includes('Warning:')) {
      errorDetails.severity = 'warning';
    } else if (errorMessage.includes('Error:')) {
      errorDetails.severity = 'error';
    }
    
    // Categorize error types and provide suggestions
    if (errorMessage.includes('SyntaxError')) {
      errorDetails.type = 'syntax_error';
      errorDetails.suggestions.push('Check for missing semicolons, brackets, or invalid syntax');
    } else if (errorMessage.includes('TypeError')) {
      errorDetails.type = 'type_error';
      errorDetails.suggestions.push('Verify variable types, function signatures, and type conversions');
    } else if (errorMessage.includes('DeclarationError')) {
      errorDetails.type = 'declaration_error';
      errorDetails.suggestions.push('Check if all variables and functions are properly declared');
    } else if (errorMessage.includes('CompilerError')) {
      errorDetails.type = 'compiler_error';
      errorDetails.suggestions.push('This appears to be an internal compiler error');
    } else if (errorMessage.includes('InternalCompilerError')) {
      errorDetails.type = 'internal_compiler_error';
      errorDetails.suggestions.push('Please report this as a compiler bug');
    }
    
    // Specific error patterns
    if (errorMessage.includes('pragma solidity')) {
      errorDetails.suggestions.push('Check the pragma solidity version directive');
    }
    
    if (errorMessage.includes('function visibility')) {
      errorDetails.suggestions.push('Specify function visibility (public, private, internal, external)');
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
    const creationGas = 32000; // Base contract creation gas
    
    return baseGas + codeGas + creationGas;
  }
  
  /**
   * Get compiler version
   * @returns {Promise<string>} Compiler version
   */
  async getVersion() {
    try {
      const { stdout } = await execAsync('solc --version');
      const versionMatch = stdout.match(/Version: ([\d.]+)/);
      return versionMatch ? versionMatch[1] : this.version;
    } catch (error) {
      logger.error('Failed to get Solidity version:', error);
      return this.version;
    }
  }
  
  /**
   * Check if Solidity compiler is installed
   * @returns {Promise<boolean>} Installation status
   */
  async isInstalled() {
    try {
      await execAsync('solc --version');
      return true;
    } catch {
      return false;
    }
  }
  
  /**
   * Compile with standard JSON input
   * @param {Object} input - Standard JSON input
   * @returns {Promise<Object>} Compilation result
   */
  async compileStandardJson(input) {
    const startTime = Date.now();
    let tempFile = null;
    
    try {
      // Create temporary input file
      const fileName = `input_${Date.now()}.json`;
      tempFile = path.join(this.tempDir, fileName);
      
      await fs.writeFile(tempFile, JSON.stringify(input, null, 2), 'utf8');
      
      // Execute compilation with standard JSON
      const command = `solc --standard-json < "${tempFile}"`;
      
      logger.info('Compiling Solidity with standard JSON input');
      
      const { stdout, stderr } = await execAsync(command, {
        timeout: 30000,
        maxBuffer: 1024 * 1024
      });
      
      if (stderr) {
        logger.warn(`Solidity standard JSON compilation warnings: ${stderr}`);
      }
      
      const result = JSON.parse(stdout);
      const compilationTime = Date.now() - startTime;
      
      return {
        success: !result.errors || result.errors.every(err => err.severity === 'warning'),
        result,
        compilationTime,
        warnings: result.errors?.filter(err => err.severity === 'warning') || []
      };
      
    } catch (error) {
      const compilationTime = Date.now() - startTime;
      
      logger.error('Solidity standard JSON compilation failed:', error);
      
      return {
        success: false,
        error: error.message,
        compilationTime
      };
      
    } finally {
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
   * Generate mock ABI from Solidity source code
   * @param {string} sourceCode - Solidity source code
   * @returns {Array} Mock ABI
   */
  generateMockABI(sourceCode) {
    const abi = [];
    
    // Add constructor if found
    if (sourceCode.includes('constructor')) {
      abi.push({
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
      });
    }
    
    // Extract functions
    const functionMatches = sourceCode.matchAll(/function\s+(\w+)\s*\([^)]*\)\s*(public|private|internal|external)?\s*(pure|view|payable)?\s*(returns\s*\([^)]+\))?/g);
    for (const match of functionMatches) {
      const functionName = match[1];
      const visibility = match[2] || 'public';
      const stateMutability = match[3] || 'nonpayable';
      
      if (visibility === 'public' || visibility === 'external') {
        abi.push({
          "inputs": [],
          "name": functionName,
          "outputs": match[4] ? [{"internalType": "uint256", "name": "", "type": "uint256"}] : [],
          "stateMutability": stateMutability,
          "type": "function"
        });
      }
    }
    
    // Extract events
    const eventMatches = sourceCode.matchAll(/event\s+(\w+)\s*\([^)]*\)/g);
    for (const match of eventMatches) {
      abi.push({
        "anonymous": false,
        "inputs": [],
        "name": match[1],
        "type": "event"
      });
    }
    
    return abi;
  }

  /**
   * Generate mock bytecode
   * @param {string} contractName - Contract name
   * @returns {string} Mock bytecode
   */
  generateMockBytecode(contractName) {
    // Generate deterministic but realistic-looking bytecode
    const baseCode = "608060405234801561001057600080fd5b50";
    const nameHash = this.simpleHash(contractName);
    const dynamicPart = nameHash.toString(16).padStart(8, '0');
    
    return baseCode + dynamicPart + "6001600055348015610030576000803560e01c806");
  }

  /**
   * Generate mock metadata
   * @param {string} contractName - Contract name
   * @returns {Object} Mock metadata
   */
  generateMockMetadata(contractName) {
    return {
      "compiler": {
        "version": this.version
      },
      "language": "Solidity",
      "output": {
        "abi": [],
        "devdoc": {
          "kind": "dev",
          "methods": {},
          "version": 1
        },
        "userdoc": {
          "kind": "user",
          "methods": {},
          "version": 1
        }
      },
      "settings": {
        "compilationTarget": {
          "contract.sol": contractName
        },
        "evmVersion": "london",
        "libraries": {},
        "metadata": {
          "bytecodeHash": "ipfs"
        },
        "optimizer": {
          "enabled": true,
          "runs": 200
        },
        "remappings": []
      },
      "sources": {
        "contract.sol": {
          "keccak256": "0x" + this.simpleHash(contractName).toString(16).padStart(64, '0'),
          "urls": []
        }
      },
      "version": 1
    };
  }

  /**
   * Simple hash function for generating deterministic values
   * @param {string} str - String to hash
   * @returns {number} Hash value
   */
  simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}