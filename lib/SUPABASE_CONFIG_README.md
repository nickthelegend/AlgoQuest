# Supabase Configuration

This document describes the Supabase configuration for the AlgoQuest battle system.

## Overview

The Supabase client is configured with:
- Database connection to PostgreSQL
- Real-time WebSocket subscriptions for battle synchronization
- Secure storage for authentication tokens
- Custom headers for client identification

## Configuration Details

### Database Connection

The Supabase client connects to the database using:
- **URL**: Configured in `constants/keys.ts` as `SUPABASE_URL`
- **Anon Key**: Configured in `constants/keys.ts` as `SUPABASE_ANON_KEY`

### Real-time Configuration

Real-time subscriptions are configured with:
- **Events per second**: 10 (throttled to prevent overwhelming the client)
- **Auto-reconnection**: Handled by `RealtimeConnectionManager` in `lib/realtimeConnection.ts`

### Authentication

Authentication uses Expo SecureStore for secure token storage:
- **Auto-refresh**: Enabled
- **Persist session**: Enabled
- **Detect session in URL**: Disabled (not needed for mobile)

## Database Schema

The database includes the following tables:

### Users Table
- Stores user profile information and wallet addresses
- Primary key: `id` (UUID)
- Unique constraint: `wallet_address`
- Indexed: `wallet_address`

### Beasts Table
- Stores beast (creature) information owned by users
- Primary key: `id` (SERIAL)
- Foreign key: `owner_id` references `users(id)`
- Indexed: `owner_id`
- JSONB columns: `metadata`, `allocated_stats`

### Battles Table
- Stores battle information and real-time state
- Primary key: `id` (UUID)
- Foreign keys: `player1_id`, `player2_id`, `player1_beast_id`, `player2_beast_id`, `winner_id`
- Unique constraint: `room_code`
- Indexed: `room_code`, `status`, `player1_id`, `player2_id`
- JSONB column: `battle_data` (stores moves and beast states)

### Beast Abilities Table
- Stores predefined abilities that beasts can use in battle
- Primary key: `id` (SERIAL)
- Check constraints: `type`, `element`

## Testing the Configuration

### Automated Testing

Run the test suite to verify configuration:

```bash
npm test -- lib/__tests__/supabase.test.ts
```

Note: Tests may fail in CI/test environments due to network restrictions. This is expected.

### Manual Verification

Use the verification utilities in your app:

```typescript
import { verifySupabaseConfiguration, verifyDatabaseQueries, testRealtimeChannel } from './lib/verifySupabaseConfig';

// Comprehensive verification
const result = await verifySupabaseConfiguration();
console.log('Verification result:', result);

// Test specific queries
const queryResult = await verifyDatabaseQueries();
console.log('Query test result:', queryResult);

// Test real-time channel
const channelResult = await testRealtimeChannel('test-battle-room');
console.log('Channel test result:', channelResult);
```

### Quick Connection Test

Use the built-in test functions:

```typescript
import { testDatabaseConnection, testRealtimeSubscription, verifyDatabaseSchema } from './lib/supabase';

// Test database connection
const dbTest = await testDatabaseConnection();
console.log('Database connection:', dbTest);

// Test real-time subscriptions
const realtimeTest = await testRealtimeSubscription();
console.log('Real-time test:', realtimeTest);

// Verify schema
const schemaTest = await verifyDatabaseSchema();
console.log('Schema verification:', schemaTest);
```

## Real-time Subscriptions

### Creating a Channel

```typescript
import { supabase } from './lib/supabase';

const channel = supabase.channel('battle:123');
```

### Subscribing to Changes

```typescript
channel.subscribe((status) => {
  if (status === 'SUBSCRIBED') {
    console.log('Connected to real-time channel');
  }
});
```

### Broadcasting Messages

```typescript
channel.send({
  type: 'broadcast',
  event: 'move',
  payload: {
    ability: ability,
    damage: 50,
    // ... other move data
  },
});
```

### Receiving Messages

```typescript
channel.on('broadcast', { event: 'move' }, (payload) => {
  console.log('Received move:', payload);
  // Update battle state
});
```

### Unsubscribing

```typescript
await channel.unsubscribe();
```

## Error Handling

The configuration includes comprehensive error handling:

### Network Errors
- Automatic retry with exponential backoff
- Connection timeout handling
- Offline mode support

### Real-time Errors
- Automatic reconnection (up to 5 attempts)
- Channel error handling
- Subscription timeout handling

### Database Errors
- Query error handling
- Transaction rollback support
- Constraint violation handling

## Best Practices

1. **Always use the singleton instance**: Import `supabase` from `lib/supabase.ts`
2. **Handle errors gracefully**: Use try-catch blocks and check for errors in responses
3. **Use real-time for battle synchronization**: Don't poll the database
4. **Clean up subscriptions**: Always unsubscribe when components unmount
5. **Use transactions for complex operations**: Ensure data consistency
6. **Index frequently queried columns**: Already done in schema
7. **Use JSONB for flexible data**: `battle_data`, `metadata`, `allocated_stats`

## Troubleshooting

### Connection Issues

If you experience connection issues:

1. Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
2. Verify network connectivity
3. Check Supabase project status
4. Review error logs for specific error messages

### Real-time Issues

If real-time subscriptions aren't working:

1. Verify the channel name is correct
2. Check that the subscription callback is properly set up
3. Ensure the channel is subscribed before sending/receiving messages
4. Check for network issues or firewall restrictions
5. Use `RealtimeConnectionManager` for automatic reconnection

### Schema Issues

If queries fail due to schema issues:

1. Run `verifyDatabaseSchema()` to identify specific problems
2. Check that the schema has been applied to the database
3. Verify column names match the schema
4. Ensure foreign key relationships are correct

## Requirements Satisfied

This configuration satisfies the following requirements:

- **1.1**: Database schema with users, beasts, battles, and beast_abilities tables
- **1.2**: Proper indexes for performance optimization
- **1.3**: Real-time subscription configuration for battle synchronization

## Related Files

- `lib/supabase.ts` - Main Supabase client configuration
- `lib/realtimeConnection.ts` - Real-time connection management
- `lib/battleRoom.ts` - Battle room database operations
- `lib/battleState.ts` - Battle state database operations
- `constants/keys.ts` - Supabase URL and anon key
- `schema.sql` - Complete database schema
- `lib/verifySupabaseConfig.ts` - Configuration verification utilities
- `lib/__tests__/supabase.test.ts` - Automated tests
