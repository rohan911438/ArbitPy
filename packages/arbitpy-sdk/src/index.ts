// ArbitPy SDK - Main Entry Point
export * from './types';
export * from './config';

// Core modules
export { ArbitPyCompiler } from './compiler';
export { ArbitPyDeployment } from './deployment';
export { ArbitPyContract, createContract } from './contract';
export { ArbitPyAI } from './ai';

// Utilities
export { HttpClient } from './utils/http-client';

// Main SDK class
import { EventEmitter } from 'eventemitter3';
import { ArbitPyCompiler } from './compiler';
import { ArbitPyDeployment } from './deployment';
import { ArbitPyContract, createContract } from './contract';
import { ArbitPyAI } from './ai';
import { ArbitPyConfig, ArbitPyEvents } from './types';

export class ArbitPySDK extends EventEmitter<ArbitPyEvents> {
  public readonly compiler: ArbitPyCompiler;
  public readonly deployment: ArbitPyDeployment;
  public readonly ai: ArbitPyAI;
  private config: ArbitPyConfig;

  constructor(config: ArbitPyConfig = {}) {
    super();
    
    this.config = {
      apiUrl: 'http://localhost:5000/api/v1',
      timeout: 30000,
      ...config,
    };

    // Initialize modules
    this.compiler = new ArbitPyCompiler(this.config);
    this.deployment = new ArbitPyDeployment(this.config);
    this.ai = new ArbitPyAI(this.config);

    // Forward events from modules
    this.forwardEvents();
  }

  /**
   * Create a contract instance for interaction
   */
  contract(
    address: string,
    abi: any[],
    network: string
  ): ArbitPyContract {
    return createContract(address, abi, network, this.config);
  }

  /**
   * Full workflow: compile, deploy, and create contract instance
   */
  async createAndDeploy(
    code: string,
    options: {
      target?: 'vyper' | 'solidity' | 'rust';
      network?: string;
      constructorParams?: any[];
      privateKey?: string;
      optimization?: boolean;
    } = {}
  ): Promise<{
    compilationResult: any;
    deploymentResult: any;
    contract: ArbitPyContract;
  }> {
    // Step 1: Compile the code
    const target = options.target || 'vyper';
    let compilationResult;

    switch (target) {
      case 'vyper':
        compilationResult = await this.compiler.compileVyper(code, {
          optimization: options.optimization,
        });
        break;
      case 'solidity':
        compilationResult = await this.compiler.compileSolidity(code, {
          optimization: options.optimization,
        });
        break;
      case 'rust':
        throw new Error('Rust compilation not yet implemented in this version');
        break;
      default:
        throw new Error(`Unsupported target: ${target}`);
    }

    if (!compilationResult.success) {
      throw new Error(
        `Compilation failed: ${compilationResult.errors?.[0]?.message || 'Unknown error'}`
      );
    }

    // Step 2: Deploy the contract
    const deploymentResult = await this.deployment.deploy({
      bytecode: compilationResult.bytecode!,
      abi: compilationResult.abi!,
      network: options.network || 'arbitrum-sepolia',
      constructorParams: options.constructorParams || [],
    }, options.privateKey);

    if (!deploymentResult.success) {
      throw new Error('Deployment failed');
    }

    // Step 3: Create contract instance
    const contract = this.contract(
      deploymentResult.contractAddress,
      compilationResult.abi!,
      options.network || 'arbitrum-sepolia'
    );

    return {
      compilationResult,
      deploymentResult,
      contract,
    };
  }

  /**
   * Get SDK configuration
   */
  getConfig(): ArbitPyConfig {
    return { ...this.config };
  }

  /**
   * Update SDK configuration
   */
  updateConfig(newConfig: Partial<ArbitPyConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update module configurations
    if (newConfig.apiUrl) {
      this.compiler['httpClient'].setBaseURL(newConfig.apiUrl);
      this.deployment['httpClient'].setBaseURL(newConfig.apiUrl);
      this.ai['httpClient'].setBaseURL(newConfig.apiUrl);
    }
    
    if (newConfig.apiKey) {
      this.compiler['httpClient'].setApiKey(newConfig.apiKey);
      this.deployment['httpClient'].setApiKey(newConfig.apiKey);
      this.ai['httpClient'].setApiKey(newConfig.apiKey);
    }
    
    if (newConfig.timeout) {
      this.compiler['httpClient'].setTimeout(newConfig.timeout);
      this.deployment['httpClient'].setTimeout(newConfig.timeout);
      this.ai['httpClient'].setTimeout(newConfig.timeout);
    }
  }

  /**
   * Get SDK version and information
   */
  static getVersion(): string {
    return '1.0.0';
  }

  /**
   * Get SDK information
   */
  static getInfo(): {
    version: string;
    name: string;
    description: string;
    author: string;
    license: string;
    repository: string;
  } {
    return {
      version: '1.0.0',
      name: '@arbitpy/sdk',
      description: 'Official TypeScript SDK for ArbitPy - Write smart contracts in Python syntax',
      author: 'BROTHERHOOD Team',
      license: 'MIT',
      repository: 'https://github.com/rohan911438/arbitpy-playground',
    };
  }

  private forwardEvents(): void {
    // Forward events from compiler
    this.compiler.on('compilation:started', (data) => 
      this.emit('compilation:started', data)
    );
    this.compiler.on('compilation:completed', (data) => 
      this.emit('compilation:completed', data)
    );
    this.compiler.on('compilation:failed', (data) => 
      this.emit('compilation:failed', data)
    );

    // Forward events from deployment
    this.deployment.on('deployment:started', (data) => 
      this.emit('deployment:started', data)
    );
    this.deployment.on('deployment:completed', (data) => 
      this.emit('deployment:completed', data)
    );
    this.deployment.on('deployment:failed', (data) => 
      this.emit('deployment:failed', data)
    );
    this.deployment.on('transaction:confirmed', (data) => 
      this.emit('transaction:confirmed', data)
    );

    // Forward errors from all modules
    this.compiler.on('error', (error) => this.emit('error', error));
    this.deployment.on('error', (error) => this.emit('error', error));
    this.ai.on('error', (error) => this.emit('error', error));
  }
}

// Default export
export default ArbitPySDK;