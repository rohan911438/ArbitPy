import React from 'react';
import { WalletConnection } from '@/components/wallet/WalletConnection';
import { useMetaMask } from '@/hooks/useMetaMask';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wallet, Network, Zap, CheckCircle } from 'lucide-react';

export function WalletDemo() {
  const {
    isMetaMaskInstalled,
    isConnected,
    connectedWallet,
    provider,
    signer,
    network,
    balance,
    chainId,
    isNetworkSupported,
  } = useMetaMask();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">ArbitPy Wallet Connection Demo</h1>
        <p className="text-muted-foreground">
          Comprehensive MetaMask integration with Arbitrum support
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Wallet Connection Component */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Wallet Connection</h2>
          <WalletConnection />
        </div>

        {/* Technical Details */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Technical Details</h2>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span>MetaMask Installed:</span>
                <Badge variant={isMetaMaskInstalled ? "default" : "destructive"}>
                  {isMetaMaskInstalled ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Wallet Connected:</span>
                <Badge variant={isConnected ? "default" : "secondary"}>
                  {isConnected ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Provider Ready:</span>
                <Badge variant={provider ? "default" : "secondary"}>
                  {provider ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Signer Ready:</span>
                <Badge variant={signer ? "default" : "secondary"}>
                  {signer ? "Yes" : "No"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Network className="w-5 h-5" />
                  Network Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Address:</label>
                  <code className="block p-2 bg-muted rounded text-xs break-all">
                    {connectedWallet}
                  </code>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Network:</span>
                  <Badge variant={isNetworkSupported() ? "default" : "destructive"}>
                    {network || "Unknown"}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span>Chain ID:</span>
                  <code className="text-xs bg-muted px-2 py-1 rounded">{chainId}</code>
                </div>
                
                {balance && (
                  <div className="flex items-center justify-between">
                    <span>Balance:</span>
                    <span className="font-mono">{parseFloat(balance).toFixed(6)} ETH</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span>Arbitrum Compatible:</span>
                  <Badge variant={isNetworkSupported() ? "default" : "destructive"}>
                    {isNetworkSupported() ? "Yes" : "No"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Features Showcase */}
      <Card>
        <CardHeader>
          <CardTitle>Implemented Features</CardTitle>
          <CardDescription>
            This wallet connection implementation includes the following features:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "MetaMask Detection",
              "Account Access Request (eth_requestAccounts)",
              "Network Switching (wallet_switchEthereumChain)",
              "Network Addition (wallet_addEthereumChain)",
              "Account Change Listening",
              "Network Change Listening",
              "User Rejection Handling",
              "Clear UI Feedback",
              "Ethers.js Provider & Signer",
              "Persistent Wallet State",
              "Arbitrum Sepolia Support", 
              "Arbitrum Mainnet Support",
              "Balance Display",
              "Network Status Indicators",
              "Error Handling",
              "Session Restoration"
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default WalletDemo;