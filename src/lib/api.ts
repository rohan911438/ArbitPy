// API functions for backend communication
// These simulate API calls - replace with actual backend endpoints

export interface CompileResponse {
  success: boolean;
  output: string;
  abi?: string;
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
  gasEstimate?: any;
}

export interface LintResponse {
  warnings: Array<{
    line: number;
    column: number;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export interface DeployResponse {
  success: boolean;
  txHash?: string;
  contractAddress?: string;
  error?: string;
  blockNumber?: number;
  gasUsed?: string;
  deploymentCost?: string;
  network?: string;
  explorerUrl?: string;
  contractExplorerUrl?: string;
  sessionId?: string;
  message?: string;
}

export interface ExecuteResponse {
  success: boolean;
  type?: 'read' | 'write';
  result?: any;
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  explorerUrl?: string;
  error?: string;
  functionName?: string;
  parameters?: any[];
  contractAddress?: string;
  network?: string;
}

export interface SimulateResponse {
  success: boolean;
  result?: any;
  error?: string;
  functionName?: string;
  parameters?: any[];
  contractAddress?: string;
  network?: string;
}

// Simulate compilation delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function compileToSolidity(pythonCode: string): Promise<CompileResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/compile/solidity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: pythonCode,
        optimization: true,
        version: '0.8.19'
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        output: '',
        errors: [result.message || result.error || 'Compilation failed']
      };
    }

    return {
      success: result.success,
      output: result.output || result.solidityCode || '',
      abi: result.abi,
      bytecode: result.bytecode?.object || result.bytecode,
      errors: result.errors || [],
      warnings: result.warnings || [],
      gasEstimate: result.gasEstimate
    };
  } catch (error) {
    console.error('Compilation API error:', error);
    return {
      success: false,
      output: '',
      errors: [error instanceof Error ? error.message : 'Unknown compilation error']
    };
  }
}

export async function compileToStylus(pythonCode: string): Promise<CompileResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/compile/rust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: pythonCode,
        optimization: true,
        target: 'stylus'
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        output: '',
        errors: [result.message || result.error || 'Stylus compilation failed']
      };
    }

    return {
      success: result.success,
      output: result.output || result.rustCode || '',
      abi: result.abi,
      bytecode: result.wasmBytecode || result.wasm || result.bytecode,
      errors: result.errors || [],
      warnings: result.warnings || [],
      gasEstimate: result.gasEstimate
    };
  } catch (error) {
    console.error('Stylus compilation API error:', error);
    return {
      success: false,
      output: '',
      errors: [error instanceof Error ? error.message : 'Unknown Stylus compilation error']
    };
  }
}

export async function lintCode(pythonCode: string): Promise<LintResponse> {
  await delay(800);
  
  // Simulated linting
  const warnings = [];
  
  if (!pythonCode.includes('@contract')) {
    warnings.push({
      line: 1,
      column: 1,
      message: 'Missing @contract decorator on class',
      severity: 'error' as const,
    });
  }
  
  if (pythonCode.includes('self.') && !pythonCode.includes('def __init__')) {
    warnings.push({
      line: 5,
      column: 1,
      message: 'State variables used without __init__ constructor',
      severity: 'warning' as const,
    });
  }

  return { warnings };
}

export async function deployContract(
  bytecode: string,
  abi: any[],
  privateKey: string,
  network: string = 'arbitrum_sepolia',
  constructorParams: any[] = []
): Promise<DeployResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/deploy/contract`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bytecode,
        abi,
        network,
        constructorParams,
        privateKey,
        // Add some default gas settings
        gasLimit: '3000000'
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Deployment failed');
    }

    return {
      success: result.success,
      txHash: result.txHash || result.transactionHash,
      contractAddress: result.contractAddress,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      deploymentCost: result.deploymentCost,
      network: result.network,
      explorerUrl: result.explorerUrl,
      contractExplorerUrl: result.contractExplorerUrl,
      sessionId: result.sessionId,
      message: result.message
    };
  } catch (error) {
    console.error('Deployment API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown deployment error'
    };
  }
}

export async function executeFunction(
  contractAddress: string,
  abi: any[],
  functionName: string,
  parameters: any[] = [],
  network: string = 'arbitrum_sepolia',
  privateKey?: string,
  options: {
    gasLimit?: string;
    gasPrice?: string;
    value?: string;
  } = {}
): Promise<ExecuteResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/execute/function`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress,
        abi,
        functionName,
        parameters,
        network,
        privateKey,
        ...options
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || 'Function execution failed'
      };
    }

    return {
      success: result.success,
      type: result.type,
      result: result.result,
      txHash: result.txHash,
      blockNumber: result.blockNumber,
      gasUsed: result.gasUsed,
      explorerUrl: result.explorerUrl,
      functionName: result.functionName,
      parameters: result.parameters,
      contractAddress: result.contractAddress,
      network: result.network
    };
  } catch (error) {
    console.error('Function execution API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown execution error'
    };
  }
}

export async function simulateFunction(
  contractAddress: string,
  abi: any[],
  functionName: string,
  parameters: any[] = [],
  network: string = 'arbitrum_sepolia'
): Promise<SimulateResponse> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/execute/simulate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contractAddress,
        abi,
        functionName,
        parameters,
        network
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: result.message || result.error || 'Function simulation failed'
      };
    }

    return {
      success: result.success,
      result: result.result,
      functionName: result.functionName,
      parameters: result.parameters,
      contractAddress: result.contractAddress,
      network: result.network
    };
  } catch (error) {
    console.error('Function simulation API error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown simulation error'
    };
  }
}

// New deployment monitoring functions

export async function getDeploymentStatus(sessionId: string): Promise<any> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/deploy/status/${sessionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get deployment status');
    }

    return await response.json();
  } catch (error) {
    console.error('Get deployment status error:', error);
    throw error;
  }
}

export async function getTransactionDetails(txHash: string, network: string = 'arbitrum_sepolia'): Promise<any> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/deploy/transaction/${txHash}?network=${network}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get transaction details');
    }

    return await response.json();
  } catch (error) {
    console.error('Get transaction details error:', error);
    throw error;
  }
}

export async function estimateDeploymentGas(
  bytecode: string,
  abi: any[],
  network: string = 'arbitrum_sepolia',
  constructorParams: any[] = []
): Promise<any> {
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    
    const response = await fetch(`${apiUrl}/api/v1/deploy/estimate-gas`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bytecode,
        abi,
        network,
        constructorParams
      }),
    });

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || result.error || 'Gas estimation failed');
    }

    return result;
  } catch (error) {
    console.error('Gas estimation API error:', error);
    throw error;
  }
}
