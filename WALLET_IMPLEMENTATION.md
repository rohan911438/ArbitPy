# MetaMask Wallet Connection Implementation

This document describes the comprehensive MetaMask wallet connection implementation for ArbitPy with full Arbitrum compatibility.

## Features Implemented

### ✅ Core MetaMask Integration
- **MetaMask Detection**: Automatically detects if MetaMask is installed
- **Account Access**: Uses `eth_requestAccounts` to request user permission
- **Provider Initialization**: Creates ethers.js BrowserProvider and JsonRpcSigner
- **Session Persistence**: Maintains wallet state across browser refreshes

### ✅ Arbitrum Network Support
- **Network Switching**: Automatically switches to Arbitrum Sepolia or Mainnet
- **Network Addition**: Adds Arbitrum networks if not present using `wallet_addEthereumChain`
- **Network Detection**: Identifies current network and shows compatibility status
- **Dual Network Support**: Supports both Arbitrum Sepolia (testnet) and Mainnet

### ✅ Event Handling
- **Account Changes**: Listens for `accountsChanged` events
- **Network Changes**: Listens for `chainChanged` events  
- **Automatic Cleanup**: Properly removes event listeners on unmount
- **State Synchronization**: Updates all relevant state when accounts/networks change

### ✅ Error Handling
- **User Rejection**: Gracefully handles when users reject connection requests
- **Network Errors**: Handles network switching failures
- **Connection Failures**: Provides clear error messages for connection issues
- **Graceful Degradation**: App remains functional even if wallet connection fails

### ✅ UI Feedback
- **Connection Status**: Clear visual indicators for connection state
- **Network Status**: Shows current network and compatibility
- **Loading States**: Loading spinners during connection attempts
- **Error Display**: User-friendly error messages
- **Balance Display**: Shows ETH balance when connected

### ✅ State Management
- **Zustand Integration**: Uses Zustand store for state management
- **Provider Access**: Exposes ethers.js provider and signer for contract interaction
- **Network Information**: Tracks chain ID, network name, and support status
- **Balance Tracking**: Automatically fetches and updates wallet balance

## Architecture

### Files Structure
```
src/
├── hooks/
│   ├── useMetaMask.ts          # Main MetaMask hook
│   └── __tests__/
│       └── useMetaMask.test.ts # Unit tests
├── stores/
│   └── appStore.ts             # Enhanced app store with wallet state
├── components/
│   ├── wallet/
│   │   ├── WalletConnection.tsx # Comprehensive wallet UI component
│   │   └── WalletDemo.tsx      # Demo page showcasing features
│   └── layout/
│       └── Header.tsx          # Enhanced header with wallet integration
└── App.tsx                     # Router setup with wallet demo route
```

### State Structure
```typescript
interface WalletState {
  isConnected: boolean;
  isConnecting: boolean;
  connectedWallet: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: string | null;
  network: string | null;
  balance: string | null;
  error: string | null;
}
```

### Network Configuration
```typescript
const ARBITRUM_NETWORKS = {
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
};
```

## Usage

### Basic Connection
```typescript
import { useMetaMask } from '@/hooks/useMetaMask';

function MyComponent() {
  const { 
    isConnected, 
    connectedWallet, 
    provider, 
    signer, 
    connect, 
    disconnect 
  } = useMetaMask();

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Connected: {connectedWallet}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => connect('sepolia')}>
          Connect to Arbitrum Sepolia
        </button>
      )}
    </div>
  );
}
```

### Contract Interaction
```typescript
import { ethers } from 'ethers';

function ContractInteraction() {
  const { provider, signer, isConnected } = useMetaMask();

  const deployContract = async (bytecode: string, abi: any[]) => {
    if (!signer) throw new Error('Wallet not connected');
    
    const factory = new ethers.ContractFactory(abi, bytecode, signer);
    const contract = await factory.deploy();
    await contract.waitForDeployment();
    
    return contract;
  };

  const callContractFunction = async (contractAddress: string, abi: any[], functionName: string, args: any[]) => {
    if (!provider) throw new Error('Provider not available');
    
    const contract = new ethers.Contract(contractAddress, abi, provider);
    const result = await contract[functionName](...args);
    
    return result;
  };

  // ... rest of component
}
```

### Network Switching
```typescript
function NetworkManager() {
  const { 
    network, 
    isNetworkSupported, 
    switchToArbitrum, 
    chainId 
  } = useMetaMask();

  const handleNetworkSwitch = async () => {
    try {
      await switchToArbitrum('mainnet');
    } catch (error) {
      console.error('Failed to switch network:', error);
    }
  };

  return (
    <div>
      <p>Current Network: {network}</p>
      <p>Chain ID: {chainId}</p>
      <p>Supported: {isNetworkSupported() ? 'Yes' : 'No'}</p>
      
      {!isNetworkSupported() && (
        <button onClick={handleNetworkSwitch}>
          Switch to Arbitrum Mainnet
        </button>
      )}
    </div>
  );
}
```

## Error Handling

The implementation includes comprehensive error handling for common scenarios:

### User Rejection
```typescript
// User rejects connection request
{ code: 4001, message: "User rejected the request." }

// User rejects network switch
{ code: 4001, message: "User rejected the request." }
```

### Network Errors
```typescript
// Network not found (will trigger auto-add)
{ code: 4902, message: "Unrecognized chain ID." }

// General network error
{ code: -32002, message: "Request of type 'wallet_switchEthereumChain' already pending" }
```

### Connection Errors
```typescript
// MetaMask not installed
"MetaMask not detected"

// No accounts returned
"No accounts returned from MetaMask"

// Provider initialization failed
"Failed to initialize Web3 provider"
```

## Testing

Run the test suite:
```bash
npm run test src/hooks/__tests__/useMetaMask.test.ts
```

## Demo

Visit the wallet demo page at `/wallet-demo` to see all features in action:
- Connection flow
- Network switching
- Error handling
- State management
- UI components

## Security Considerations

1. **Never store private keys**: The implementation only handles wallet connection, not key management
2. **Validate user input**: Always validate contract addresses and function parameters
3. **Handle network changes**: Always verify the current network before performing transactions
4. **Error boundaries**: Implement React error boundaries around wallet components
5. **Rate limiting**: Implement rate limiting for blockchain calls to prevent abuse

## Browser Compatibility

- **Chrome**: Full support with MetaMask extension
- **Firefox**: Full support with MetaMask extension  
- **Safari**: Full support with MetaMask extension
- **Mobile**: Works with MetaMask mobile app in-app browser

## Dependencies

- `ethers`: ^6.16.0 - For Web3 provider and contract interaction
- `zustand`: ^4.5.2 - For state management
- `react`: ^18.3.1 - React hooks support
- `@types/react`: ^18.3.7 - TypeScript support

## Contributing

When contributing to the wallet implementation:

1. **Test thoroughly**: Test on different networks and with different wallet states
2. **Handle edge cases**: Consider scenarios like network switching mid-transaction
3. **Update documentation**: Keep this README updated with any changes
4. **Follow patterns**: Maintain consistency with the existing error handling and state management patterns
5. **Add tests**: Write unit tests for new functionality

## Roadmap

Future enhancements to consider:

- [ ] WalletConnect integration for mobile wallets
- [ ] Support for additional networks (Polygon, Optimism)
- [ ] Enhanced transaction monitoring
- [ ] Gas estimation and optimization
- [ ] Batch transaction support
- [ ] Hardware wallet support (Ledger, Trezor)

## Support

For issues with the wallet implementation:

1. Check the browser console for error messages
2. Verify MetaMask is installed and unlocked
3. Ensure you're on a supported network
4. Check the demo page for reference implementation
5. File an issue with detailed reproduction steps