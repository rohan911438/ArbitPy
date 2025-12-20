import { ethers } from 'ethers';
import { logger } from './logger.js';

/**
 * Diagnose common deployment issues
 */
export class DeploymentDiagnostics {
  
  /**
   * Analyze a failed deployment transaction
   * @param {Object} params - Diagnostic parameters
   * @returns {Object} Diagnostic results
   */
  static async analyzeFailedDeployment({
    provider,
    txHash,
    bytecode,
    abi,
    constructorParams = [],
    gasLimit,
    gasPrice
  }) {
    const diagnostics = {
      issues: [],
      suggestions: [],
      transactionDetails: null
    };

    try {
      // Get transaction details if available
      if (txHash) {
        const tx = await provider.getTransaction(txHash);
        const receipt = await provider.getTransactionReceipt(txHash);
        
        diagnostics.transactionDetails = {
          transaction: tx,
          receipt: receipt,
          gasUsed: receipt?.gasUsed?.toString(),
          gasLimit: tx?.gasLimit?.toString(),
          status: receipt?.status
        };

        // Analyze gas usage
        if (receipt && tx) {
          const gasUsedPercentage = (Number(receipt.gasUsed) / Number(tx.gasLimit)) * 100;
          
          if (gasUsedPercentage > 95) {
            diagnostics.issues.push('Transaction used more than 95% of gas limit, likely out of gas');
            diagnostics.suggestions.push('Increase gas limit or optimize contract code');
          }
          
          if (receipt.status === 0) {
            diagnostics.issues.push('Transaction was reverted');
            diagnostics.suggestions.push('Check constructor logic and parameter types');
          }
        }
      }

      // Analyze bytecode
      if (bytecode) {
        this.analyzeBytecode(bytecode, diagnostics);
      }

      // Analyze constructor parameters
      if (abi && constructorParams) {
        this.analyzeConstructorParams(abi, constructorParams, diagnostics);
      }

    } catch (error) {
      diagnostics.issues.push(`Diagnostic analysis failed: ${error.message}`);
    }

    return diagnostics;
  }

  /**
   * Analyze bytecode for common issues
   */
  static analyzeBytecode(bytecode, diagnostics) {
    if (!bytecode.startsWith('0x')) {
      diagnostics.issues.push('Bytecode does not start with 0x');
      diagnostics.suggestions.push('Ensure bytecode is properly formatted hex string');
      return;
    }

    const hexPart = bytecode.slice(2);
    
    if (hexPart.length === 0) {
      diagnostics.issues.push('Empty bytecode');
      diagnostics.suggestions.push('Ensure contract was compiled successfully');
      return;
    }

    if (hexPart.length % 2 !== 0) {
      diagnostics.issues.push('Bytecode has odd number of hex characters');
      diagnostics.suggestions.push('Bytecode must have even number of hex characters');
    }

    if (hexPart.length < 20) {
      diagnostics.issues.push('Bytecode is too short to be valid contract bytecode');
      diagnostics.suggestions.push('Ensure you are using compiled bytecode, not source code');
    }

    // Check for common bytecode patterns
    if (!hexPart.includes('60') && !hexPart.includes('61')) {
      diagnostics.issues.push('Bytecode does not contain common EVM opcodes');
      diagnostics.suggestions.push('Verify bytecode is from a valid Solidity compilation');
    }
  }

  /**
   * Analyze constructor parameters
   */
  static analyzeConstructorParams(abi, constructorParams, diagnostics) {
    const constructor = abi.find(item => item.type === 'constructor');
    
    if (!constructor) {
      if (constructorParams.length > 0) {
        diagnostics.issues.push('Constructor parameters provided but no constructor found in ABI');
        diagnostics.suggestions.push('Remove constructor parameters or verify ABI includes constructor');
      }
      return;
    }

    const expectedParams = constructor.inputs || [];
    
    if (expectedParams.length !== constructorParams.length) {
      diagnostics.issues.push(`Constructor expects ${expectedParams.length} parameters but ${constructorParams.length} provided`);
      diagnostics.suggestions.push(`Required parameters: ${expectedParams.map(p => `${p.name} (${p.type})`).join(', ')}`);
      return;
    }

    // Type checking
    for (let i = 0; i < expectedParams.length; i++) {
      const expected = expectedParams[i];
      const provided = constructorParams[i];
      
      try {
        this.validateParamType(expected.type, provided, diagnostics, expected.name);
      } catch (error) {
        diagnostics.issues.push(`Parameter ${expected.name} validation failed: ${error.message}`);
        diagnostics.suggestions.push(`Ensure parameter ${expected.name} matches type ${expected.type}`);
      }
    }
  }

  /**
   * Validate parameter type
   */
  static validateParamType(expectedType, value, diagnostics, paramName) {
    if (expectedType.startsWith('uint') || expectedType.startsWith('int')) {
      if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'bigint') {
        diagnostics.issues.push(`Parameter ${paramName} should be a number for type ${expectedType}`);
      }
    } else if (expectedType === 'address') {
      if (typeof value !== 'string' || !value.startsWith('0x') || value.length !== 42) {
        diagnostics.issues.push(`Parameter ${paramName} should be a valid Ethereum address`);
      }
    } else if (expectedType === 'bool') {
      if (typeof value !== 'boolean') {
        diagnostics.issues.push(`Parameter ${paramName} should be a boolean for type ${expectedType}`);
      }
    } else if (expectedType.startsWith('bytes')) {
      if (typeof value !== 'string' || !value.startsWith('0x')) {
        diagnostics.issues.push(`Parameter ${paramName} should be a hex string for type ${expectedType}`);
      }
    }
  }

  /**
   * Get common deployment fixes
   */
  static getCommonFixes() {
    return {
      'out of gas': [
        'Increase gas limit',
        'Optimize contract code to reduce deployment cost',
        'Split complex constructor logic into separate functions'
      ],
      'constructor reverted': [
        'Check constructor parameter types and values',
        'Verify constructor logic does not have failing require statements',
        'Ensure any external contract calls in constructor are valid'
      ],
      'invalid bytecode': [
        'Recompile contract with correct Solidity version',
        'Ensure bytecode is from successful compilation',
        'Check for compilation errors or warnings'
      ],
      'insufficient funds': [
        'Add more ETH to wallet for gas fees',
        'Reduce gas price if network allows',
        'Use a different wallet with sufficient funds'
      ]
    };
  }

  /**
   * Generate deployment troubleshooting report
   */
  static generateTroubleshootingReport(diagnostics, error) {
    const report = {
      summary: 'Deployment Failed',
      error: error?.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      issues: diagnostics.issues || [],
      suggestions: diagnostics.suggestions || [],
      commonFixes: this.getCommonFixes(),
      transactionDetails: diagnostics.transactionDetails,
      nextSteps: [
        'Review the issues and suggestions above',
        'Check transaction on block explorer if hash is available',
        'Verify contract compiles without errors',
        'Test deployment on a testnet first'
      ]
    };

    logger.info('Generated deployment troubleshooting report', report);
    return report;
  }
}