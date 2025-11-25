# PeraWallet Integration Guide

## Overview

AlgoQuest integrates with PeraWallet to allow users to connect their existing Algorand wallets to the app. This provides a seamless experience for users who already have ALGO and want to use their established wallet instead of creating a new one.

## What is PeraWallet?

PeraWallet is a secure, open-source Algorand wallet that supports:
- Algorand Standard Assets (ASAs)
- NFT management
- DeFi applications
- Transaction signing
- Multi-account support

## Prerequisites

### For Users

1. **Install PeraWallet**
   - iOS: [App Store](https://apps.apple.com/app/pera-algo-wallet/id1459898525)
   - Android: [Google Play](https://play.google.com/store/apps/details?id=com.algorand.android)

2. **Create or Import Wallet**
   - Open PeraWallet app
   - Create a new wallet or import existing one
   - Secure your recovery phrase

3. **Fund Your Wallet** (Optional)
   - Get ALGO from an exchange
   - Or use [TestNet Faucet](https://bank.testnet.algorand.network/) for testing

### For Developers

1. **Install Dependencies**
   ```bash
   npm install @perawallet/connect
   ```

2. **Configure Network**
   - MainNet: Chain ID 416001
   - TestNet: Chain ID 416002

## Integration Architecture

### Components

```
┌─────────────────────────────────────────┐
│         AlgoQuest App                    │
│                                          │
│  ┌────────────────────────────────┐    │
│  │  Create Wallet Screen          │    │
│  │  - New Wallet Button           │    │
│  │  - Connect PeraWallet Button   │    │
│  └────────────────────────────────┘    │
│              │                           │
│              ▼                           │
│  ┌────────────────────────────────┐    │
│  │  lib/peraWallet.ts             │    │
│  │  - Initialize PeraWallet       │    │
│  │  - Connect/Disconnect          │    │
│  │  - Sign Transactions           │    │
│  └────────────────────────────────┘    │
│              │                           │
└──────────────┼───────────────────────────┘
               │
               ▼
    ┌──────────────────────┐
    │   PeraWallet App     │
    │   - Approve/Reject   │
    │   - Sign Txns        │
    └──────────────────────┘
```

## Implementation

### 1. Initialize PeraWallet

```typescript
// lib/peraWallet.ts
import { PeraWalletConnect } from '@perawallet/connect';

const peraWallet = new PeraWalletConnect({
  chainId: 416001, // MainNet
  shouldShowSignTxnToast: true,
});

export default peraWallet;
```

### 2. Connect Wallet

```typescript
import peraWallet from '@/lib/peraWallet';
import * as SecureStore from 'expo-secure-store';

async function connectPeraWallet() {
  try {
    // Request connection
    const accounts = await peraWallet.connect();
    
    // Get first account address
    const walletAddress = accounts[0];
    
    // Store wallet address securely
    await SecureStore.setItemAsync('walletAddress', walletAddress);
    await SecureStore.setItemAsync('walletType', 'pera');
    
    // Create/update user profile
    await createOrUpdateUser(walletAddress);
    
    return walletAddress;
  } catch (error) {
    console.error('PeraWallet connection failed:', error);
    throw error;
  }
}
```

### 3. Disconnect Wallet

```typescript
async function disconnectPeraWallet() {
  try {
    await peraWallet.disconnect();
    await SecureStore.deleteItemAsync('walletAddress');
    await SecureStore.deleteItemAsync('walletType');
  } catch (error) {
    console.error('Disconnect failed:', error);
  }
}
```

### 4. Sign Transactions

```typescript
import algosdk from 'algosdk';

async function signTransaction(txn: algosdk.Transaction) {
  try {
    const walletAddress = await SecureStore.getItemAsync('walletAddress');
    
    if (!walletAddress) {
      throw new Error('No wallet connected');
    }
    
    // Sign transaction with PeraWallet
    const signedTxn = await peraWallet.signTransaction([
      [{ txn, signers: [walletAddress] }]
    ]);
    
    return signedTxn;
  } catch (error) {
    console.error('Transaction signing failed:', error);
    throw error;
  }
}
```

## User Flow

### Connection Flow

1. **User Opens App**
   - Sees "Create Wallet" screen
   - Two options: "Create New Wallet" or "Connect PeraWallet"

2. **User Taps "Connect PeraWallet"**
   - App initializes PeraWallet connection
   - PeraWallet app opens (or QR code displays on web)

3. **User Approves in PeraWallet**
   - Reviews connection request
   - Taps "Connect" in PeraWallet app

4. **Connection Established**
   - Wallet address returned to AlgoQuest
   - Address stored securely
   - User profile created/updated
   - User redirected to main app

### Transaction Flow

1. **User Initiates Transaction**
   - Example: Minting a beast NFT
   - App creates unsigned transaction

2. **App Requests Signature**
   - Transaction sent to PeraWallet
   - PeraWallet app opens

3. **User Reviews Transaction**
   - Sees transaction details
   - Fee, recipient, amount, etc.

4. **User Approves/Rejects**
   - If approved: Transaction signed and returned
   - If rejected: Error returned to app

5. **App Submits Transaction**
   - Signed transaction sent to Algorand network
   - User sees confirmation

## UI Components

### Connect Button

```typescript
import { TouchableOpacity, Text } from 'react-native';
import peraWallet from '@/lib/peraWallet';

function ConnectPeraWalletButton() {
  const [connecting, setConnecting] = useState(false);
  
  const handleConnect = async () => {
    setConnecting(true);
    try {
      const address = await connectPeraWallet();
      Alert.alert('Success', `Connected: ${address.slice(0, 8)}...`);
      // Navigate to main app
    } catch (error) {
      Alert.alert('Error', 'Failed to connect PeraWallet');
    } finally {
      setConnecting(false);
    }
  };
  
  return (
    <TouchableOpacity onPress={handleConnect} disabled={connecting}>
      <Text>{connecting ? 'Connecting...' : 'Connect PeraWallet'}</Text>
    </TouchableOpacity>
  );
}
```

### Wallet Display

```typescript
function WalletDisplay() {
  const [address, setAddress] = useState<string | null>(null);
  
  useEffect(() => {
    SecureStore.getItemAsync('walletAddress').then(setAddress);
  }, []);
  
  if (!address) return null;
  
  return (
    <View>
      <Text>Connected Wallet:</Text>
      <Text>{address.slice(0, 8)}...{address.slice(-8)}</Text>
    </View>
  );
}
```

## Configuration

### Network Selection

```typescript
// MainNet (Production)
const peraWallet = new PeraWalletConnect({
  chainId: 416001,
});

// TestNet (Development)
const peraWallet = new PeraWalletConnect({
  chainId: 416002,
});
```

### Custom Options

```typescript
const peraWallet = new PeraWalletConnect({
  chainId: 416001,
  shouldShowSignTxnToast: true, // Show toast on sign
  compactMode: false, // Use full modal
});
```

## Error Handling

### Connection Errors

```typescript
try {
  await peraWallet.connect();
} catch (error) {
  if (error.message.includes('User rejected')) {
    Alert.alert('Cancelled', 'Connection was cancelled');
  } else if (error.message.includes('timeout')) {
    Alert.alert('Timeout', 'Connection timed out. Please try again.');
  } else {
    Alert.alert('Error', 'Failed to connect. Please try again.');
  }
}
```

### Transaction Errors

```typescript
try {
  await peraWallet.signTransaction([...]);
} catch (error) {
  if (error.message.includes('rejected')) {
    Alert.alert('Cancelled', 'Transaction was rejected');
  } else if (error.message.includes('insufficient')) {
    Alert.alert('Insufficient Funds', 'Not enough ALGO for transaction');
  } else {
    Alert.alert('Error', 'Transaction failed');
  }
}
```

## Security Best Practices

### 1. Secure Storage

Always use SecureStore for wallet addresses:

```typescript
// ✅ Good
await SecureStore.setItemAsync('walletAddress', address);

// ❌ Bad
await AsyncStorage.setItem('walletAddress', address);
```

### 2. Validate Addresses

```typescript
import algosdk from 'algosdk';

function isValidAddress(address: string): boolean {
  return algosdk.isValidAddress(address);
}
```

### 3. Never Store Private Keys

PeraWallet handles all private key operations. Never request or store private keys in your app.

### 4. Verify Transactions

Always show transaction details to users before signing:

```typescript
function TransactionPreview({ txn }) {
  return (
    <View>
      <Text>To: {txn.to}</Text>
      <Text>Amount: {txn.amount / 1000000} ALGO</Text>
      <Text>Fee: {txn.fee / 1000000} ALGO</Text>
    </View>
  );
}
```

## Testing

### TestNet Setup

1. **Switch to TestNet**
   ```typescript
   const peraWallet = new PeraWalletConnect({
     chainId: 416002, // TestNet
   });
   ```

2. **Get TestNet ALGO**
   - Visit [TestNet Faucet](https://bank.testnet.algorand.network/)
   - Enter your wallet address
   - Receive free TestNet ALGO

3. **Test Transactions**
   - All transactions are free on TestNet
   - No real value at risk

### Unit Tests

```typescript
import peraWallet from '@/lib/peraWallet';

describe('PeraWallet Integration', () => {
  it('should initialize correctly', () => {
    expect(peraWallet).toBeDefined();
  });
  
  it('should handle connection', async () => {
    const accounts = await peraWallet.connect();
    expect(accounts).toHaveLength(1);
    expect(accounts[0]).toMatch(/^[A-Z2-7]{58}$/);
  });
});
```

## Troubleshooting

### PeraWallet App Not Opening

**Problem**: Tapping "Connect PeraWallet" doesn't open the app

**Solutions**:
1. Ensure PeraWallet app is installed
2. Check deep linking is configured
3. Try using QR code method instead
4. Restart both apps

### Connection Timeout

**Problem**: Connection request times out

**Solutions**:
1. Check internet connection
2. Ensure PeraWallet app is updated
3. Try disconnecting and reconnecting
4. Clear app cache

### Wrong Network

**Problem**: Connected to wrong network (MainNet vs TestNet)

**Solutions**:
1. Check `chainId` in configuration
2. Disconnect and reconnect
3. Verify network in PeraWallet app settings

### Transaction Fails

**Problem**: Transaction signing fails

**Solutions**:
1. Check wallet has sufficient ALGO
2. Verify transaction parameters
3. Ensure wallet is still connected
4. Check network status

## Advanced Features

### Multi-Account Support

```typescript
async function connectMultipleAccounts() {
  const accounts = await peraWallet.connect();
  // Returns array of all connected accounts
  return accounts;
}
```

### Account Change Detection

```typescript
peraWallet.connector?.on('disconnect', () => {
  console.log('Wallet disconnected');
  // Handle disconnection
});
```

### Custom Transaction Types

```typescript
// Asset transfer
const assetTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
  from: walletAddress,
  to: recipientAddress,
  assetIndex: assetId,
  amount: 1,
  suggestedParams,
});

// Sign with PeraWallet
const signedTxn = await peraWallet.signTransaction([[{ txn: assetTxn }]]);
```

## Resources

### Official Documentation

- [PeraWallet Docs](https://docs.perawallet.app/)
- [Algorand Developer Portal](https://developer.algorand.org/)
- [algosdk Documentation](https://algorand.github.io/js-algorand-sdk/)

### Example Code

- [PeraWallet Examples](https://github.com/perawallet/connect-examples)
- [Algorand dApp Examples](https://github.com/algorand/docs/tree/master/examples)

### Support

- [PeraWallet Discord](https://discord.gg/perawallet)
- [Algorand Discord](https://discord.gg/algorand)
- [GitHub Issues](https://github.com/perawallet/connect/issues)

## Migration Guide

### From Built-in Wallet to PeraWallet

If users want to switch from the built-in wallet to PeraWallet:

1. **Export Mnemonic** from built-in wallet
2. **Import to PeraWallet** using the mnemonic
3. **Connect PeraWallet** in AlgoQuest
4. All assets and history preserved

### From PeraWallet to Built-in Wallet

Not recommended, but possible:

1. **Export Mnemonic** from PeraWallet
2. **Import to AlgoQuest** built-in wallet
3. Note: Less secure than PeraWallet

## Best Practices Summary

✅ **Do:**
- Use SecureStore for wallet addresses
- Validate all addresses
- Show transaction details before signing
- Handle errors gracefully
- Test on TestNet first
- Keep PeraWallet SDK updated

❌ **Don't:**
- Store private keys
- Skip transaction validation
- Ignore error handling
- Use AsyncStorage for sensitive data
- Hardcode wallet addresses
- Skip user confirmations

## Conclusion

PeraWallet integration provides a secure, user-friendly way for AlgoQuest users to connect their existing Algorand wallets. By following this guide, you can implement a robust wallet connection system that enhances the user experience while maintaining security best practices.
