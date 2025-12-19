import { useAppStore } from '@/stores/appStore';
import { useMetaMask } from '@/hooks/useMetaMask';
import { 
  Play, 
  FileCode, 
  Rocket, 
  Wallet, 
  Loader2,
  Zap,
  Terminal
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { compileToSolidity, compileToStylus, lintCode, deployContract } from '@/lib/api';
import { useState } from 'react';

export function Header() {
  const {
    editorCode,
    setCompiledSolidity,
    setCompiledRust,
    setAbiOutput,
    setLinterWarnings,
    addCompileLog,
    addDeployLog,
    setActiveOutputTab,
    isCompiling,
    setIsCompiling,
    isDeploying,
    setIsDeploying,
    compiledSolidity,
    setSolidityCompilationResult,
    setRustCompilationResult,
    solidityCompilationResult,
    rustCompilationResult,
  } = useAppStore();

  const { connectedWallet, connect, isConnecting, disconnect } = useMetaMask();

  const handleCompileSolidity = async () => {
    setIsCompiling(true);
    addCompileLog({ type: 'info', message: 'Starting Solidity compilation...' });
    
    try {
      // Run linting first
      const lintResult = await lintCode(editorCode);
      setLinterWarnings(lintResult.warnings);
      
      if (lintResult.warnings.some(w => w.severity === 'error')) {
        addCompileLog({ type: 'error', message: 'Compilation failed due to lint errors' });
        setActiveOutputTab('linter');
        toast({
          title: 'Compilation Failed',
          description: 'Please fix the lint errors first',
          variant: 'destructive',
        });
        return;
      }

      const result = await compileToSolidity(editorCode);
      
      if (result.success) {
        setCompiledSolidity(result.output);
        if (result.abi) setAbiOutput(JSON.stringify(result.abi, null, 2));
        
        // Store the complete compilation result for deployment
        setSolidityCompilationResult({
          ...result,
          timestamp: new Date()
        });
        
        addCompileLog({ type: 'success', message: 'Solidity compilation successful!' });
        setActiveOutputTab('solidity');
        toast({
          title: 'Compilation Successful',
          description: 'Python code compiled to Solidity',
        });
      } else {
        // Clear previous compilation result on failure
        setSolidityCompilationResult(null);
        addCompileLog({ type: 'error', message: result.errors?.join('\n') || 'Compilation failed' });
        toast({
          title: 'Compilation Failed',
          description: 'Check the compile log for details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      addCompileLog({ type: 'error', message: `Compilation error: ${error}` });
      toast({
        title: 'Compilation Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCompileStylus = async () => {
    setIsCompiling(true);
    addCompileLog({ type: 'info', message: 'Starting Stylus/Rust compilation...' });
    
    try {
      const result = await compileToStylus(editorCode);
      
      if (result.success) {
        setCompiledRust(result.output);
        
        // Store the complete compilation result for deployment
        setRustCompilationResult({
          ...result,
          timestamp: new Date()
        });
        
        addCompileLog({ type: 'success', message: 'Stylus compilation successful!' });
        setActiveOutputTab('rust');
        toast({
          title: 'Compilation Successful',
          description: 'Python code compiled to Stylus/Rust',
        });
      } else {
        // Clear previous compilation result on failure
        setRustCompilationResult(null);
        addCompileLog({ type: 'error', message: result.errors?.join('\n') || 'Stylus compilation failed' });
        toast({
          title: 'Compilation Failed',
          description: 'Check the compile log for details',
          variant: 'destructive',
        });
      }
    } catch (error) {
      addCompileLog({ type: 'error', message: `Compilation error: ${error}` });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleDeploy = async () => {
    if (!connectedWallet) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet first',
        variant: 'destructive',
      });
      return;
    }

    if (!compiledSolidity) {
      toast({
        title: 'No Compiled Code',
        description: 'Please compile your contract first',
        variant: 'destructive',
      });
      return;
    }

    setIsDeploying(true);
    addDeployLog({ status: 'pending', message: 'Deploying contract to Arbitrum Sepolia...' });
    
    try {
      const result = await deployContract(compiledSolidity, connectedWallet);
      
      if (result.success) {
        addDeployLog({
          status: 'success',
          message: 'Contract deployed successfully!',
          txHash: result.txHash,
          contractAddress: result.contractAddress,
        });
        toast({
          title: 'Deployment Successful',
          description: `Contract deployed at ${result.contractAddress?.slice(0, 10)}...`,
        });
      } else {
        addDeployLog({
          status: 'failed',
          message: result.error || 'Deployment failed',
        });
        toast({
          title: 'Deployment Failed',
          description: result.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      addDeployLog({ status: 'failed', message: `Deployment error: ${error}` });
    } finally {
      setIsDeploying(false);
    }
  };

  const [showRunPanel, setShowRunPanel] = useState(false);

  const handleRunFunction = () => {
    // Check if we have compilation results
    const compilationResult = solidityCompilationResult || rustCompilationResult;
    
    if (!compilationResult || !compilationResult.success) {
      toast({
        title: 'No Contract Available',
        description: 'Please compile a contract first before running functions',
        variant: 'destructive',
      });
      return;
    }

    if (!compilationResult.abi || compilationResult.abi.length === 0) {
      toast({
        title: 'No ABI Available',
        description: 'Contract ABI is required to execute functions',
        variant: 'destructive',
      });
      return;
    }

    // Switch to the execution tab in output panel
    setActiveOutputTab('execute');
    
    toast({
      title: 'Function Execution Ready',
      description: 'Use the Execute tab to run contract functions',
    });
  };

  return (
    <header className="relative flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
      {/* Background glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-blue-500/5" />
      
      <div className="relative flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-400/20">
          <Zap className="w-6 h-6 text-blue-400 drop-shadow-sm" />
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-blue-300 bg-clip-text text-transparent">
            ArbitPy Playground
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Python → Smart Contract Compiler
          </span>
        </div>
      </div>

      <div className="relative flex items-center gap-3">
        {/* Compile Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCompileSolidity}
            disabled={isCompiling}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-emerald-500/25 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isCompiling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCode className="w-4 h-4 group-hover:rotate-3 transition-transform" />
            )}
            <span className="hidden sm:inline font-semibold">Solidity</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-300 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>

          <button
            onClick={handleCompileStylus}
            disabled={isCompiling}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl border border-slate-600 hover:border-slate-500 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isCompiling ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Terminal className="w-4 h-4 group-hover:rotate-3 transition-transform" />
            )}
            <span className="hidden sm:inline font-semibold">Stylus</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-slate-400 to-slate-300 opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-600 to-transparent mx-2" />

        {/* Deploy & Run Section */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDeploy}
            disabled={isDeploying || !connectedWallet}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-orange-500/25 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isDeploying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Rocket className="w-4 h-4 group-hover:translate-y-[-2px] transition-transform" />
            )}
            <span className="hidden sm:inline font-semibold">Deploy</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-400 to-orange-300 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>

          <button
            onClick={handleRunFunction}
            className="group relative flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white rounded-xl transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline font-semibold">Execute</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-purple-400 to-purple-300 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        </div>

        <div className="w-px h-8 bg-gradient-to-b from-transparent via-slate-600 to-transparent mx-2" />

        {/* Wallet Section */}
        {connectedWallet ? (
          <button
            onClick={disconnect}
            className="group relative flex items-center gap-3 px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-600 hover:border-slate-500 backdrop-blur-sm transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50 animate-pulse" />
              <span className="font-mono text-sm font-semibold">
                {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
              </span>
            </div>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-slate-400 to-slate-300 opacity-0 group-hover:opacity-10 transition-opacity" />
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="group relative flex items-center gap-2.5 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-blue-500/25 hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            )}
            <span className="font-semibold">Connect Wallet</span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400 to-blue-300 opacity-0 group-hover:opacity-20 transition-opacity" />
          </button>
        )}
      </div>
    </header>
  );
}
