import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export function useMetaMask() {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectedWallet, setConnectedWallet } = useAppStore();

  useEffect(() => {
    setIsMetaMaskInstalled(typeof window !== 'undefined' && !!window.ethereum?.isMetaMask);
  }, []);

  const handleAccountsChanged = useCallback((accounts: unknown) => {
    const accountsArray = accounts as string[];
    if (accountsArray.length === 0) {
      setConnectedWallet(null);
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } else {
      setConnectedWallet(accountsArray[0]);
    }
  }, [setConnectedWallet]);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Check if already connected
      window.ethereum
        .request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accountsArray = accounts as string[];
          if (accountsArray.length > 0) {
            setConnectedWallet(accountsArray[0]);
          }
        })
        .catch(console.error);

      return () => {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      };
    }
  }, [handleAccountsChanged, setConnectedWallet]);

  const connect = async () => {
    if (!isMetaMaskInstalled) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask to connect your wallet',
        variant: 'destructive',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setIsConnecting(true);
    try {
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      }) as string[];
      
      setConnectedWallet(accounts[0]);
      
      // Switch to Arbitrum Sepolia testnet
      try {
        await window.ethereum!.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x66eee' }], // Arbitrum Sepolia
        });
      } catch (switchError: unknown) {
        const error = switchError as { code: number };
        // Chain not added, add it
        if (error.code === 4902) {
          await window.ethereum!.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x66eee',
              chainName: 'Arbitrum Sepolia',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
              blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
            }],
          });
        }
      }

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`,
      });
    } catch (error) {
      console.error('Failed to connect:', error);
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect wallet. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setConnectedWallet(null);
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  };

  return {
    isMetaMaskInstalled,
    isConnecting,
    connectedWallet,
    connect,
    disconnect,
  };
}
