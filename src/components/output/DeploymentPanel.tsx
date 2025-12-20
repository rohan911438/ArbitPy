import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Copy, RefreshCw, Wallet } from 'lucide-react';
import { deployContract, deployContractWithSigner, getDeploymentStatus, getTransactionDetails, estimateDeploymentGas } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';
import { useAppStore } from '../../stores/appStore';
import { useMetaMask } from '../../hooks/useMetaMask';

interface DeploymentPanelProps {
  network?: string;
}

interface DeploymentState {
  status: 'idle' | 'deploying' | 'monitoring' | 'completed' | 'failed';
  progress: number;
  stage: string;
  message: string;
  txHash?: string;
  contractAddress?: string;
  explorerUrl?: string;
  contractExplorerUrl?: string;
  sessionId?: string;
  gasUsed?: string;
  deploymentCost?: string;
  blockNumber?: number;
  error?: string;
  confirmations?: number;
}

const DeploymentPanel: React.FC<DeploymentPanelProps> = ({ 
  network = 'arbitrum_sepolia' 
}) => {
  const { activeOutputTab, solidityCompilationResult, rustCompilationResult, wallet } = useAppStore();
  const [deployment, setDeployment] = useState<DeploymentState>({
    status: 'idle',
    progress: 0,
    stage: '',
    message: ''
  });
  
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const [usePrivateKey, setUsePrivateKey] = useState(false);
  const [privateKey, setPrivateKey] = useState('');
  const { toast } = useToast();
  const { connectWallet, isMetaMaskInstalled } = useMetaMask();
  
  // Check if wallet is connected and on correct network
  const isWalletReady = wallet.isConnected && wallet.provider && wallet.signer;
  const isCorrectNetwork = wallet.network === network || wallet.chainId === '0x66eee'; // Arbitrum Sepolia

  // Get current compilation result based on active tab
  const getCurrentCompilationResult = () => {
    // For Python code deployment, prioritize Solidity compilation result
    if (solidityCompilationResult && solidityCompilationResult.success) {
      return solidityCompilationResult;
    }
    
    if (activeOutputTab === 'solidity' || activeOutputTab === 'vyper') {
      return solidityCompilationResult;
    } else if (activeOutputTab === 'rust') {
      return rustCompilationResult;
    }
    return null;
  };

  const compilationResult = getCurrentCompilationResult();

  const stages = [
    { key: 'validation', label: 'Validation', progress: 10 },
    { key: 'wallet', label: 'Wallet Connection', progress: 20 },
    { key: 'balance', label: 'Balance Check', progress: 30 },
    { key: 'gas_estimation', label: 'Gas Estimation', progress: 40 },
    { key: 'deployment', label: 'Contract Deployment', progress: 50 },
    { key: 'transaction_sent', label: 'Transaction Sent', progress: 60 },
    { key: 'confirmation', label: 'Confirmation', progress: 80 },
    { key: 'completed', label: 'Completed', progress: 100 }
  ];

  const getProgressForStage = (stage: string): number => {
    const stageInfo = stages.find(s => s.key === stage);
    return stageInfo ? stageInfo.progress : 0;
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  // Sanitize and validate private key
  const sanitizePrivateKey = (key: string): string => {
    if (!key) return '';
    
    // Remove whitespace
    key = key.trim();
    
    // If it doesn't start with 0x, add it
    if (!key.startsWith('0x')) {
      key = '0x' + key;
    }
    
    // Remove any duplicate 0x prefixes and merge duplicated keys
    if (key.includes('0x', 2)) {
      // Split by 0x and take the first valid part
      const parts = key.split('0x').filter(part => part.length > 0);
      if (parts.length > 0) {
        key = '0x' + parts[0];
      }
    }
    
    // Ensure only valid hex characters
    const hexPart = key.slice(2);
    const validHex = hexPart.replace(/[^a-fA-F0-9]/g, '');
    
    // Limit to 64 characters
    const truncatedHex = validHex.slice(0, 64);
    
    return '0x' + truncatedHex;
  };

  const validatePrivateKey = (key: string): { isValid: boolean; message?: string } => {
    if (!key) {
      return { isValid: false, message: 'Private key is required' };
    }
    
    if (!key.startsWith('0x')) {
      return { isValid: false, message: 'Private key must start with 0x' };
    }
    
    if (key.length !== 66) {
      return { isValid: false, message: `Private key must be exactly 66 characters (currently ${key.length})` };
    }
    
    const hexPart = key.slice(2);
    if (!/^[a-fA-F0-9]{64}$/.test(hexPart)) {
      return { isValid: false, message: 'Private key must contain only valid hex characters' };
    }
    
    return { isValid: true };
  };

  const handlePrivateKeyChange = (value: string) => {
    const sanitized = sanitizePrivateKey(value);
    setPrivateKey(sanitized);
  };

  // Frontend validation functions (MUST pass before enabling Deploy button)
  const validateBytecode = (bytecode: any): { isValid: boolean; message?: string } => {
    // ✅ Bytecode exists
    if (!bytecode) {
      return { isValid: false, message: 'Bytecode is missing' };
    }

    // Handle object bytecode
    let bytecodeStr = typeof bytecode === 'object' ? bytecode?.object : bytecode;
    if (!bytecodeStr || typeof bytecodeStr !== 'string') {
      return { isValid: false, message: 'Bytecode must be a hex string' };
    }

    // ✅ Bytecode starts with 0x
    if (!bytecodeStr.startsWith('0x')) {
      return { isValid: false, message: 'Bytecode must start with 0x' };
    }

    // ✅ Bytecode length > 10
    if (bytecodeStr.length < 10) {
      return { isValid: false, message: `Bytecode too short (${bytecodeStr.length} chars)` };
    }

    // ✅ Bytecode length is even
    const hexPart = bytecodeStr.slice(2);
    if (hexPart.length % 2 !== 0) {
      return { isValid: false, message: `Bytecode has odd length (${hexPart.length} hex digits)` };
    }

    return { isValid: true };
  };

  const validateABI = (abi: any): { isValid: boolean; message?: string } => {
    // ✅ ABI is valid JSON
    if (!Array.isArray(abi)) {
      return { isValid: false, message: 'ABI must be an array' };
    }

    try {
      JSON.stringify(abi);
    } catch {
      return { isValid: false, message: 'ABI is not valid JSON' };
    }

    return { isValid: true };
  };

  const validateConstructorArgs = (abi: any[]): { isValid: boolean; message?: string; expectedCount: number } => {
    const constructor = abi.find(item => item.type === 'constructor');
    const expectedCount = constructor ? constructor.inputs.length : 0;
    const providedCount = 0; // We're not handling constructor args yet

    if (expectedCount !== providedCount) {
      return { 
        isValid: false, 
        message: `Constructor requires ${expectedCount} arguments, but ${providedCount} provided`,
        expectedCount 
      };
    }

    return { isValid: true, expectedCount };
  };

  const validateWalletForDeployment = (): { isValid: boolean; message?: string } => {
    if (!isWalletReady) {
      return { isValid: false, message: 'Wallet not connected' };
    }

    // ✅ Wallet is connected to Arbitrum Sepolia
    if (!isCorrectNetwork) {
      return { isValid: false, message: 'Switch to Arbitrum Sepolia network' };
    }

    // ✅ Wallet has ≥ 0.002 ETH
    const balanceNum = parseFloat(wallet.balance || '0');
    if (balanceNum < 0.002) {
      return { isValid: false, message: `Need ≥ 0.002 ETH (current: ${balanceNum.toFixed(4)} ETH)` };
    }

    return { isValid: true };
  };

  // Check if deploy button should be enabled
  const isDeployButtonEnabled = (): boolean => {
    if (!compilationResult) return false;

    const bytecodeValid = validateBytecode(compilationResult.bytecode).isValid;
    const abiValid = validateABI(compilationResult.abi).isValid;
    const constructorValid = validateConstructorArgs(compilationResult.abi || []).isValid;

    if (usePrivateKey) {
      const privateKeyValid = validatePrivateKey(privateKey).isValid;
      return bytecodeValid && abiValid && constructorValid && privateKeyValid;
    } else {
      const walletValid = validateWalletForDeployment().isValid;
      return bytecodeValid && abiValid && constructorValid && walletValid;
    }
  };

  // Get validation error message for UI
  const getValidationMessage = (): string | null => {
    if (!compilationResult) return 'Compile your contract first';

    const bytecodeValidation = validateBytecode(compilationResult.bytecode);
    if (!bytecodeValidation.isValid) return bytecodeValidation.message || 'Invalid bytecode';

    const abiValidation = validateABI(compilationResult.abi);
    if (!abiValidation.isValid) return abiValidation.message || 'Invalid ABI';

    const constructorValidation = validateConstructorArgs(compilationResult.abi || []);
    if (!constructorValidation.isValid) return constructorValidation.message || 'Constructor args mismatch';

    if (usePrivateKey) {
      const privateKeyValidation = validatePrivateKey(privateKey);
      if (!privateKeyValidation.isValid) return privateKeyValidation.message || 'Invalid private key';
    } else {
      const walletValidation = validateWalletForDeployment();
      if (!walletValidation.isValid) return walletValidation.message || 'Wallet issue';
    }

    return null;
  };

  const estimateGas = async () => {
    if (!compilationResult) return;
    
    // Handle both string and object bytecode formats  
    let bytecodeToUse = compilationResult.bytecode;
    if (typeof bytecodeToUse === 'object' && bytecodeToUse?.object) {
      bytecodeToUse = bytecodeToUse.object;
    }
    
    setIsEstimatingGas(true);
    try {
      const estimate = await estimateDeploymentGas(
        bytecodeToUse,
        compilationResult.abi,
        network
      );
      setGasEstimate(estimate);
      toast({
        title: 'Gas Estimated',
        description: `Estimated cost: ${estimate.estimatedCost} ETH`,
      });
    } catch (error) {
      console.error('Gas estimation failed:', error);
      toast({
        title: 'Gas Estimation Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsEstimatingGas(false);
    }
  };

  const handleDeploy = async () => {
    console.log('=== FRONTEND DEPLOYMENT DEBUG ===');
    console.log('Active output tab:', activeOutputTab);
    console.log('Solidity compilation result:', solidityCompilationResult);
    console.log('Rust compilation result:', rustCompilationResult);
    console.log('Current compilation result:', compilationResult);
    console.log('Compilation result bytecode:', compilationResult?.bytecode);
    console.log('Compilation result bytecode type:', typeof compilationResult?.bytecode);
    console.log('Bytecode starts with 0x:', compilationResult?.bytecode?.startsWith?.('0x'));
    console.log('=== END FRONTEND DEBUG ===');
    
    // STRICT PRE-DEPLOYMENT VALIDATION (as per implementation guide)
    if (!isDeployButtonEnabled()) {
      const errorMessage = getValidationMessage();
      toast({
        title: 'Validation Failed',
        description: errorMessage || 'Deployment validation failed',
        variant: 'destructive',
      });
      return;
    }
    
    if (!compilationResult) {
      toast({
        title: 'No Compilation Result',
        description: 'Please compile your Python code to Solidity first using the "Compile to Solidity" button in the header',
        variant: 'destructive',
      });
      return;
    }

    // Check if user is trying to deploy Python source instead of compiled bytecode
    if (compilationResult.bytecode && (compilationResult.bytecode.includes('def ') || compilationResult.bytecode.includes('@contract') || compilationResult.bytecode.includes('class ') || compilationResult.bytecode.includes('#'))) {
      toast({
        title: 'Python Source Detected',
        description: 'You cannot deploy Python source code directly. Please compile your Python code to Solidity first using the "Compile to Solidity" button.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!compilationResult.success || !compilationResult.bytecode || !compilationResult.abi) {
      toast({
        title: 'Invalid Compilation Result',
        description: 'Compilation artifacts are missing or invalid. Please recompile your contract to Solidity.',
        variant: 'destructive',
      });
      return;
    }
    
    // Validate bytecode format - handle both string and object types
    let bytecodeToValidate = compilationResult.bytecode;
    if (typeof bytecodeToValidate === 'object' && bytecodeToValidate?.object) {
      bytecodeToValidate = bytecodeToValidate.object;
    }
    
    if (!bytecodeToValidate || typeof bytecodeToValidate !== 'string') {
      toast({
        title: 'Invalid Bytecode Type',
        description: 'Bytecode is missing or in wrong format. Please recompile your contract.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!bytecodeToValidate.startsWith('0x')) {
      toast({
        title: 'Invalid Bytecode',
        description: 'Bytecode must start with 0x. Please recompile your contract first.',
        variant: 'destructive',
      });
      return;
    }

    // Fix odd-length bytecode
    const hexPart = bytecodeToValidate.slice(2);
    if (hexPart.length % 2 !== 0) {
      bytecodeToValidate = bytecodeToValidate + '0';
      console.log('Fixed odd-length bytecode in frontend by padding');
    }

    // Additional bytecode validation
    const bytecodePattern = /^0x[a-fA-F0-9]+$/;
    if (!bytecodePattern.test(bytecodeToValidate)) {
      toast({
        title: 'Invalid Bytecode Format', 
        description: 'The bytecode format is invalid. Please recompile your contract.',
        variant: 'destructive',
      });
      return;
    }
    
    // Check deployment method
    if (usePrivateKey) {
      // Private key deployment
      if (!privateKey) {
        toast({
          title: 'Missing Private Key',
          description: 'Please provide a private key for deployment',
          variant: 'destructive',
        });
        return;
      }

      // Validate private key format
      const privateKeyValidation = validatePrivateKey(privateKey);
      if (!privateKeyValidation.isValid) {
        toast({
          title: 'Invalid Private Key',
          description: privateKeyValidation.message,
          variant: 'destructive',
        });
        return;
      }
    } else {
      // MetaMask deployment
      if (!isWalletReady) {
        toast({
          title: 'Wallet Not Connected',
          description: 'Please connect your MetaMask wallet first',
          variant: 'destructive',
        });
        return;
      }

      if (!isCorrectNetwork) {
        toast({
          title: 'Wrong Network',
          description: 'Please switch to Arbitrum Sepolia network in MetaMask',
          variant: 'destructive',
        });
        return;
      }

      // Check wallet balance
      const balanceNum = parseFloat(wallet.balance || '0');
      if (balanceNum < 0.001) {
        toast({
          title: 'Insufficient Balance',
          description: 'You need at least 0.001 ETH for deployment. Get testnet ETH from a faucet.',
          variant: 'destructive',
        });
        return;
      }
    }

    setDeployment({
      status: 'deploying',
      progress: 0,
      stage: 'starting',
      message: 'Starting deployment...'
    });

    try {
      // Debug logging to check bytecode value
      console.log('Compilation result:', compilationResult);
      console.log('Validated bytecode being sent:', bytecodeToValidate?.substring(0, 100) + '...');
      console.log('Bytecode type:', typeof bytecodeToValidate);
      console.log('Bytecode starts with 0x:', bytecodeToValidate?.startsWith('0x'));
      console.log('Bytecode length:', bytecodeToValidate?.length);
      
      // Deploy with either MetaMask signer or private key
      let deploymentResult;
      if (usePrivateKey) {
        // Private key deployment
        deploymentResult = await deployContract(
          bytecodeToValidate,
          compilationResult.abi,
          privateKey,
          network
        );
      } else {
        // MetaMask deployment
        if (!wallet.signer) {
          throw new Error('MetaMask signer not available');
        }
        
        deploymentResult = await deployContractWithSigner(
          bytecodeToValidate,
          compilationResult.abi,
          wallet.signer,
          network
        );
      }

      if (deploymentResult.success) {
        setDeployment({
          status: 'completed',
          progress: 100,
          stage: 'completed',
          message: deploymentResult.message || 'Contract deployed successfully!',
          txHash: deploymentResult.txHash,
          contractAddress: deploymentResult.contractAddress,
          explorerUrl: deploymentResult.explorerUrl,
          contractExplorerUrl: deploymentResult.contractExplorerUrl,
          sessionId: deploymentResult.sessionId,
          gasUsed: deploymentResult.gasUsed,
          deploymentCost: deploymentResult.deploymentCost,
          blockNumber: deploymentResult.blockNumber
        });

        toast({
          title: 'Deployment Successful!',
          description: `Contract deployed at ${deploymentResult.contractAddress}`,
        });

        // Start monitoring if we have a session ID
        if (deploymentResult.sessionId) {
          monitorDeployment(deploymentResult.sessionId);
        }
      } else {
        throw new Error(deploymentResult.error || 'Deployment failed');
      }
    } catch (error) {
      console.error('Deployment failed:', error);
      setDeployment({
        status: 'failed',
        progress: 0,
        stage: 'error',
        message: 'Deployment failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      toast({
        title: 'Deployment Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const monitorDeployment = async (sessionId: string) => {
    try {
      const status = await getDeploymentStatus(sessionId);
      
      if (status.deployment) {
        setDeployment(prev => ({
          ...prev,
          confirmations: status.transaction?.confirmations || 0,
          message: status.transaction?.message || prev.message
        }));
      }
    } catch (error) {
      console.error('Monitoring failed:', error);
    }
  };

  const refreshTransactionDetails = async () => {
    if (!deployment.txHash) return;

    try {
      const details = await getTransactionDetails(deployment.txHash, network);
      
      setDeployment(prev => ({
        ...prev,
        confirmations: details.confirmations,
        message: details.status === 'success' ? 'Transaction confirmed' : 'Transaction pending'
      }));

      toast({
        title: 'Transaction Updated',
        description: `Status: ${details.status}, Confirmations: ${details.confirmations}`,
      });
    } catch (error) {
      console.error('Failed to refresh transaction details:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'deploying': case 'monitoring': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'deploying': case 'monitoring': return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Smart Contract Deployment
          <Badge variant="outline" className="ml-auto">
            {network.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Deployment Form */}
        {deployment.status === 'idle' && (
          <div className="space-y-4">
            {/* Wallet Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium mb-2">
                Choose Deployment Method
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* MetaMask Option */}
                <button
                  onClick={() => setUsePrivateKey(false)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    !usePrivateKey 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="w-5 h-5" />
                    <span className="font-medium">MetaMask</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Deploy using your connected MetaMask wallet
                  </p>
                  {!usePrivateKey && (
                    <div className="mt-2 text-xs">
                      {isWalletReady ? (
                        <div className="space-y-1">
                          <p className="text-green-600">✓ Wallet connected</p>
                          <p className="text-gray-600">Address: {wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</p>
                          <p className="text-gray-600">Balance: {parseFloat(wallet.balance || '0').toFixed(4)} ETH</p>
                          {!isCorrectNetwork && (
                            <p className="text-orange-600">⚠️ Switch to Arbitrum Sepolia</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-orange-600">⚠️ Connect MetaMask first</p>
                      )}
                    </div>
                  )}
                </button>

                {/* Private Key Option */}
                <button
                  onClick={() => setUsePrivateKey(true)}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    usePrivateKey 
                      ? 'border-blue-500 bg-blue-50 text-blue-900' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">Private Key</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Deploy using a private key (testnet only)
                  </p>
                </button>
              </div>
            </div>

            {/* Private Key Input (only when selected) */}
            {usePrivateKey && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Private Key (for deployment)
                </label>
                <div className="space-y-2">
                  <input
                    type="password"
                    value={privateKey}
                    onChange={(e) => handlePrivateKeyChange(e.target.value)}
                    placeholder="0x..."
                    className={`w-full p-2 border rounded-md ${
                      privateKey && !validatePrivateKey(privateKey).isValid 
                        ? 'border-red-500' 
                        : 'border-gray-300'
                    }`}
                  />
                  {privateKey && !validatePrivateKey(privateKey).isValid && (
                    <p className="text-xs text-red-500">
                      {validatePrivateKey(privateKey).message}
                    </p>
                  )}
                  {privateKey && validatePrivateKey(privateKey).isValid && (
                    <p className="text-xs text-green-500">✓ Valid private key format</p>
                  )}
                  <p className="text-xs text-gray-500">
                    ⚠️ Only use testnet private keys. Never use mainnet keys.
                  </p>
                </div>
              </div>
            )}

            {/* Gas Estimation */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Gas Estimation for {network}</p>
                {gasEstimate ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Gas Limit: {gasEstimate.gasEstimate || gasEstimate.gasLimit}</p>
                    <p>Gas Price: {gasEstimate.gasPriceGwei ? `${gasEstimate.gasPriceGwei} Gwei` : 'N/A'}</p>
                    <p>Cost: ~{gasEstimate.estimatedCost} ETH</p>
                    {gasEstimate.estimatedCostUSD && (
                      <p>~${gasEstimate.estimatedCostUSD} USD</p>
                    )}
                    {gasEstimate.mock && (
                      <p className="text-orange-500 text-xs">⚠️ Mock estimate (RPC unavailable)</p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Click to estimate deployment cost</p>
                )}
              </div>
              <Button
                onClick={estimateGas}
                disabled={!compilationResult || isEstimatingGas}
                variant="outline"
                size="sm"
              >
                {isEstimatingGas && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Estimate
              </Button>
            </div>

            {/* Validation Status */}
            {!isDeployButtonEnabled() && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-orange-800">
                  {getValidationMessage()}
                </AlertDescription>
              </Alert>
            )}

            {/* Deploy Button */}
            <Button
              onClick={handleDeploy}
              disabled={!isDeployButtonEnabled()}
              className="w-full"
            >
              Deploy Contract {!usePrivateKey ? 'with MetaMask' : 'with Private Key'}
            </Button>
          </div>
        )}

        {/* Deployment Progress */}
        {(deployment.status === 'deploying' || deployment.status === 'monitoring') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(deployment.status)}`} />
              <span className="font-medium">{deployment.stage}</span>
              {getStatusIcon(deployment.status)}
            </div>

            <Progress value={getProgressForStage(deployment.stage)} className="w-full" />
            
            <div className="text-sm text-gray-600">
              {deployment.message}
            </div>

            {deployment.txHash && (
              <Alert>
                <AlertDescription>
                  <div className="flex items-center justify-between">
                    <span>Transaction Hash: {deployment.txHash.slice(0, 10)}...{deployment.txHash.slice(-8)}</span>
                    <Button
                      onClick={() => copyToClipboard(deployment.txHash!, 'Transaction hash')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Deployment Success */}
        {deployment.status === 'completed' && (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {deployment.message}
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {deployment.contractAddress && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Contract Address</p>
                    <p className="text-gray-600 font-mono text-xs">
                      {deployment.contractAddress.slice(0, 10)}...{deployment.contractAddress.slice(-8)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={() => copyToClipboard(deployment.contractAddress!, 'Contract address')}
                      variant="ghost"
                      size="sm"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {deployment.contractExplorerUrl && (
                      <Button
                        onClick={() => window.open(deployment.contractExplorerUrl, '_blank')}
                        variant="ghost"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {deployment.txHash && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Transaction Hash</p>
                    <p className="text-gray-600 font-mono text-xs">
                      {deployment.txHash.slice(0, 10)}...{deployment.txHash.slice(-8)}
                    </p>
                    {deployment.confirmations !== undefined && (
                      <p className="text-xs text-gray-500">
                        {deployment.confirmations} confirmations
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      onClick={refreshTransactionDetails}
                      variant="ghost"
                      size="sm"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                    {deployment.explorerUrl && (
                      <Button
                        onClick={() => window.open(deployment.explorerUrl, '_blank')}
                        variant="ghost"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {deployment.gasUsed && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Gas Used</p>
                  <p className="text-gray-600">{parseInt(deployment.gasUsed).toLocaleString()}</p>
                </div>
              )}

              {deployment.deploymentCost && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Deployment Cost</p>
                  <p className="text-gray-600">{deployment.deploymentCost} ETH</p>
                </div>
              )}

              {deployment.blockNumber && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">Block Number</p>
                  <p className="text-gray-600">{deployment.blockNumber.toLocaleString()}</p>
                </div>
              )}
            </div>

            <Button
              onClick={() => {
                setDeployment({
                  status: 'idle',
                  progress: 0,
                  stage: '',
                  message: ''
                });
                setPrivateKey('');
                setGasEstimate(null);
              }}
              variant="outline"
              className="w-full"
            >
              Deploy Another Contract
            </Button>
          </div>
        )}

        {/* Deployment Error */}
        {deployment.status === 'failed' && (
          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <p className="font-medium">{deployment.message}</p>
                {deployment.error && (
                  <p className="text-sm mt-1">{deployment.error}</p>
                )}
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => {
                setDeployment({
                  status: 'idle',
                  progress: 0,
                  stage: '',
                  message: ''
                });
              }}
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* No Compilation Result */}
        {!compilationResult && deployment.status === 'idle' && (
          <Alert>
            <AlertDescription>
              Please compile your Python contract first before deploying.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DeploymentPanel;
