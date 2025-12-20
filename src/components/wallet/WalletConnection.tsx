import React, { useState } from 'react';
import { useMetaMask } from '@/hooks/useMetaMask';
import {
  Wallet,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Network,
  RefreshCw,
  ExternalLink,
  Copy,
  X,
  Info
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function WalletConnection() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    isMetaMaskInstalled,
    isConnecting,
    isConnected,
    connectedWallet,
    chainId,
    network,
    balance,
    error,
    provider,
    signer,
    connect,
    disconnect,
    refreshConnection,
    switchToArbitrum,
    isNetworkSupported,
    getNetworkInfo
  } = useMetaMask();

  const networkInfo = getNetworkInfo();

  const copyAddress = async () => {
    if (connectedWallet) {
      await navigator.clipboard.writeText(connectedWallet);
      toast({
        title: 'Address Copied',
        description: 'Wallet address copied to clipboard',
      });
    }
  };

  const openExplorer = () => {
    if (!connectedWallet || !chainId) return;
    
    let explorerUrl = '';
    if (chainId === '0x66eee') { // Arbitrum Sepolia
      explorerUrl = `https://sepolia.arbiscan.io/address/${connectedWallet}`;
    } else if (chainId === '0xa4b1') { // Arbitrum Mainnet
      explorerUrl = `https://arbiscan.io/address/${connectedWallet}`;
    }
    
    if (explorerUrl) {
      window.open(explorerUrl, '_blank');
    }
  };

  if (!isMetaMaskInstalled) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            MetaMask Required
          </CardTitle>
          <CardDescription>
            Please install MetaMask to connect your wallet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            className="w-full"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Install MetaMask
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!isConnected) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Wallet
          </CardTitle>
          <CardDescription>
            Connect to Arbitrum network to start using ArbitPy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <div className="flex items-start gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={() => connect('sepolia')}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Network className="w-4 h-4 mr-2" />
              )}
              Connect to Arbitrum Sepolia
            </Button>
            
            <Button
              onClick={() => connect('mainnet')}
              disabled={isConnecting}
              variant="outline"
              className="w-full"
            >
              {isConnecting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Network className="w-4 h-4 mr-2" />
              )}
              Connect to Arbitrum Mainnet
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground text-center">
            <Info className="w-3 h-3 inline mr-1" />
            Make sure you have ETH for gas fees
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connected Wallet Display */}
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                networkInfo.isSupported ? 'bg-green-500' : 'bg-yellow-500'
              } animate-pulse`} />
              Wallet Connected
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Wallet Details</DialogTitle>
                  <DialogDescription>
                    Detailed information about your connected wallet
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Address */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Address</label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 p-2 bg-muted rounded text-sm font-mono">
                        {connectedWallet}
                      </code>
                      <Button size="sm" variant="outline" onClick={copyAddress}>
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={openExplorer}>
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Network */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Network</label>
                    <div className="flex items-center gap-2">
                      <Badge variant={networkInfo.isSupported ? "default" : "destructive"}>
                        {network || 'Unknown'}
                      </Badge>
                      {!networkInfo.isSupported && (
                        <Button 
                          size="sm" 
                          onClick={() => switchToArbitrum('sepolia')}
                        >
                          Switch to Arbitrum
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Balance */}
                  {balance && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Balance</label>
                      <div className="p-2 bg-muted rounded">
                        <span className="font-mono text-lg">
                          {parseFloat(balance).toFixed(6)} ETH
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Chain ID */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Chain ID</label>
                    <div className="p-2 bg-muted rounded">
                      <code className="text-sm">{chainId}</code>
                    </div>
                  </div>

                  {/* Provider Status */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provider Status</label>
                    <div className="flex items-center gap-2">
                      {provider && signer ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ready
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Not Ready
                        </Badge>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={refreshConnection}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Close
                  </Button>
                  <Button variant="destructive" onClick={disconnect}>
                    Disconnect
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
          <CardDescription>
            {connectedWallet && (
              <code className="text-xs">
                {connectedWallet.slice(0, 8)}...{connectedWallet.slice(-6)}
              </code>
            )}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Network Status */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Network:</span>
            <Badge variant={networkInfo.isSupported ? "default" : "destructive"}>
              {network || 'Unknown'}
            </Badge>
          </div>

          {/* Balance */}
          {balance && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Balance:</span>
              <span className="font-mono text-sm">
                {parseFloat(balance).toFixed(4)} ETH
              </span>
            </div>
          )}

          {/* Network Warning */}
          {!networkInfo.isSupported && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="text-yellow-800 font-medium">Wrong Network</p>
                  <p className="text-yellow-700">
                    Please switch to Arbitrum Sepolia or Mainnet for full functionality.
                  </p>
                  <Button 
                    size="sm" 
                    className="mt-2"
                    onClick={() => switchToArbitrum('sepolia')}
                  >
                    Switch to Arbitrum Sepolia
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div className="text-sm text-red-800">{error}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletConnection;