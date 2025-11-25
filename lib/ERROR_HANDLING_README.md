# Error Handling and Fallbacks

This document describes the error handling implementation for the battle system refactor.

## Overview

The error handling system provides:
- **Network error detection and retry logic** (Requirement 10.1)
- **Beast data validation** (Requirement 10.2)
- **Invalid room code feedback** (Requirement 10.3)
- **Permission denial handling** (Requirement 10.4)
- **Real-time connection failure handling** (Requirement 10.5)

## Modules

### 1. errorHandling.ts

Core error handling utilities module.

#### Key Features

**AppError Class**
```typescript
class AppError extends Error {
  type: ErrorType;
  originalError?: Error;
  retryable: boolean;
}
```

Custom error class that categorizes errors and indicates if they're retryable.

**Retry with Backoff**
```typescript
retryWithBackoff<T>(
  fn: () => Promise<T>,
  config?: Partial<RetryConfig>
): Promise<T>
```

Automatically retries failed operations with exponential backoff. Useful for network errors.

**Beast Data Validation**
```typescript
validateBeastData(beast: any): { isValid: boolean; error?: string }
```

Validates beast data before battle initiation to prevent errors during gameplay.

**Room Code Validation**
```typescript
validateRoomCodeFormat(roomCode: string): { isValid: boolean; error?: string }
handleInvalidRoomCode(roomCode: string, onRetry?: () => void): void
```

Validates room code format and provides user-friendly error messages.

**Permission Handling**
```typescript
handlePermissionDenied(
  permission: PermissionType,
  onOpenSettings?: () => void
): void
```

Shows educational dialogs explaining why permissions are needed.

**Real-time Connection Handling**
```typescript
handleRealtimeConnectionFailure(
  onRetry?: () => void,
  onExit?: () => void
): void
```

Handles real-time connection failures with retry and exit options.

**Database Error Handling**
```typescript
handleDatabaseError(
  error: any,
  operation: string,
  onRetry?: () => void
): void

safeDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T>
```

Wraps database operations with automatic retry logic and user-friendly error messages.

### 2. realtimeConnection.ts

Manages Supabase real-time connections with automatic reconnection.

#### RealtimeConnectionManager

```typescript
class RealtimeConnectionManager {
  async connect(): Promise<RealtimeChannel>
  async disconnect(): Promise<void>
  getChannel(): RealtimeChannel | null
  isConnected(): boolean
}
```

**Features:**
- Automatic reconnection with exponential backoff
- Connection status tracking
- Max reconnection attempts with user notification
- Clean disconnection handling

**Usage Example:**
```typescript
const connectionManager = createRealtimeConnection({
  channelName: `battle:${battleId}`,
  onStatusChange: (status) => {
    console.log('Connection status:', status);
    setConnectionStatus(status);
  },
  onError: (error) => {
    console.error('Connection error:', error);
  },
  maxReconnectAttempts: 5,
  reconnectDelay: 3000,
});

const channel = await connectionManager.connect();

// Use channel for subscriptions
channel.on('broadcast', { event: 'move' }, (payload) => {
  // Handle move
});

// Clean up
await connectionManager.disconnect();
```

## Integration Examples

### Battle Room Creation with Error Handling

```typescript
const handleCreateBattleRoom = async () => {
  try {
    const battleRoom = await createBattleRoom({
      player1_id: userId,
      player1_beast_id: selectedBeast.id,
    });
    
    // Success handling
  } catch (error: any) {
    if (error instanceof AppError) {
      if (error.type === ErrorType.NETWORK) {
        handleDatabaseError(error, 'creating battle room', handleCreateBattleRoom);
      } else if (error.type === ErrorType.VALIDATION) {
        Alert.alert("Validation Error", error.message);
      } else {
        Alert.alert("Error", getUserFriendlyErrorMessage(error));
      }
    } else {
      Alert.alert("Error", getUserFriendlyErrorMessage(error));
    }
  }
};
```

### Room Code Joining with Validation

```typescript
const handleJoinBattleRoom = async () => {
  // Validate format first
  const formatValidation = validateRoomCodeFormat(joinRoomCode);
  if (!formatValidation.isValid) {
    Alert.alert("Invalid Code", formatValidation.error);
    return;
  }

  try {
    const battleRoom = await joinBattleRoom({
      room_code: joinRoomCode.toUpperCase(),
      player2_id: userId,
      player2_beast_id: selectedBeast.id,
    });
    
    // Success handling
  } catch (error: any) {
    if (error instanceof AppError && error.type === ErrorType.VALIDATION) {
      handleInvalidRoomCode(joinRoomCode, () => {
        setJoinRoomCode("");
      });
    } else {
      Alert.alert("Error", getUserFriendlyErrorMessage(error));
    }
  }
};
```

### Permission Handling

```typescript
const initializePermissions = async () => {
  const granted = await checkAndRequestPermissions();
  
  if (!granted) {
    handlePermissionDenied(
      PermissionType.BLUETOOTH,
      () => {
        // Open settings or show instructions
      }
    );
  }
};
```

## Error Types

```typescript
enum ErrorType {
  NETWORK = 'network',      // Network/connection errors
  VALIDATION = 'validation', // Data validation errors
  PERMISSION = 'permission', // Permission denied errors
  REALTIME = 'realtime',    // Real-time connection errors
  DATABASE = 'database',    // Database operation errors
  UNKNOWN = 'unknown',      // Unknown errors
}
```

## Best Practices

1. **Always validate input before operations**
   - Use `validateBeastData()` before battle operations
   - Use `validateRoomCodeFormat()` before joining rooms

2. **Wrap database operations with retry logic**
   - Use `safeDbOperation()` for all database calls
   - Use `retryWithBackoff()` for custom retry scenarios

3. **Provide user-friendly error messages**
   - Use `getUserFriendlyErrorMessage()` for generic errors
   - Use specific handlers like `handleInvalidRoomCode()` for known scenarios

4. **Handle permissions gracefully**
   - Use `handlePermissionDenied()` with educational messages
   - Provide clear instructions on how to grant permissions

5. **Manage real-time connections properly**
   - Use `RealtimeConnectionManager` for automatic reconnection
   - Handle connection status changes in UI
   - Clean up connections on component unmount

## Testing

To test error handling:

1. **Network Errors**: Disable network and attempt operations
2. **Invalid Data**: Try creating battles with invalid beast IDs
3. **Invalid Room Codes**: Try joining with wrong codes
4. **Permission Denial**: Deny permissions and verify dialogs
5. **Connection Failures**: Simulate connection drops during battles

## Requirements Coverage

- ✅ **10.1**: Network error handling with retry logic
- ✅ **10.2**: Beast data validation before battle initiation
- ✅ **10.3**: Invalid room code feedback
- ✅ **10.4**: Permission denial handling with educational dialogs
- ✅ **10.5**: Real-time connection failure handling
