// Core types and interfaces for ArbitPy SDK

export interface ArbitPyConfig {
  apiUrl?: string;
  apiKey?: string;
  timeout?: number;
}

export interface Network {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export interface CompilationRequest {
  code: string;
  target: 'solidity' | 'vyper' | 'rust';
  optimization?: boolean;
  version?: string;
  options?: Record<string, any>;
}

export interface CompilationResult {
  success: boolean;
  sessionId: string;
  bytecode?: string;
  abi?: any[];
  sourceMap?: string;
  metadata?: any;
  warnings?: CompilationWarning[];
  errors?: CompilationError[];
  gasEstimate?: GasEstimate;
}

export interface CompilationWarning {
  message: string;
  line?: number;
  column?: number;
  severity: 'warning' | 'info';
}

export interface CompilationError {
  message: string;
  line?: number;
  column?: number;
  severity: 'error' | 'fatal';
}

export interface GasEstimate {
  creation: number;
  execution: number;
  total: number;
}

export interface DeploymentRequest {
  bytecode: string;
  abi: any[];
  network: string;
  constructorParams?: any[];
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
}

export interface DeploymentResult {
  success: boolean;
  transactionHash: string;
  contractAddress: string;
  blockNumber: number;
  gasUsed: string;
  status: 'pending' | 'confirmed' | 'failed';
  explorerUrl?: string;
}

export interface ContractInteractionOptions {
  gasLimit?: string;
  gasPrice?: string;
  value?: string;
  from?: string;
}

export interface AIRequest {
  message: string;
  context?: string;
  code?: string;
  type: 'chat' | 'review' | 'generate' | 'optimize' | 'explain' | 'debug';
  options?: {
    reviewType?: 'security' | 'gas' | 'style' | 'comprehensive';
    contractType?: 'token' | 'nft' | 'defi' | 'dao' | 'general';
    features?: string[];
    optimizationType?: 'gas' | 'security' | 'readability' | 'performance';
    explanationType?: 'simple' | 'detailed' | 'security' | 'gas';
  };
}

export interface AIResponse {
  success: boolean;
  message: string;
  code?: string;
  suggestions?: string[];
  confidence?: number;
  metadata?: any;
}

export interface UserSession {
  sessionId: string;
  userId?: string;
  createdAt: Date;
  lastActivity: Date;
  metadata?: any;
}

export interface EventListener<T = any> {
  (event: T): void;
}

export interface ArbitPyEvents {
  'compilation:started': { sessionId: string };
  'compilation:completed': CompilationResult;
  'compilation:failed': { sessionId: string; error: string };
  'deployment:started': { sessionId: string };
  'deployment:completed': DeploymentResult;
  'deployment:failed': { sessionId: string; error: string };
  'transaction:confirmed': { hash: string; blockNumber: number };
  'error': Error;
}