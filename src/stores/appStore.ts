import { create } from 'zustand';

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

  // Wallet
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

  connectedWallet: null,
  setConnectedWallet: (address) => set({ connectedWallet: address }),

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
