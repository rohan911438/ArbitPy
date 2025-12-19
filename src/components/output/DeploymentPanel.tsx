import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Copy, RefreshCw } from 'lucide-react';
import { deployContract, getDeploymentStatus, getTransactionDetails, estimateDeploymentGas } from '../../lib/api';
import { useToast } from '../../hooks/use-toast';

interface DeploymentPanelProps {
  compilationResult?: {
    bytecode: string;
    abi: any[];
    output: string;
  };
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
  compilationResult, 
  network = 'arbitrum_sepolia' 
}) => {
  const [deployment, setDeployment] = useState<DeploymentState>({
    status: 'idle',
    progress: 0,
    stage: '',
    message: ''
  });
  
  const [privateKey, setPrivateKey] = useState('');
  const [gasEstimate, setGasEstimate] = useState<any>(null);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);
  const { toast } = useToast();

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

  const estimateGas = async () => {
    if (!compilationResult) return;
    
    setIsEstimatingGas(true);
    try {
      const estimate = await estimateDeploymentGas(
        compilationResult.bytecode,
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
    if (!compilationResult || !privateKey) {
      toast({
        title: 'Missing Information',
        description: 'Please provide compilation result and private key',
        variant: 'destructive',
      });
      return;
    }

    setDeployment({
      status: 'deploying',
      progress: 0,
      stage: 'starting',
      message: 'Starting deployment...'
    });

    try {
      const result = await deployContract(
        compilationResult.bytecode,
        compilationResult.abi,
        privateKey,
        network
      );

      if (result.success) {
        setDeployment({
          status: 'completed',
          progress: 100,
          stage: 'completed',
          message: result.message || 'Contract deployed successfully!',
          txHash: result.txHash,
          contractAddress: result.contractAddress,
          explorerUrl: result.explorerUrl,
          contractExplorerUrl: result.contractExplorerUrl,
          sessionId: result.sessionId,
          gasUsed: result.gasUsed,
          deploymentCost: result.deploymentCost,
          blockNumber: result.blockNumber
        });

        toast({
          title: 'Deployment Successful!',
          description: `Contract deployed at ${result.contractAddress}`,
        });

        // Start monitoring if we have a session ID
        if (result.sessionId) {
          monitorDeployment(result.sessionId);
        }
      } else {
        throw new Error(result.error || 'Deployment failed');
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
            <div>
              <label className="block text-sm font-medium mb-2">
                Private Key (for deployment)
              </label>
              <input
                type="password"
                value={privateKey}
                onChange={(e) => setPrivateKey(e.target.value)}
                placeholder="0x..."
                className="w-full p-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                ⚠️ Only use testnet private keys. Never use mainnet keys.
              </p>
            </div>

            {/* Gas Estimation */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Gas Estimation</p>
                {gasEstimate ? (
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Gas: {gasEstimate.gasEstimate}</p>
                    <p>Cost: ~{gasEstimate.estimatedCost} ETH</p>
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

            {/* Deploy Button */}
            <Button
              onClick={handleDeploy}
              disabled={!compilationResult || !privateKey}
              className="w-full"
            >
              Deploy Contract
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
