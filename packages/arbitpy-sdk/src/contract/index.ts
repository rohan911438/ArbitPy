// ArbitPy Contract Interaction Layer
import { EventEmitter } from 'eventemitter3';
import { ethers } from 'ethers';
import { HttpClient } from '../utils/http-client';
import { getNetwork } from '../config';
import {
  ArbitPyConfig,
  ArbitPyEvents,
  ContractInteractionOptions,
} from '../types';

export interface ContractMethod {
  name: string;
  type: 'function' | 'constructor' | 'event' | 'fallback' | 'receive';
  stateMutability?: 'pure' | 'view' | 'nonpayable' | 'payable';
  inputs: Array<{
    name: string;
    type: string;
    indexed?: boolean;
  }>;
  outputs?: Array<{
    name: string;
    type: string;
  }>;
}

export interface ContractEvent {
  name: string;
  signature: string;
  topics: readonly string[];
  data: string;
  args: Record<string, any>;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
}

export interface ContractTransaction {
  hash: string;
  blockNumber?: number;
  blockHash?: string;
  gasUsed?: string;
  status?: number;
  confirmations: number;
}

export class ArbitPyContract extends EventEmitter<ArbitPyEvents> {
  private httpClient: HttpClient;
  private providers: Map<string, ethers.JsonRpcProvider>;
  private contracts: Map<string, ethers.Contract>;
  
  public readonly address: string;
  public readonly abi: any[];
  public readonly network: string;
  private provider?: ethers.JsonRpcProvider;
  private signer?: ethers.Signer;

  constructor(
    address: string,
    abi: any[],
    network: string,
    config: ArbitPyConfig = {}
  ) {
    super();
    this.address = address;
    this.abi = abi;
    this.network = network;
    this.httpClient = new HttpClient(config);
    this.providers = new Map();
    this.contracts = new Map();
  }

  /**
   * Connect to the contract with a provider
   */
  async connect(providerOrSigner?: ethers.Provider | ethers.Signer): Promise<void> {
    if (providerOrSigner) {
      if ('getBlockNumber' in providerOrSigner) {
        this.provider = providerOrSigner as ethers.JsonRpcProvider;
      } else {
        this.signer = providerOrSigner as ethers.Signer;
        this.provider = this.signer.provider as ethers.JsonRpcProvider;
      }
    } else {
      this.provider = await this.getProvider(this.network);
    }
  }

  /**
   * Get contract instance with ethers.js
   */
  async getContract(): Promise<ethers.Contract> {
    const contractKey = `${this.address}_${this.network}`;
    
    if (this.contracts.has(contractKey)) {
      return this.contracts.get(contractKey)!;
    }

    if (!this.provider) {
      await this.connect();
    }

    const contract = new ethers.Contract(
      this.address,
      this.abi,
      this.signer || this.provider!
    );

    this.contracts.set(contractKey, contract);
    return contract;
  }

  /**
   * Call a read-only function
   */
  async call<T = any>(
    methodName: string,
    params: any[] = [],
    options: ContractInteractionOptions = {}
  ): Promise<T> {
    try {
      const contract = await this.getContract();
      const method = contract[methodName];
      
      if (!method) {
        throw new Error(`Method ${methodName} not found in contract ABI`);
      }

      const result = await method(...params, {
        gasLimit: options.gasLimit,
        gasPrice: options.gasPrice,
        from: options.from,
      });

      return result;
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Send a transaction to a contract function
   */
  async send(
    methodName: string,
    params: any[] = [],
    options: ContractInteractionOptions = {}
  ): Promise<ContractTransaction> {
    try {
      if (!this.signer) {
        throw new Error('Signer required for sending transactions');
      }

      const contract = await this.getContract();
      const method = contract[methodName];
      
      if (!method) {
        throw new Error(`Method ${methodName} not found in contract ABI`);
      }

      const tx = await method(...params, {
        gasLimit: options.gasLimit,
        gasPrice: options.gasPrice,
        value: options.value,
      });

      return {
        hash: tx.hash,
        confirmations: 0,
      };
    } catch (error) {
      this.emit('error', error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    methodName: string,
    params: any[] = [],
    options: ContractInteractionOptions = {}
  ): Promise<string> {
    const contract = await this.getContract();
    const method = contract[methodName];
    
    if (!method) {
      throw new Error(`Method ${methodName} not found in contract ABI`);
    }

    const gasEstimate = await method.estimateGas(...params, {
      from: options.from,
      value: options.value,
    });

    return gasEstimate.toString();
  }

  /**
   * Listen to contract events
   */
  async addEventListener(
    eventName: string,
    callback: (event: ContractEvent) => void,
    fromBlock: number | 'latest' = 'latest'
  ): Promise<void> {
    const contract = await this.getContract();
    
    const filter = contract.filters[eventName]();
    
    contract.on(filter, (...args) => {
      const event = args[args.length - 1]; // Last argument is the event object
      
      const contractEvent: ContractEvent = {
        name: eventName,
        signature: event.fragment.format(),
        topics: event.topics,
        data: event.data,
        args: event.args,
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: event.logIndex,
      };
      
      callback(contractEvent);
    });
  }

  /**
   * Remove event listener
   */
  async removeEventListener(eventName: string): Promise<void> {
    const contract = await this.getContract();
    contract.removeAllListeners(eventName);
  }

  /**
   * Get past events
   */
  async getPastEvents(
    eventName: string,
    fromBlock: number = 0,
    toBlock: number | 'latest' = 'latest',
    filters: Record<string, any> = {}
  ): Promise<ContractEvent[]> {
    const contract = await this.getContract();
    
    const filter = contract.filters[eventName](...Object.values(filters));
    const events = await contract.queryFilter(filter, fromBlock, toBlock);
    
    return events.map(event => {
      const eventLog = event as ethers.EventLog;
      return {
        name: eventName,
        signature: eventLog.fragment?.format() || '',
        topics: event.topics,
        data: event.data,
        args: eventLog.args || {},
        blockNumber: event.blockNumber,
        transactionHash: event.transactionHash,
        logIndex: (event as any).logIndex || 0,
      };
    });
  }

  /**
   * Get all contract methods from ABI
   */
  getMethods(): ContractMethod[] {
    return this.abi
      .filter(item => item.type === 'function')
      .map(item => ({
        name: item.name,
        type: item.type,
        stateMutability: item.stateMutability,
        inputs: item.inputs || [],
        outputs: item.outputs || [],
      }));
  }

  /**
   * Get all contract events from ABI
   */
  getEvents(): ContractMethod[] {
    return this.abi
      .filter(item => item.type === 'event')
      .map(item => ({
        name: item.name,
        type: item.type,
        inputs: item.inputs || [],
      }));
  }

  /**
   * Get contract balance
   */
  async getBalance(): Promise<string> {
    if (!this.provider) {
      await this.connect();
    }
    
    const balance = await this.provider!.getBalance(this.address);
    return balance.toString();
  }

  /**
   * Check if contract is verified
   */
  async isVerified(): Promise<boolean> {
    try {
      const response = await this.httpClient.get(
        `/contracts/${this.address}/verification`,
        { params: { network: this.network } }
      );
      return response.data.verified;
    } catch {
      return false;
    }
  }

  /**
   * Get contract source code (if verified)
   */
  async getSourceCode(): Promise<{
    sourceCode: string;
    compiler: string;
    version: string;
    verified: boolean;
  }> {
    const response = await this.httpClient.get(
      `/contracts/${this.address}/source`,
      { params: { network: this.network } }
    );
    return response.data;
  }

  /**
   * Get contract transaction history
   */
  async getTransactionHistory(
    limit: number = 20,
    offset: number = 0
  ): Promise<{
    transactions: Array<{
      hash: string;
      blockNumber: number;
      timestamp: string;
      from: string;
      to: string;
      value: string;
      gasUsed: string;
      gasPrice: string;
      methodName?: string;
      status: 'success' | 'failed';
    }>;
    total: number;
  }> {
    const response = await this.httpClient.get(
      `/contracts/${this.address}/transactions`,
      { 
        params: { 
          network: this.network,
          limit,
          offset 
        } 
      }
    );
    return response.data;
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
}

/**
 * Factory function to create contract instances
 */
export function createContract(
  address: string,
  abi: any[],
  network: string,
  config?: ArbitPyConfig
): ArbitPyContract {
  return new ArbitPyContract(address, abi, network, config);
}