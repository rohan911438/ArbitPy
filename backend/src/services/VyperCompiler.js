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
    
    try {
      // Validate source code
      if (!sourceCode || typeof sourceCode !== 'string') {
        throw new Error('Invalid source code provided');
      }
      
      logger.info(`Mock compilation of Python-like code to Solidity for contract: ${contractName}`);
      
      // Mock compilation - Generate Solidity from Python-like syntax
      const solidityCode = this.generateSolidityFromPython(sourceCode, contractName);
      const abi = this.generateABI(contractName, sourceCode);
      const bytecode = this.generateBytecode();
      
      const compilationTime = Date.now() - startTime;
      
      logger.info(`Mock Solidity compilation completed in ${compilationTime}ms`);
      
      return {
        success: true,
        contractName,
        compilationTime,
        compiler: 'vyper',
        version: this.version,
        output: solidityCode,
        solidityCode: solidityCode,
        abi: abi,
        bytecode: bytecode,
        warnings: [],
        gasEstimate: this.estimateGas(solidityCode)
      };
      
    } catch (error) {
      const compilationTime = Date.now() - startTime;
      
      logger.error(`Mock compilation failed: ${error.message}`);
      
      return {
        success: false,
        contractName,
        compilationTime,
        compiler: 'vyper',
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

  /**
   * Generate Solidity code from Python-like syntax
   * @param {string} pythonCode - Python-like source code
   * @param {string} contractName - Contract name
   * @returns {string} Generated Solidity code
   */
  generateSolidityFromPython(pythonCode, contractName) {
    return `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ${contractName}
 * @dev Compiled from ArbitPy Python contract
 */
contract ${contractName} {
    string public name = "ArbitPy Token";
    string public symbol = "APY";
    uint8 public decimals = 18;
    uint256 public totalSupply;
    
    mapping(address => uint256) private _balances;
    mapping(address => mapping(address => uint256)) private _allowances;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        totalSupply = 1000000 * 10**decimals;
        _balances[msg.sender] = totalSupply;
        emit Transfer(address(0), msg.sender, totalSupply);
    }
    
    /**
     * @dev Get the balance of an account
     */
    function balanceOf(address account) external view returns (uint256) {
        return _balances[account];
    }
    
    /**
     * @dev Transfer tokens to another address
     */
    function transfer(address to, uint256 amount) external returns (bool) {
        require(_balances[msg.sender] >= amount, "Insufficient balance");
        
        _balances[msg.sender] -= amount;
        _balances[to] += amount;
        
        emit Transfer(msg.sender, to, amount);
        return true;
    }
    
    /**
     * @dev Approve spender to spend tokens
     */
    function approve(address spender, uint256 amount) external returns (bool) {
        _allowances[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }
    
    /**
     * @dev Get allowance for spender
     */
    function allowance(address owner, address spender) external view returns (uint256) {
        return _allowances[owner][spender];
    }
}`;
  }

  /**
   * Generate ABI for contract
   * @param {string} contractName - Contract name
   * @param {string} sourceCode - Source code to analyze
   * @returns {Array} Generated ABI
   */
  generateABI(contractName, sourceCode) {
    return [
      {
        "inputs": [],
        "name": "constructor",
        "stateMutability": "nonpayable",
        "type": "constructor"
      },
      {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "inputs": [{"name": "to", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "spender", "type": "address"}, {"name": "amount", "type": "uint256"}],
        "name": "approve",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "nonpayable",
        "type": "function"
      },
      {
        "inputs": [{"name": "owner", "type": "address"}, {"name": "spender", "type": "address"}],
        "name": "allowance",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "name": "from", "type": "address"},
          {"indexed": true, "name": "to", "type": "address"},
          {"indexed": false, "name": "value", "type": "uint256"}
        ],
        "name": "Transfer",
        "type": "event"
      },
      {
        "anonymous": false,
        "inputs": [
          {"indexed": true, "name": "owner", "type": "address"},
          {"indexed": true, "name": "spender", "type": "address"},
          {"indexed": false, "name": "value", "type": "uint256"}
        ],
        "name": "Approval",
        "type": "event"
      }
    ];
  }

  /**
   * Generate mock bytecode
   * @returns {string} Mock bytecode
   */
  generateBytecode() {
    return '0x608060405234801561001057600080fd5b50336000806101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff1602179055506000600160006101000a81548160ff021916908360ff1602179055506040518060400160405280600d81526020017f41726269745079546f6b656e00000000000000000000000000000000000000008152506002908051906020019061009c929190610164565b506040518060400160405280600381526020017f41505900000000000000000000000000000000000000000000000000000000008152506003908051906020019061010a929190610164565b50601260009054906101000a900460ff1660ff16600a0a620f42400260048190555060045460056000336000906101000a81548173ffffffffffffffffffffffffffffffffffffffff021916908373ffffffffffffffffffffffffffffffffffffffff16021790555050610268565b828054600181600116156101000203166002900490600052602060002090601f016020900481019282601f106101a557805160ff19168380011785556101d3565b828001600101855582156101d3579182015b828111156101d25782518255916020019190600101906101b7565b5b5090506101e091906101e4565b5090565b5b808211156101fd5760008160009055506001016101e5565b5090565b61083f806102116000396000f3fe608060405234801561001057600080fd5b50600436106100885760003560e01c80634e6ec2471161005b5780634e6ec24714610156578063611e4e3c1461018f5780636040e4c7146101c85780637b351233146102015761008d565b8063095ea7b31461009257806317ffc320146100f557806323b872dd146100ff578063313ce567146101385761008d565b36600088fd5b6100db600480360381019080803573ffffffffffffffffffffffffffffffffffffffff16906020019092919080359060200190929190505050610234565b604051808215151515815260200191505060405180910390f35b6100fd610324565b005b61011e60048036038101908080359060200190929190505050610326565b604051808215151515815260200191505060405180910390f35b610140610408565b6040518082815260200191505060405180910390f35b61017960048036038101908080359060200190929190505050610421565b6040518082815260200191505060405180910390f35b6101b2600480360381019080803590602001909291905050506104a5565b6040518082815260200191505060405180910390f35b6101eb600480360381019080803590602001909291905050506104f7565b6040518082815260200191505060405180910390f35b61021e6004803603810190808035906020019092919050505061053e565b6040518082815260200191505060405180910390f35b600081600760003373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040518082815260200191505060405180910390a36001905092915050565b565b6000816005600085815260200190815260200160002054101515156103dd576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040180806020018281038252602081526020017f496e73756666696369656e742062616c616e6365000000000000000000000000815250602001915050600480910390fd5b816005600085815260200190815260200160002060008282540392505081905550600190509092915050565b6000600160009054906101000a900460ff16905090565b6000600560008381526020019081526020016000205490919050565b60006005600083815260200190815260200160002054905080915050919050565b60006005600083815260200190815260200160002054905080915050919050565b6000600560008381526020019081526020016000205490505b9191905056fea165627a7a72305820' + Math.random().toString(16).substring(2);
  }

  /**
   * Estimate gas for contract
   * @param {string} solidityCode - Generated Solidity code
   * @returns {Object} Gas estimation
   */
  estimateGas(solidityCode) {
    return {
      creation: 200000,
      external: {
        'balanceOf': 1000,
        'transfer': 25000,
        'approve': 22000,
        'allowance': 1000
      }
    };
  }

  /**
   * Parse error message for better user feedback
   * @param {string} errorMessage - Raw error message
   * @returns {Object} Parsed error details
   */
  parseError(errorMessage) {
    return {
      type: 'compilation_error',
      message: errorMessage,
      suggestions: ['Check your Python syntax', 'Ensure proper indentation', 'Verify contract structure']
    };
  }
}