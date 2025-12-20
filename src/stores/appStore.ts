import { create } from 'zustand';
import { ethers } from 'ethers';

export interface LinterWarning {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export interface CompileLog {
  timestamp: Date;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export interface DeployLog {
  timestamp: Date;
  txHash?: string;
  status: 'pending' | 'success' | 'failed';
  message: string;
  contractAddress?: string;
}

export interface CompilationResult {
  success: boolean;
  output: string;
  abi?: any[];
  bytecode?: string;
  errors?: string[];
  warnings?: string[];
  gasEstimate?: any;
  timestamp?: Date;
}

// Arbitrum network configurations
export const ARBITRUM_NETWORKS = {
  sepolia: {
    chainId: '0x66eee',
    chainName: 'Arbitrum Sepolia',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
  },
  mainnet: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io/'],
  },
};

// Wallet state interfaces
export interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  connectedWallet: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: string | null;
  network: string | null;
  balance: string | null;
  error: string | null;
}

export interface NetworkInfo {
  chainId: string;
  name: string;
  isSupported: boolean;
}

interface AppState {
  // Editor state
  editorCode: string;
  setEditorCode: (code: string) => void;

  // Compiled outputs
  compiledSolidity: string;
  setCompiledSolidity: (code: string) => void;
  compiledRust: string;
  setCompiledRust: (code: string) => void;
  abiOutput: string;
  setAbiOutput: (abi: string) => void;
  
  // Compilation artifacts for deployment
  solidityCompilationResult: CompilationResult | null;
  setSolidityCompilationResult: (result: CompilationResult | null) => void;
  rustCompilationResult: CompilationResult | null;
  setRustCompilationResult: (result: CompilationResult | null) => void;

  // Linter
  linterWarnings: LinterWarning[];
  setLinterWarnings: (warnings: LinterWarning[]) => void;

  // Logs
  compileLogs: CompileLog[];
  addCompileLog: (log: Omit<CompileLog, 'timestamp'>) => void;
  clearCompileLogs: () => void;

  deployLogs: DeployLog[];
  addDeployLog: (log: Omit<DeployLog, 'timestamp'>) => void;
  clearDeployLogs: () => void;

  // Wallet State
  wallet: WalletState;
  
  // Wallet Actions
  setWalletConnecting: (connecting: boolean) => void;
  setWalletConnected: (address: string, provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner) => void;
  setWalletDisconnected: () => void;
  updateWalletNetwork: (chainId: string, network: string) => void;
  updateWalletBalance: (balance: string) => void;
  setWalletError: (error: string | null) => void;
  getNetworkInfo: () => NetworkInfo;
  
  // Legacy support (keeping for backward compatibility)
  connectedWallet: string | null;
  setConnectedWallet: (address: string | null) => void;

  // UI state
  activeOutputTab: string;
  setActiveOutputTab: (tab: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  transactionLogOpen: boolean;
  setTransactionLogOpen: (open: boolean) => void;

  // Loading states
  isCompiling: boolean;
  setIsCompiling: (loading: boolean) => void;
  isDeploying: boolean;
  setIsDeploying: (loading: boolean) => void;
  isLinting: boolean;
  setIsLinting: (loading: boolean) => void;

  // Active page
  activePage: 'playground' | 'examples' | 'settings' | 'about' | 'arbitpy-ai';
  setActivePage: (page: 'playground' | 'examples' | 'settings' | 'about' | 'arbitpy-ai') => void;
}

const DEFAULT_CODE = `# ArbitPy Smart Contract Example
# A simple ERC20 token written in Python

@contract
class MyToken:
    def __init__(self):
        self.name = "ArbitPy Token"
        self.symbol = "APY"
        self.decimals = 18
        self.total_supply = 0
        self.balances = {}
        self.allowances = {}
    
    @public
    def mint(self, to: address, amount: uint256):
        """Mint new tokens to an address"""
        self.balances[to] = self.balances.get(to, 0) + amount
        self.total_supply += amount
        emit Transfer(address(0), to, amount)
    
    @public
    @view
    def balance_of(self, account: address) -> uint256:
        """Get the balance of an account"""
        return self.balances.get(account, 0)
    
    @public
    def transfer(self, to: address, amount: uint256) -> bool:
        """Transfer tokens to another address"""
        sender = msg.sender
        require(self.balances.get(sender, 0) >= amount, "Insufficient balance")
        
        self.balances[sender] -= amount
        self.balances[to] = self.balances.get(to, 0) + amount
        
        emit Transfer(sender, to, amount)
        return True
    
    @public
    def approve(self, spender: address, amount: uint256) -> bool:
        """Approve spender to spend tokens"""
        owner = msg.sender
        self.allowances[(owner, spender)] = amount
        emit Approval(owner, spender, amount)
        return True
`;

export const useAppStore = create<AppState>((set) => ({
  editorCode: DEFAULT_CODE,
  setEditorCode: (code) => set({ editorCode: code }),

  compiledSolidity: '',
  setCompiledSolidity: (code) => set({ compiledSolidity: code }),
  compiledRust: '',
  setCompiledRust: (code) => set({ compiledRust: code }),
  abiOutput: '',
  setAbiOutput: (abi) => set({ abiOutput: abi }),
  
  // Compilation artifacts
  solidityCompilationResult: null,
  setSolidityCompilationResult: (result) => set({ solidityCompilationResult: result }),
  rustCompilationResult: null,
  setRustCompilationResult: (result) => set({ rustCompilationResult: result }),

  linterWarnings: [],
  setLinterWarnings: (warnings) => set({ linterWarnings: warnings }),

  compileLogs: [],
  addCompileLog: (log) =>
    set((state) => ({
      compileLogs: [...state.compileLogs, { ...log, timestamp: new Date() }],
    })),
  clearCompileLogs: () => set({ compileLogs: [] }),

  deployLogs: [],
  addDeployLog: (log) =>
    set((state) => ({
      deployLogs: [...state.deployLogs, { ...log, timestamp: new Date() }],
    })),
  clearDeployLogs: () => set({ deployLogs: [] }),

  // Initial wallet state
  wallet: {
    isConnected: false,
    isConnecting: false,
    connectedWallet: null,
    provider: null,
    signer: null,
    chainId: null,
    network: null,
    balance: null,
    error: null,
  },
  
  // Wallet actions
  setWalletConnecting: (connecting) => 
    set((state) => ({ 
      wallet: { ...state.wallet, isConnecting: connecting, error: null } 
    })),
  
  setWalletConnected: (address, provider, signer) =>
    set((state) => ({
      wallet: {
        ...state.wallet,
        isConnected: true,
        isConnecting: false,
        connectedWallet: address,
        provider,
        signer,
        error: null,
      },
      connectedWallet: address, // Legacy support
    })),
  
  setWalletDisconnected: () =>
    set((state) => ({
      wallet: {
        ...state.wallet,
        isConnected: false,
        isConnecting: false,
        connectedWallet: null,
        provider: null,
        signer: null,
        chainId: null,
        network: null,
        balance: null,
        error: null,
      },
      connectedWallet: null, // Legacy support
    })),
  
  updateWalletNetwork: (chainId, network) =>
    set((state) => ({
      wallet: { ...state.wallet, chainId, network }
    })),
  
  updateWalletBalance: (balance) =>
    set((state) => ({
      wallet: { ...state.wallet, balance }
    })),
  
  setWalletError: (error) =>
    set((state) => ({
      wallet: { ...state.wallet, error, isConnecting: false }
    })),
  
  getNetworkInfo: () => {
    const state = useAppStore.getState();
    const chainId = state.wallet.chainId;
    
    if (chainId === ARBITRUM_NETWORKS.sepolia.chainId) {
      return { chainId, name: 'Arbitrum Sepolia', isSupported: true };
    } else if (chainId === ARBITRUM_NETWORKS.mainnet.chainId) {
      return { chainId, name: 'Arbitrum Mainnet', isSupported: true };
    } else {
      return { chainId: chainId || 'Unknown', name: 'Unknown Network', isSupported: false };
    }
  },
  
  // Legacy support
  connectedWallet: null,
  setConnectedWallet: (address) => 
    set((state) => ({ 
      connectedWallet: address,
      wallet: { ...state.wallet, connectedWallet: address }
    })),

  activeOutputTab: 'solidity',
  setActiveOutputTab: (tab) => set({ activeOutputTab: tab }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  transactionLogOpen: false,
  setTransactionLogOpen: (open) => set({ transactionLogOpen: open }),

  isCompiling: false,
  setIsCompiling: (loading) => set({ isCompiling: loading }),
  isDeploying: false,
  setIsDeploying: (loading) => set({ isDeploying: loading }),
  isLinting: false,
  setIsLinting: (loading) => set({ isLinting: loading }),

  activePage: 'playground',
  setActivePage: (page) => set({ activePage: page }),
}));
