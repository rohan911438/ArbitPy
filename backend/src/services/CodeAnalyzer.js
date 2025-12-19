import { logger } from '../utils/logger.js';

export class CodeAnalyzer {
  constructor() {
    this.patterns = {
      // Security patterns
      reentrancy: /\.call\s*\(/g,
      uncheckedCall: /\.call\.value\(/g,
      overflow: /\+\s*(?!=)/g,
      underflow: /-\s*(?!=)/g,
      
      // Gas optimization patterns
      storageLoop: /for.*storage/gi,
      redundantStorage: /storage.*=.*storage/gi,
      
      // Best practice patterns
      missingRequire: /function.*public.*{[^}]*(?!require)/gs,
      hardcodedAddress: /0x[a-fA-F0-9]{40}/g,
      
      // Python-specific patterns
      pythonClass: /class\s+(\w+):/g,
      pythonFunction: /def\s+(\w+)\(/g,
      pythonInit: /__init__/g,
      pythonSelf: /self\./g
    };
    
    this.recommendations = {
      security: [
        'Use reentrancy guards for functions that make external calls',
        'Validate all inputs with require() statements',
        'Use SafeMath for arithmetic operations to prevent overflow/underflow',
        'Avoid hardcoded addresses, use constructor parameters instead'
      ],
      gas: [
        'Minimize storage operations by caching values in memory',
        'Use view/pure functions when possible to avoid gas costs',
        'Pack struct variables to optimize storage slots',
        'Use events for logging instead of storing data'
      ],
      style: [
        'Follow consistent naming conventions (camelCase for variables)',
        'Add comprehensive documentation for all public functions',
        'Use descriptive variable names instead of single letters',
        'Group related functions together'
      ]
    };
  }

  /**
   * Analyze Python-like smart contract code
   * @param {string} code - Code to analyze
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Analysis result
   */
  async analyze(code, options = {}) {
    const {
      checkSecurity = true,
      checkGas = true,
      checkStyle = true,
      checkComplexity = true
    } = options;

    try {
      logger.info('Starting code analysis...');

      const results = {
        success: true,
        codeMetrics: this.getCodeMetrics(code),
        issues: [],
        recommendations: [],
        score: 0
      };

      if (checkSecurity) {
        const securityIssues = this.analyzeSecurityIssues(code);
        results.issues.push(...securityIssues);
        
        if (securityIssues.length === 0) {
          results.recommendations.push(...this.recommendations.security.slice(0, 2));
        }
      }

      if (checkGas) {
        const gasIssues = this.analyzeGasOptimization(code);
        results.issues.push(...gasIssues);
        
        if (gasIssues.length > 0) {
          results.recommendations.push(...this.recommendations.gas);
        }
      }

      if (checkStyle) {
        const styleIssues = this.analyzeCodeStyle(code);
        results.issues.push(...styleIssues);
        
        if (styleIssues.length > 0) {
          results.recommendations.push(...this.recommendations.style);
        }
      }

      if (checkComplexity) {
        const complexityAnalysis = this.analyzeComplexity(code);
        results.complexity = complexityAnalysis;
        
        if (complexityAnalysis.cyclomaticComplexity > 10) {
          results.issues.push({
            type: 'complexity',
            severity: 'warning',
            line: 0,
            message: `High cyclomatic complexity (${complexityAnalysis.cyclomaticComplexity}). Consider breaking down complex functions.`,
            suggestion: 'Split large functions into smaller, more manageable pieces'
          });
        }
      }

      // Calculate overall score
      results.score = this.calculateScore(results.issues, results.codeMetrics);
      
      // Categorize issues by severity
      results.summary = this.summarizeIssues(results.issues);

      logger.info(`Code analysis completed. Score: ${results.score}/100`);
      
      return results;
    } catch (error) {
      logger.error('Code analysis failed:', error);
      
      return {
        success: false,
        error: error.message,
        codeMetrics: this.getCodeMetrics(code),
        issues: [],
        recommendations: [],
        score: 0
      };
    }
  }

  /**
   * Get basic code metrics
   * @param {string} code - Code to analyze
   * @returns {Object} Code metrics
   */
  getCodeMetrics(code) {
    const lines = code.split('\n');
    const nonEmptyLines = lines.filter(line => line.trim().length > 0);
    const commentLines = lines.filter(line => line.trim().startsWith('#'));
    
    const functions = (code.match(this.patterns.pythonFunction) || []).length;
    const classes = (code.match(this.patterns.pythonClass) || []).length;
    
    return {
      totalLines: lines.length,
      codeLines: nonEmptyLines.length,
      commentLines: commentLines.length,
      commentRatio: commentLines.length / nonEmptyLines.length,
      functions,
      classes,
      averageLineLength: code.length / lines.length
    };
  }

  /**
   * Analyze security issues
   * @param {string} code - Code to analyze
   * @returns {Array} Security issues
   */
  analyzeSecurityIssues(code) {
    const issues = [];
    const lines = code.split('\n');

    // Check for reentrancy vulnerabilities
    lines.forEach((line, index) => {
      if (this.patterns.reentrancy.test(line)) {
        issues.push({
          type: 'security',
          severity: 'high',
          line: index + 1,
          message: 'Potential reentrancy vulnerability detected',
          suggestion: 'Use reentrancy guard or checks-effects-interactions pattern',
          code: line.trim()
        });
      }
    });

    // Check for hardcoded addresses
    const hardcodedMatches = code.match(this.patterns.hardcodedAddress);
    if (hardcodedMatches) {
      issues.push({
        type: 'security',
        severity: 'medium',
        line: 0,
        message: `Found ${hardcodedMatches.length} hardcoded address(es)`,
        suggestion: 'Use constructor parameters or configuration for addresses',
        addresses: hardcodedMatches
      });
    }

    return issues;
  }

  /**
   * Analyze gas optimization opportunities
   * @param {string} code - Code to analyze
   * @returns {Array} Gas optimization issues
   */
  analyzeGasOptimization(code) {
    const issues = [];
    const lines = code.split('\n');

    // Check for storage operations in loops
    lines.forEach((line, index) => {
      if (this.patterns.storageLoop.test(line)) {
        issues.push({
          type: 'gas',
          severity: 'medium',
          line: index + 1,
          message: 'Storage operation inside loop detected',
          suggestion: 'Cache storage values in memory variables before loops',
          code: line.trim()
        });
      }
    });

    // Check for redundant storage reads
    const storageReads = code.match(/self\.\w+/g) || [];
    const uniqueReads = new Set(storageReads);
    
    if (storageReads.length > uniqueReads.size * 2) {
      issues.push({
        type: 'gas',
        severity: 'low',
        line: 0,
        message: 'Multiple reads of the same storage variable detected',
        suggestion: 'Cache frequently accessed storage variables in local variables'
      });
    }

    return issues;
  }

  /**
   * Analyze code style issues
   * @param {string} code - Code to analyze
   * @returns {Array} Style issues
   */
  analyzeCodeStyle(code) {
    const issues = [];
    const lines = code.split('\n');

    // Check for function documentation
    const functionMatches = code.match(this.patterns.pythonFunction) || [];
    const docstringMatches = code.match(/"""[\s\S]*?"""/g) || [];
    
    if (functionMatches.length > docstringMatches.length) {
      issues.push({
        type: 'style',
        severity: 'low',
        line: 0,
        message: 'Some functions lack documentation',
        suggestion: 'Add docstrings to all public functions'
      });
    }

    // Check line length
    lines.forEach((line, index) => {
      if (line.length > 120) {
        issues.push({
          type: 'style',
          severity: 'low',
          line: index + 1,
          message: `Line too long (${line.length} characters)`,
          suggestion: 'Keep lines under 120 characters for better readability'
        });
      }
    });

    return issues;
  }

  /**
   * Analyze code complexity
   * @param {string} code - Code to analyze
   * @returns {Object} Complexity analysis
   */
  analyzeComplexity(code) {
    // Simple cyclomatic complexity calculation
    const conditionals = (code.match(/if|elif|while|for|and|or/g) || []).length;
    const functions = (code.match(this.patterns.pythonFunction) || []).length;
    
    return {
      cyclomaticComplexity: conditionals + functions + 1,
      functionCount: functions,
      maxNesting: this.calculateMaxNesting(code),
      maintainabilityIndex: Math.max(0, 171 - 5.2 * Math.log(code.length) - 0.23 * conditionals)
    };
  }

  /**
   * Calculate maximum nesting level
   * @param {string} code - Code to analyze
   * @returns {number} Maximum nesting level
   */
  calculateMaxNesting(code) {
    const lines = code.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      const leadingSpaces = line.length - line.trimStart().length;
      
      if (trimmed.startsWith('if') || trimmed.startsWith('for') || 
          trimmed.startsWith('while') || trimmed.startsWith('def') ||
          trimmed.startsWith('class')) {
        currentNesting = Math.floor(leadingSpaces / 4) + 1;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
    });

    return maxNesting;
  }

  /**
   * Calculate overall code score
   * @param {Array} issues - List of issues
   * @param {Object} metrics - Code metrics
   * @returns {number} Score out of 100
   */
  calculateScore(issues, metrics) {
    let score = 100;

    // Deduct points for issues
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'high':
          score -= 20;
          break;
        case 'medium':
          score -= 10;
          break;
        case 'low':
          score -= 5;
          break;
      }
    });

    // Bonus points for good practices
    if (metrics.commentRatio > 0.1) score += 5;
    if (metrics.functions > 0) score += 5;
    if (metrics.averageLineLength < 80) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Summarize issues by type and severity
   * @param {Array} issues - List of issues
   * @returns {Object} Issue summary
   */
  summarizeIssues(issues) {
    const summary = {
      total: issues.length,
      byType: {},
      bySeverity: {
        high: 0,
        medium: 0,
        low: 0
      }
    };

    issues.forEach(issue => {
      // Count by type
      summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;
      
      // Count by severity
      summary.bySeverity[issue.severity]++;
    });

    return summary;
  }

  /**
   * Get analysis recommendations based on code patterns
   * @param {string} code - Code to analyze
   * @returns {Array} Recommendations
   */
  getRecommendations(code) {
    const recommendations = [];

    // Check if it's a token contract
    if (code.includes('transfer') && code.includes('balance')) {
      recommendations.push({
        category: 'pattern',
        message: 'Consider implementing ERC-20 standard functions',
        priority: 'medium'
      });
    }

    // Check for NFT patterns
    if (code.includes('token_id') || code.includes('mint')) {
      recommendations.push({
        category: 'pattern',
        message: 'Consider implementing ERC-721 standard for NFTs',
        priority: 'medium'
      });
    }

    return recommendations;
  }
}