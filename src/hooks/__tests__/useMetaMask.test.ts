import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMetaMask } from '../useMetaMask';

// Mock the ethers library
vi.mock('ethers', () => ({
  ethers: {
    BrowserProvider: vi.fn(() => ({
      getBalance: vi.fn(() => Promise.resolve(BigInt('1000000000000000000'))),
      getSigner: vi.fn(() => Promise.resolve({})),
      getNetwork: vi.fn(() => Promise.resolve({ chainId: 421614 })),
    })),
    formatEther: vi.fn(() => '1.0'),
  },
}));

// Mock the app store
vi.mock('../../stores/appStore', () => ({
  useAppStore: () => ({
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
    setWalletConnecting: vi.fn(),
    setWalletConnected: vi.fn(),
    setWalletDisconnected: vi.fn(),
    updateWalletNetwork: vi.fn(),
    updateWalletBalance: vi.fn(),
    setWalletError: vi.fn(),
    getNetworkInfo: vi.fn(() => ({ chainId: '0x66eee', name: 'Arbitrum Sepolia', isSupported: true })),
    setConnectedWallet: vi.fn(),
  }),
  ARBITRUM_NETWORKS: {
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
  },
}));

// Mock toast
vi.mock('../../hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('useMetaMask', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock window.ethereum
    Object.defineProperty(window, 'ethereum', {
      value: {
        isMetaMask: true,
        request: vi.fn(),
        on: vi.fn(),
        removeListener: vi.fn(),
        removeAllListeners: vi.fn(),
      },
      writable: true,
    });
  });

  it('should detect MetaMask installation', () => {
    const { result } = renderHook(() => useMetaMask());
    
    expect(result.current.isMetaMaskInstalled).toBe(true);
  });

  it('should handle MetaMask not installed', () => {
    Object.defineProperty(window, 'ethereum', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useMetaMask());
    
    expect(result.current.isMetaMaskInstalled).toBe(false);
  });

  it('should return correct initial state', () => {
    const { result } = renderHook(() => useMetaMask());
    
    expect(result.current.isConnecting).toBe(false);
    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectedWallet).toBe(null);
    expect(result.current.provider).toBe(null);
    expect(result.current.signer).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle account connection', async () => {
    const mockRequest = vi.fn()
      .mockResolvedValueOnce(['0x1234567890abcdef1234567890abcdef12345678']) // eth_requestAccounts
      .mockRejectedValue({ code: 4902 }); // wallet_switchEthereumChain (network not added)

    window.ethereum!.request = mockRequest;

    const { result } = renderHook(() => useMetaMask());

    await act(async () => {
      await result.current.connect('sepolia');
    });

    expect(mockRequest).toHaveBeenCalledWith({
      method: 'eth_requestAccounts',
    });
  });

  it('should handle user rejection', async () => {
    const mockRequest = vi.fn()
      .mockRejectedValue({ code: 4001, message: 'User rejected the request.' });

    window.ethereum!.request = mockRequest;

    const { result } = renderHook(() => useMetaMask());

    await act(async () => {
      await result.current.connect('sepolia');
    });

    expect(result.current.error).toBe('User cancelled connection');
  });

  it('should handle network switching', async () => {
    const { result } = renderHook(() => useMetaMask());

    const mockRequest = vi.fn()
      .mockResolvedValue(undefined);

    window.ethereum!.request = mockRequest;

    await act(async () => {
      await result.current.switchToArbitrum('sepolia');
    });

    expect(mockRequest).toHaveBeenCalledWith({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x66eee' }],
    });
  });

  it('should handle adding network when not present', async () => {
    const { result } = renderHook(() => useMetaMask());

    const mockRequest = vi.fn()
      .mockRejectedValueOnce({ code: 4902 }) // Network not found
      .mockResolvedValueOnce(undefined); // Successfully added

    window.ethereum!.request = mockRequest;

    await act(async () => {
      await result.current.switchToArbitrum('sepolia');
    });

    expect(mockRequest).toHaveBeenCalledWith({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x66eee',
        chainName: 'Arbitrum Sepolia',
        nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
        rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
        blockExplorerUrls: ['https://sepolia.arbiscan.io/'],
      }],
    });
  });

  it('should provide network info correctly', () => {
    const { result } = renderHook(() => useMetaMask());

    const networkInfo = result.current.getNetworkInfo();
    
    expect(networkInfo).toEqual({
      chainId: '0x66eee',
      name: 'Arbitrum Sepolia',
      isSupported: true,
    });
  });

  it('should handle disconnection', () => {
    const { result } = renderHook(() => useMetaMask());

    act(() => {
      result.current.disconnect();
    });

    // Should call the store's disconnect function
    // (This would be tested more thoroughly with actual store integration)
  });
});