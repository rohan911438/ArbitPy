// ArbitPy Compiler Client
import { EventEmitter } from 'eventemitter3';
import { HttpClient } from '../utils/http-client';
import {
  CompilationRequest,
  CompilationResult,
  ArbitPyConfig,
  ArbitPyEvents,
} from '../types';

export class ArbitPyCompiler extends EventEmitter<ArbitPyEvents> {
  private httpClient: HttpClient;

  constructor(config: ArbitPyConfig = {}) {
    super();
    this.httpClient = new HttpClient(config);
  }

  /**
   * Compile Python-like code to Vyper
   */
  async compileVyper(
    code: string,
    options: Omit<CompilationRequest, 'code' | 'target'> = {}
  ): Promise<CompilationResult> {
    return this.compile({
      code,
      target: 'vyper',
      ...options,
    });
  }

  /**
   * Compile Python-like code to Solidity
   */
  async compileSolidity(
    code: string,
    options: Omit<CompilationRequest, 'code' | 'target'> = {}
  ): Promise<CompilationResult> {
    return this.compile({
      code,
      target: 'solidity',
      ...options,
    });
  }

  /**
   * Compile Python-like code to Rust (Stylus)
   */
  async compileRust(
    code: string,
    options: Omit<CompilationRequest, 'code' | 'target'> = {}
  ): Promise<CompilationResult> {
    return this.compile({
      code,
      target: 'rust',
      ...options,
    });
  }

  /**
   * Generic compile method
   */
  async compile(request: CompilationRequest): Promise<CompilationResult> {
    try {
      // Emit compilation started event
      const sessionId = this.generateSessionId();
      this.emit('compilation:started', { sessionId });

      // Determine endpoint based on target
      const endpoint = this.getCompilationEndpoint(request.target);

      // Make compilation request
      const response = await this.httpClient.post<CompilationResult>(
        endpoint,
        {
          code: request.code,
          optimization: request.optimization ?? true,
          version: request.version ?? 'latest',
          ...request.options,
        }
      );

      const result = response.data;

      // Emit compilation completed event
      if (result.success) {
        this.emit('compilation:completed', result);
      } else {
        this.emit('compilation:failed', {
          sessionId: result.sessionId || sessionId,
          error: result.errors?.[0]?.message || 'Compilation failed',
        });
      }

      return result;
    } catch (error) {
      const sessionId = this.generateSessionId();
      this.emit('compilation:failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Get compilation status by session ID
   */
  async getCompilationStatus(sessionId: string): Promise<CompilationResult> {
    const response = await this.httpClient.get<CompilationResult>(
      `/compile/status/${sessionId}`
    );
    return response.data;
  }

  /**
   * Get supported compiler versions
   */
  async getSupportedVersions(target: 'vyper' | 'solidity' | 'rust'): Promise<{
    versions: string[];
    latest: string;
    recommended: string;
  }> {
    const response = await this.httpClient.get(`/compile/${target}/versions`);
    return response.data;
  }

  /**
   * Validate Python-like code syntax without compilation
   */
  async validateCode(code: string): Promise<{
    valid: boolean;
    errors: Array<{
      line: number;
      column: number;
      message: string;
      severity: 'error' | 'warning';
    }>;
  }> {
    const response = await this.httpClient.post('/compile/validate', { code });
    return response.data;
  }

  /**
   * Get example contracts for different categories
   */
  async getExamples(category?: string): Promise<{
    contracts: Array<{
      id: string;
      name: string;
      description: string;
      category: string;
      code: string;
      features: string[];
    }>;
  }> {
    const response = await this.httpClient.get('/contracts', {
      params: { category },
    });
    return response.data;
  }

  /**
   * Format Python-like code
   */
  async formatCode(code: string): Promise<{
    formatted: string;
    changes: Array<{
      line: number;
      type: 'format' | 'style';
      description: string;
    }>;
  }> {
    const response = await this.httpClient.post('/utils/format-code', {
      code,
      language: 'python',
    });
    return response.data;
  }

  /**
   * Get compilation statistics and analytics
   */
  async getCompilationStats(): Promise<{
    totalCompilations: number;
    successRate: number;
    averageCompilationTime: number;
    popularTargets: Array<{
      target: string;
      count: number;
      percentage: number;
    }>;
    commonErrors: Array<{
      error: string;
      count: number;
      solutions: string[];
    }>;
  }> {
    const response = await this.httpClient.get('/analytics/compilation');
    return response.data;
  }

  private getCompilationEndpoint(target: string): string {
    switch (target) {
      case 'vyper':
        return '/compile/vyper';
      case 'solidity':
        return '/compile/solidity';
      case 'rust':
        return '/compile/rust';
      default:
        throw new Error(`Unsupported compilation target: ${target}`);
    }
  }

  private generateSessionId(): string {
    return `compile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}