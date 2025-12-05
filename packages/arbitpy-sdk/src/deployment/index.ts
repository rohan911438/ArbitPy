// ArbitPy Deployment Manager
import { EventEmitter } from 'eventemitter3';
import { ethers } from 'ethers';
import { HttpClient } from '../utils/http-client';
import { getNetwork, NETWORKS } from '../config';
import {
  DeploymentRequest,
  DeploymentResult,
  ArbitPyConfig,
  ArbitPyEvents,
  ContractInteractionOptions,
  Network,
} from '../types';

export class ArbitPyDeployment extends EventEmitter<ArbitPyEvents> {
  private httpClient: HttpClient;
  private providers: Map<string, ethers.JsonRpcProvider>;

  constructor(config: ArbitPyConfig = {}) {
    super();
    this.httpClient = new HttpClient(config);
    this.providers = new Map();
  }

  /**
   * Deploy a compiled contract to the specified network
   */
  async deploy(
    deployment: DeploymentRequest,
    privateKey?: string
  ): Promise<DeploymentResult> {
    try {
      // Emit deployment started event
      const sessionId = this.generateSessionId();
      this.emit('deployment:started', { sessionId });

      // Validate network
      const network = getNetwork(deployment.network);
      if (!network) {
        throw new Error(`Unsupported network: ${deployment.network}`);
      }

      // Deploy via API
      const response = await this.httpClient.post<DeploymentResult>(
        '/deploy/contract',
        {
          ...deployment,
          ...(privateKey && { privateKey }),
        }
      );

      const result = response.data;

      // Emit deployment completed event
      if (result.success) {
        this.emit('deployment:completed', result);
        
        // Wait for confirmation and emit transaction confirmed event
        if (result.transactionHash) {
          this.waitForConfirmation(
            result.transactionHash,
            deployment.network
          ).then((receipt) => {
            this.emit('transaction:confirmed', {
              hash: receipt.hash,
              blockNumber: receipt.blockNumber,
            });
          });
        }
      } else {
        this.emit('deployment:failed', {
          sessionId,
          error: 'Deployment failed',
        });
      }

      return result;
    } catch (error) {
      const sessionId = this.generateSessionId();
      this.emit('deployment:failed', {
        sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Estimate gas cost for deployment
   */
  async estimateDeploymentGas(
    bytecode: string,
    abi: any[],
    network: string,
    constructorParams: any[] = []
  ): Promise<{
    gasLimit: string;
    gasPrice: string;
    estimatedCost: string;
    estimatedCostUSD?: string;
  }> {
    const response = await this.httpClient.post('/deploy/estimate-gas', {
      bytecode,
      abi,
      network,
      constructorParams,
    });
    return response.data;
  }

  /**
   * Verify contract on block explorer
   */
  async verifyContract(
    contractAddress: string,
    sourceCode: string,
    network: string,
    options: {
      contractName?: string;
      constructorArgs?: any[];
      compilerVersion?: string;
      optimizationUsed?: boolean;
      runs?: number;
    } = {}
  ): Promise<{
    success: boolean;
    verificationId?: string;
    explorerUrl?: string;
    message: string;
  }> {
    const response = await this.httpClient.post('/deploy/verify', {
      contractAddress,
      sourceCode,
      network,
      ...options,
    });
    return response.data;
  }

  /**
   * Get deployment status by session ID
   */
  async getDeploymentStatus(sessionId: string): Promise<DeploymentResult> {
    const response = await this.httpClient.get<DeploymentResult>(
      `/deploy/status/${sessionId}`
    );
    return response.data;
  }

  /**
   * Get contract deployment history for a user
   */
  async getDeploymentHistory(
    userAddress?: string,
    network?: string,
    limit: number = 20
  ): Promise<{
    deployments: Array<{
      contractAddress: string;
      transactionHash: string;
      network: string;
      timestamp: string;
      gasUsed: string;
      status: string;
      contractName?: string;
    }>;
    total: number;
  }> {
    const response = await this.httpClient.get('/deploy/history', {
      params: { userAddress, network, limit },
    });
    return response.data;
  }

  /**
   * Get contract information from address
   */
  async getContractInfo(
    contractAddress: string,
    network: string
  ): Promise<{
    address: string;
    bytecode: string;
    abi?: any[];
    verified: boolean;
    name?: string;
    compiler?: string;
    balance: string;
    transactionCount: number;
    creationTransaction?: {
      hash: string;
      blockNumber: number;
      timestamp: string;
      from: string;
    };
  }> {
    // First try to get from our API
    try {
      const response = await this.httpClient.get(
        `/contracts/info/${contractAddress}`,
        { params: { network } }
      );
      return response.data;
    } catch {
      // Fallback to direct blockchain query
      return this.getContractInfoFromChain(contractAddress, network);
    }
  }

  /**
   * Get network information and status
   */
  async getNetworkInfo(networkName: string): Promise<{
    network: Network;
    status: 'active' | 'inactive' | 'maintenance';
    blockNumber: number;
    gasPrice: string;
    chainId: number;
    nativeBalance?: string; // If wallet is connected
  }> {
    const response = await this.httpClient.get(`/networks/${networkName}/info`);
    return response.data;
  }

  /**
   * Get supported networks
   */
  getSupportedNetworks(): string[] {
    return Object.keys(NETWORKS);
  }

  /**
   * Get network configuration
   */
  getNetworkConfig(networkName: string): Network | undefined {
    return getNetwork(networkName);
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForConfirmation(
    transactionHash: string,
    network: string,
    confirmations: number = 1
  ): Promise<ethers.TransactionReceipt> {
    const provider = await this.getProvider(network);
    
    // Wait for the transaction to be mined
    const receipt = await provider.waitForTransaction(
      transactionHash,
      confirmations
    );
    
    if (!receipt) {
      throw new Error('Transaction was not confirmed');
    }
    
    return receipt;
  }

  /**
   * Get current gas price for network
   */
  async getGasPrice(network: string): Promise<{
    standard: string;
    fast: string;
    instant: string;
    unit: string;
  }> {
    try {
      const response = await this.httpClient.get(`/networks/${network}/gas`);
      return response.data;
    } catch {
      // Fallback to provider gas price
      const provider = await this.getProvider(network);
      const gasPrice = await provider.getFeeData();
      
      return {
        standard: gasPrice.gasPrice?.toString() || '0',
        fast: gasPrice.maxFeePerGas?.toString() || gasPrice.gasPrice?.toString() || '0',
        instant: gasPrice.maxPriorityFeePerGas?.toString() || gasPrice.gasPrice?.toString() || '0',
        unit: 'wei',
      };
    }
  }

  private async getProvider(network: string): Promise<ethers.JsonRpcProvider> {
    if (this.providers.has(network)) {
      return this.providers.get(network)!;
    }

    const networkConfig = getNetwork(network);
    if (!networkConfig) {
      throw new Error(`Unsupported network: ${network}`);
    }

    const provider = new ethers.JsonRpcProvider(networkConfig.rpcUrl);
    this.providers.set(network, provider);
    return provider;
  }

  private async getContractInfoFromChain(
    contractAddress: string,
    network: string
  ) {
    const provider = await this.getProvider(network);
    
    const [bytecode, balance, transactionCount] = await Promise.all([
      provider.getCode(contractAddress),
      provider.getBalance(contractAddress),
      provider.getTransactionCount(contractAddress),
    ]);

    return {
      address: contractAddress,
      bytecode,
      verified: false,
      balance: balance.toString(),
      transactionCount,
    };
  }

  private generateSessionId(): string {
    return `deploy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}