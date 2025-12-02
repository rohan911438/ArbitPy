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
        if (result.abi) setAbiOutput(result.abi);
        addCompileLog({ type: 'success', message: 'Solidity compilation successful!' });
        setActiveOutputTab('solidity');
        toast({
          title: 'Compilation Successful',
          description: 'Python code compiled to Solidity',
        });
      } else {
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
        addCompileLog({ type: 'success', message: 'Stylus compilation successful!' });
        setActiveOutputTab('rust');
        toast({
          title: 'Compilation Successful',
          description: 'Python code compiled to Stylus/Rust',
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

  const handleRunFunction = () => {
    toast({
      title: 'Run Function',
      description: 'Function execution feature coming soon',
    });
  };

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <Zap className="w-5 h-5 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          Python Smart Contract Editor
        </span>
      </div>

      <div className="flex items-center gap-2">
        {/* Compile Buttons */}
        <button
          onClick={handleCompileSolidity}
          disabled={isCompiling}
          className="action-button-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompiling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <FileCode className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Compile to Solidity</span>
        </button>

        <button
          onClick={handleCompileStylus}
          disabled={isCompiling}
          className="action-button-secondary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCompiling ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Terminal className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Compile to Stylus</span>
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Deploy & Run */}
        <button
          onClick={handleDeploy}
          disabled={isDeploying || !connectedWallet}
          className="action-button-accent disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isDeploying ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">Deploy</span>
        </button>

        <button
          onClick={handleRunFunction}
          className="action-button-secondary"
        >
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Run Function</span>
        </button>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Wallet */}
        {connectedWallet ? (
          <button
            onClick={disconnect}
            className="action-button-secondary"
          >
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="font-mono text-xs">
              {connectedWallet.slice(0, 6)}...{connectedWallet.slice(-4)}
            </span>
          </button>
        ) : (
          <button
            onClick={connect}
            disabled={isConnecting}
            className="action-button-primary"
          >
            {isConnecting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wallet className="w-4 h-4" />
            )}
            <span>Connect Wallet</span>
          </button>
        )}
      </div>
    </header>
  );
}
