import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useAppStore, ARBITRUM_NETWORKS } from '@/stores/appStore';
import { toast } from '@/hooks/use-toast';

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      removeAllListeners: (event?: string) => void;
    };
  }
}

// User rejection error codes
const USER_REJECTION_CODES = [4001, -32002];

// Check if error is user rejection
const isUserRejection = (error: any): boolean => {
  return USER_REJECTION_CODES.includes(error?.code) || 
         error?.message?.toLowerCase().includes('user rejected') ||
         error?.message?.toLowerCase().includes('user denied');
};

export function useMetaMask() {
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const {
    wallet,
    setWalletConnecting,
    setWalletConnected,
    setWalletDisconnected,
    updateWalletNetwork,
    updateWalletBalance,
    setWalletError,
    getNetworkInfo,
    setConnectedWallet, // Legacy support
  } = useAppStore();

  // Check MetaMask installation
  useEffect(() => {
    const checkMetaMask = () => {
      const installed = typeof window !== 'undefined' && 
        !!window.ethereum?.isMetaMask;
      setIsMetaMaskInstalled(installed);
      
      if (!installed) {
        console.warn('MetaMask not detected');
      }
    };

    checkMetaMask();
    
    // Recheck periodically in case MetaMask gets installed
    const interval = setInterval(checkMetaMask, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get network name from chain ID
  const getNetworkName = useCallback((chainId: string): string => {
    switch (chainId) {
      case ARBITRUM_NETWORKS.sepolia.chainId:
        return 'Arbitrum Sepolia';
      case ARBITRUM_NETWORKS.mainnet.chainId:
        return 'Arbitrum Mainnet';
      case '0x1':
        return 'Ethereum Mainnet';
      case '0x5':
        return 'Goerli Testnet';
      case '0xaa36a7':
        return 'Sepolia Testnet';
      default:
        return `Unknown Network (${chainId})`;
    }
  }, []);

  // Update wallet balance
  const updateBalance = useCallback(async (address: string, provider: ethers.BrowserProvider) => {
    try {
      const balance = await provider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);
      updateWalletBalance(balanceInEth);
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  }, [updateWalletBalance]);

  // Initialize provider and signer
  const initializeProvider = useCallback(async (address: string) => {
    try {
      if (!window.ethereum) throw new Error('No ethereum provider');
      
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();
      const chainId = '0x' + network.chainId.toString(16);
      const networkName = getNetworkName(chainId);
      
      // Update store with provider and signer
      setWalletConnected(address, provider, signer);
      updateWalletNetwork(chainId, networkName);
      
      // Update balance
      await updateBalance(address, provider);
      
      return { provider, signer };
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      setWalletError('Failed to initialize Web3 provider');
      throw error;
    }
  }, [setWalletConnected, updateWalletNetwork, getNetworkName, updateBalance, setWalletError]);

  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts: unknown) => {
    console.log('Accounts changed:', accounts);
    const accountsArray = accounts as string[];
    
    if (accountsArray.length === 0) {
      setWalletDisconnected();
      toast({
        title: 'Wallet Disconnected',
        description: 'Your wallet has been disconnected',
      });
    } else {
      const newAddress = accountsArray[0];
      try {
        await initializeProvider(newAddress);
        toast({
          title: 'Account Changed',
          description: `Switched to ${newAddress.slice(0, 6)}...${newAddress.slice(-4)}`,
        });
      } catch (error) {
        console.error('Failed to reinitialize after account change:', error);
        setWalletError('Failed to switch account');
      }
    }
  }, [setWalletDisconnected, initializeProvider, setWalletError]);

  // Handle network changes
  const handleChainChanged = useCallback(async (chainId: unknown) => {
    console.log('Chain changed:', chainId);
    const newChainId = chainId as string;
    const networkName = getNetworkName(newChainId);
    
    updateWalletNetwork(newChainId, networkName);
    
    // Update balance for new network
    if (wallet.connectedWallet && wallet.provider) {
      await updateBalance(wallet.connectedWallet, wallet.provider);
    }
    
    const networkInfo = getNetworkInfo();
    if (!networkInfo.isSupported) {
      toast({
        title: 'Unsupported Network',
        description: `You're on ${networkName}. Please switch to Arbitrum Sepolia or Mainnet for full functionality.`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Network Changed',
        description: `Switched to ${networkName}`,
      });
    }
  }, [getNetworkName, updateWalletNetwork, updateBalance, wallet.connectedWallet, wallet.provider, getNetworkInfo]);

  // Setup event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    // Add event listeners
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Check if already connected and restore session
    const restoreSession = async () => {
      try {
        const accounts = await window.ethereum!.request({ 
          method: 'eth_accounts' 
        }) as string[];
        
        if (accounts.length > 0) {
          console.log('Restoring session for:', accounts[0]);
          await initializeProvider(accounts[0]);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    };

    restoreSession();

    // Cleanup
    return () => {
      if (window.ethereum?.removeAllListeners) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      } else {
        window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum?.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged, initializeProvider]);

  // Switch to Arbitrum network
  const switchToArbitrum = useCallback(async (network: 'sepolia' | 'mainnet' = 'sepolia') => {
    if (!window.ethereum) throw new Error('MetaMask not available');
    
    const targetNetwork = ARBITRUM_NETWORKS[network];
    
    try {
      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetNetwork.chainId }],
      });
      
      toast({
        title: 'Network Switched',
        description: `Successfully switched to ${targetNetwork.chainName}`,
      });
    } catch (switchError: unknown) {
      const error = switchError as { code: number; message: string };
      
      // If network doesn't exist, add it
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [targetNetwork],
          });
          
          toast({
            title: 'Network Added',
            description: `Successfully added and switched to ${targetNetwork.chainName}`,
          });
        } catch (addError) {
          if (isUserRejection(addError)) {
            toast({
              title: 'Network Addition Cancelled',
              description: 'You cancelled adding the network',
            });
          } else {
            console.error('Failed to add network:', addError);
            toast({
              title: 'Failed to Add Network',
              description: `Failed to add ${targetNetwork.chainName}. Please add it manually.`,
              variant: 'destructive',
            });
          }
          throw addError;
        }
      } else if (isUserRejection(error)) {
        toast({
          title: 'Network Switch Cancelled',
          description: 'You cancelled switching networks',
        });
        throw error;
      } else {
        console.error('Failed to switch network:', error);
        toast({
          title: 'Network Switch Failed',
          description: `Failed to switch to ${targetNetwork.chainName}`,
          variant: 'destructive',
        });
        throw error;
      }
    }
  }, []);

  // Main connect function
  const connect = async (targetNetwork: 'sepolia' | 'mainnet' = 'sepolia') => {
    if (!isMetaMaskInstalled) {
      toast({
        title: 'MetaMask Not Found',
        description: 'Please install MetaMask to connect your wallet',
        variant: 'destructive',
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    setWalletConnecting(true);
    setWalletError(null);

    try {
      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      }) as string[];

      if (accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const address = accounts[0];
      console.log('Connected to account:', address);

      // Initialize provider and signer
      await initializeProvider(address);

      // Switch to target Arbitrum network
      try {
        await switchToArbitrum(targetNetwork);
      } catch (networkError) {
        // Don't fail connection if network switch fails
        console.warn('Network switch failed, but wallet is connected:', networkError);
      }

      toast({
        title: 'Wallet Connected',
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });

    } catch (error: unknown) {
      const err = error as { code?: number; message?: string };
      console.error('Failed to connect:', error);

      if (isUserRejection(err)) {
        toast({
          title: 'Connection Cancelled',
          description: 'You cancelled the wallet connection',
        });
        setWalletError('User cancelled connection');
      } else {
        toast({
          title: 'Connection Failed',
          description: err.message || 'Failed to connect wallet. Please try again.',
          variant: 'destructive',
        });
        setWalletError(err.message || 'Connection failed');
      }
    } finally {
      setWalletConnecting(false);
    }
  };

  // Disconnect function
  const disconnect = useCallback(() => {
    setWalletDisconnected();
    toast({
      title: 'Wallet Disconnected',
      description: 'Your wallet has been disconnected',
    });
  }, [setWalletDisconnected]);

  // Force refresh connection (useful for manual reconnection)
  const refreshConnection = useCallback(async () => {
    if (!wallet.connectedWallet) return;
    
    try {
      await initializeProvider(wallet.connectedWallet);
      toast({
        title: 'Connection Refreshed',
        description: 'Wallet connection has been refreshed',
      });
    } catch (error) {
      console.error('Failed to refresh connection:', error);
      setWalletError('Failed to refresh connection');
    }
  }, [wallet.connectedWallet, initializeProvider, setWalletError]);

  // Check if current network is supported
  const isNetworkSupported = useCallback(() => {
    const networkInfo = getNetworkInfo();
    return networkInfo.isSupported;
  }, [getNetworkInfo]);

  return {
    // Connection state
    isMetaMaskInstalled,
    isConnecting: wallet.isConnecting,
    isConnected: wallet.isConnected,
    connectedWallet: wallet.connectedWallet,
    
    // Network state
    chainId: wallet.chainId,
    network: wallet.network,
    balance: wallet.balance,
    isNetworkSupported,
    
    // Provider and signer
    provider: wallet.provider,
    signer: wallet.signer,
    
    // Error state
    error: wallet.error,
    
    // Actions
    connect,
    disconnect,
    refreshConnection,
    switchToArbitrum,
    
    // Network info
    getNetworkInfo,
    
    // Legacy support
    ...({ connectedWallet: wallet.connectedWallet } as const),
  };
}

// Export for external use
export type UseMetaMaskReturn = ReturnType<typeof useMetaMask>;
