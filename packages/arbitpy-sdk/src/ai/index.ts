// ArbitPy AI Integration Client
import { EventEmitter } from 'eventemitter3';
import { HttpClient } from '../utils/http-client';
import {
  AIRequest,
  AIResponse,
  ArbitPyConfig,
  ArbitPyEvents,
} from '../types';

export interface AICodeReviewOptions {
  reviewType?: 'security' | 'gas' | 'style' | 'comprehensive';
  focusAreas?: string[];
  severity?: 'low' | 'medium' | 'high' | 'all';
}

export interface AICodeGenerationOptions {
  contractType?: 'token' | 'nft' | 'defi' | 'dao' | 'general';
  features?: string[];
  complexity?: 'simple' | 'intermediate' | 'advanced';
  target?: 'vyper' | 'solidity' | 'rust';
}

export interface AIOptimizationOptions {
  optimizationType?: 'gas' | 'security' | 'readability' | 'performance';
  aggressiveness?: 'conservative' | 'moderate' | 'aggressive';
}

export interface AIExplanationOptions {
  level?: 'beginner' | 'intermediate' | 'expert';
  focus?: 'functionality' | 'security' | 'gas' | 'patterns';
}

export interface AISessionContext {
  sessionId: string;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  codeContext?: string;
  userPreferences?: {
    verbosity?: 'concise' | 'detailed' | 'comprehensive';
    examples?: boolean;
    explanations?: boolean;
  };
}

export class ArbitPyAI extends EventEmitter<ArbitPyEvents> {
  private httpClient: HttpClient;
  private sessions: Map<string, AISessionContext>;
  private defaultSessionId: string;

  constructor(config: ArbitPyConfig = {}) {
    super();
    this.httpClient = new HttpClient(config);
    this.sessions = new Map();
    this.defaultSessionId = this.createSession();
  }

  /**
   * Start a new AI chat session
   */
  createSession(context?: string): string {
    const sessionId = `ai_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.sessions.set(sessionId, {
      sessionId,
      conversationHistory: [],
      codeContext: context,
    });

    return sessionId;
  }

  /**
   * Chat with ArbitPy AI Assistant
   */
  async chat(
    message: string,
    options: {
      sessionId?: string;
      context?: string;
      streaming?: boolean;
    } = {}
  ): Promise<AIResponse> {
    const sessionId = options.sessionId || this.defaultSessionId;
    const session = this.sessions.get(sessionId);

    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Add user message to history
    session.conversationHistory.push({
      role: 'user',
      content: message,
      timestamp: new Date(),
    });

    const request: AIRequest = {
      message,
      context: options.context || session.codeContext || '',
      type: 'chat',
    };

    try {
      const response = await this.httpClient.post<AIResponse>(
        '/ai/chat',
        {
          ...request,
          sessionId,
          conversationHistory: session.conversationHistory,
        }
      );

      const result = response.data;

      // Add assistant response to history
      if (result.success && result.message) {
        session.conversationHistory.push({
          role: 'assistant',
          content: result.message,
          timestamp: new Date(),
        });
      }

      return result;
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Get AI code review and analysis
   */
  async reviewCode(
    code: string,
    options: AICodeReviewOptions = {}
  ): Promise<AIResponse & {
    issues: Array<{
      line?: number;
      column?: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      category: 'security' | 'gas' | 'style' | 'logic';
      title: string;
      description: string;
      suggestion: string;
      example?: string;
    }>;
    score: {
      overall: number;
      security: number;
      gasEfficiency: number;
      codeQuality: number;
    };
    summary: {
      totalIssues: number;
      criticalIssues: number;
      estimatedGasSavings?: string;
      securityRisk: 'low' | 'medium' | 'high';
    };
  }> {
    const request: AIRequest = {
      message: 'Please review this smart contract code',
      code,
      type: 'review',
      options: {
        reviewType: options.reviewType || 'comprehensive',
      },
    };

    const response = await this.httpClient.post('/ai/code-review', request);
    return response.data;
  }

  /**
   * Generate smart contract code from description
   */
  async generateContract(
    description: string,
    options: AICodeGenerationOptions = {}
  ): Promise<AIResponse & {
    contracts: Array<{
      name: string;
      code: string;
      target: 'vyper' | 'solidity' | 'rust';
      description: string;
      features: string[];
      estimatedGas: string;
      complexity: 'simple' | 'intermediate' | 'advanced';
    }>;
    documentation: {
      overview: string;
      deployment: string;
      usage: string[];
      security: string[];
    };
  }> {
    const request: AIRequest = {
      message: `Generate a smart contract: ${description}`,
      type: 'generate',
      options: {
        contractType: options.contractType || 'general',
        features: options.features || [],
      },
    };

    const response = await this.httpClient.post('/ai/generate-contract', request);
    return response.data;
  }

  /**
   * Optimize existing contract code
   */
  async optimizeCode(
    code: string,
    options: AIOptimizationOptions = {}
  ): Promise<AIResponse & {
    optimizedCode: string;
    optimizations: Array<{
      type: 'gas' | 'security' | 'readability' | 'performance';
      description: string;
      impact: 'low' | 'medium' | 'high';
      gasSavings?: string;
      beforeExample: string;
      afterExample: string;
    }>;
    metrics: {
      gasSavingsEstimate: string;
      securityImprovement: number;
      readabilityScore: number;
    };
  }> {
    const request: AIRequest = {
      message: 'Please optimize this smart contract code',
      code,
      type: 'optimize',
      options: {
        optimizationType: options.optimizationType || 'gas',
      },
    };

    const response = await this.httpClient.post('/ai/optimize', request);
    return response.data;
  }

  /**
   * Get code explanation and documentation
   */
  async explainCode(
    code: string,
    options: AIExplanationOptions = {}
  ): Promise<AIResponse & {
    explanation: {
      overview: string;
      functions: Array<{
        name: string;
        purpose: string;
        parameters: Array<{
          name: string;
          type: string;
          description: string;
        }>;
        returns: string;
        gasEstimate: string;
        complexity: 'low' | 'medium' | 'high';
      }>;
      events: Array<{
        name: string;
        purpose: string;
        parameters: Record<string, string>;
      }>;
      security: {
        risks: string[];
        safeguards: string[];
        recommendations: string[];
      };
    };
    diagram?: string; // Mermaid diagram representation
    examples: string[];
  }> {
    const request: AIRequest = {
      message: 'Please explain this smart contract code',
      code,
      type: 'explain',
      options: {
        explanationType: options.level === 'beginner' ? 'simple' : 
                        options.level === 'expert' ? 'detailed' : 'detailed',
      },
    };

    const response = await this.httpClient.post('/ai/explain', request);
    return response.data;
  }

  /**
   * Get AI suggestions for bug fixes
   */
  async debugCode(
    code: string,
    errorMessage?: string,
    options: { context?: string } = {}
  ): Promise<AIResponse & {
    bugs: Array<{
      line?: number;
      type: 'syntax' | 'logic' | 'security' | 'gas' | 'runtime';
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      fix: string;
      example: string;
    }>;
    fixes: Array<{
      description: string;
      codeChanges: Array<{
        line: number;
        before: string;
        after: string;
      }>;
      impact: string;
    }>;
  }> {
    const request: AIRequest = {
      message: `Debug this code${errorMessage ? `: ${errorMessage}` : ''}`,
      code,
      type: 'debug',
      context: options.context,
    };

    const response = await this.httpClient.post('/ai/debug', request);
    return response.data;
  }

  /**
   * Get smart contract templates and patterns
   */
  async getTemplates(
    category: string = 'all'
  ): Promise<{
    templates: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      code: string;
      features: string[];
      complexity: 'simple' | 'intermediate' | 'advanced';
      gasEstimate: string;
      useCase: string;
    }>;
    patterns: Array<{
      name: string;
      description: string;
      example: string;
      benefits: string[];
      gasImpact: 'positive' | 'neutral' | 'negative';
    }>;
  }> {
    const response = await this.httpClient.get('/ai/templates', {
      params: { category },
    });
    return response.data;
  }

  /**
   * Get session conversation history
   */
  getSessionHistory(sessionId?: string): AISessionContext | undefined {
    const id = sessionId || this.defaultSessionId;
    return this.sessions.get(id);
  }

  /**
   * Clear session history
   */
  clearSession(sessionId?: string): void {
    const id = sessionId || this.defaultSessionId;
    const session = this.sessions.get(id);
    
    if (session) {
      session.conversationHistory = [];
    }
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Update session context
   */
  updateSessionContext(sessionId: string, context: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.codeContext = context;
    }
  }

  /**
   * Get AI model status and capabilities
   */
  async getModelStatus(): Promise<{
    available: boolean;
    model: string;
    version: string;
    capabilities: string[];
    limitations: string[];
    tokensPerRequest: {
      max: number;
      recommended: number;
    };
  }> {
    const response = await this.httpClient.get('/ai/status');
    return response.data;
  }
}