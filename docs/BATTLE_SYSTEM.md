# Battle System Documentation

## Overview

The AlgoQuest battle system is a real-time, turn-based PvP combat system that allows players to battle their beasts against each other. The system supports two connection methods: room codes for remote battles and nearby connections for local battles.

## Architecture

### Core Components

1. **Room Code System** (`lib/roomCode.ts`)
   - Generates unique 6-character alphanumeric codes
   - Validates room code format
   - Ensures uniqueness in the database

2. **Battle Room Management** (`lib/battleRoom.ts`)
   - Creates battle rooms with room codes
   - Handles player joining logic
   - Manages room cleanup for stale rooms

3. **Battle State Management** (`lib/battleState.ts`)
   - Initializes battle state
   - Calculates damage with elemental effectiveness
   - Manages turn switching
   - Detects win conditions

4. **Real-time Synchronization** (`lib/battleSync.ts`, `lib/realtimeConnection.ts`)
   - Establishes WebSocket channels
   - Broadcasts moves to opponents
   - Handles state synchronization
   - Manages disconnections

5. **Battle Integration** (`lib/battleIntegration.ts`)
   - Coordinates all battle components
   - Provides high-level battle operations
   - Handles error scenarios

## Room Code System

### Generation Algorithm

Room codes are 6-character alphanumeric strings that exclude ambiguous characters:

```typescript
// Allowed characters: 23456789ABCDEFGHJKMNPQRSTUVWXYZ
// Excluded: 0, O, I, 1, L (to prevent confusion)
// Total possibilities: 32^6 = 1,073,741,824
```

### Usage

**Creating a Room:**
```typescript
import { generateRoomCode, isValidRoomCode } from '@/lib/roomCode';

const roomCode = generateRoomCode();
// Example: "A3B7K9"
```

**Validating a Room Code:**
```typescript
const isValid = isValidRoomCode("A3B7K9"); // true
const isInvalid = isValidRoomCode("O1IL00"); // false (contains excluded chars)
```

## Battle Flow

### 1. Room Creation

```typescript
import { createBattleRoom } from '@/lib/battleRoom';

const battle = await createBattleRoom({
  player1Id: userId,
  player1BeastId: beastId,
});

console.log(battle.room_code); // Share this with opponent
```

### 2. Joining a Room

```typescript
import { joinBattleRoom } from '@/lib/battleRoom';

const battle = await joinBattleRoom({
  roomCode: "A3B7K9",
  player2Id: userId,
  player2BeastId: beastId,
});
```

### 3. Battle Initialization

When both players join, the battle state is initialized:

```typescript
{
  status: 'active',
  current_turn: 'player1',
  turn_number: 1,
  turn_time_remaining: 30,
  battle_data: {
    moves: [],
    player1_beast_state: {
      health: 100,
      energy: 100
    },
    player2_beast_state: {
      health: 100,
      energy: 100
    }
  }
}
```

### 4. Real-time Synchronization

Both players subscribe to the battle channel:

```typescript
import { subscribeToBattle } from '@/lib/battleSync';

const channel = subscribeToBattle(battleId, (message) => {
  if (message.type === 'move') {
    // Update local state with opponent's move
    applyMove(message.payload);
  }
});
```

### 5. Making Moves

```typescript
import { executeMove } from '@/lib/battleState';

const result = await executeMove({
  battleId,
  playerId,
  ability: selectedAbility,
  attackerBeast: myBeast,
  defenderBeast: opponentBeast,
});

// Broadcast move to opponent
await broadcastMove(battleId, result);
```

### 6. Turn Management

Turns automatically switch after each move:

```typescript
// After player1 makes a move:
{
  current_turn: 'player2',
  turn_number: 2,
  turn_time_remaining: 30
}
```

If the timer expires without a move, the turn is automatically skipped.

### 7. Battle End

The battle ends when a beast's health reaches zero:

```typescript
{
  status: 'completed',
  winner_id: 'uuid-of-winner',
  ended_at: '2025-11-25T10:30:00Z'
}
```

## Combat Mechanics

### Damage Calculation

Damage is calculated using the following formula:

```typescript
baseDamage = ability.power * (attacker.attack / defender.defense)
elementalMultiplier = getElementalEffectiveness(attackerElement, defenderElement)
finalDamage = baseDamage * elementalMultiplier * criticalMultiplier
```

### Elemental Effectiveness

| Attacker → Defender | Multiplier |
|---------------------|------------|
| Fire → Water        | 0.5x       |
| Fire → Earth        | 2.0x       |
| Water → Fire        | 2.0x       |
| Water → Wind        | 0.5x       |
| Earth → Water       | 2.0x       |
| Earth → Wind        | 0.5x       |
| Wind → Earth        | 2.0x       |
| Wind → Fire         | 0.5x       |
| Same Element        | 1.0x       |
| Light ↔ Dark        | 1.5x       |

### Critical Hits

- 10% chance for critical hit
- Critical hits deal 1.5x damage
- Displayed with special animation

### Energy System

- Each beast starts with 100 energy
- Abilities cost energy (varies by ability)
- Energy regenerates by 20 per turn
- Cannot use abilities without sufficient energy

## Nearby Connections

### Discovery Flow

1. Request Bluetooth and location permissions
2. Start advertising with wallet address
3. Start discovery to find nearby devices
4. Display discovered players in UI

### Invitation Flow

```typescript
import NearbyConnections from 'expo-nearby-connections';

// Send invitation
await NearbyConnections.requestConnection(
  peerId,
  walletAddress,
  JSON.stringify({ roomCode, battleId, playerName })
);

// Receive invitation
NearbyConnections.onInvitationReceived((data) => {
  const { roomCode, battleId } = JSON.parse(data.payload);
  // Show accept/decline dialog
});
```

## Error Handling

### Network Errors

```typescript
try {
  await executeMove(...);
} catch (error) {
  if (error.message.includes('network')) {
    // Retry with exponential backoff
    await retryWithBackoff(() => executeMove(...));
  }
}
```

### Invalid Room Codes

```typescript
try {
  await joinBattleRoom({ roomCode: "INVALID" });
} catch (error) {
  // Display user-friendly error
  Alert.alert('Invalid Room Code', 'Please check the code and try again.');
}
```

### Disconnections

The system automatically handles disconnections:

1. Detect disconnection via WebSocket
2. Attempt reconnection (3 retries)
3. If reconnection fails, notify opponent
4. Battle can be resumed if player reconnects within 5 minutes

## Database Schema

### battles Table

```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_beast_id INTEGER REFERENCES beasts(id),
  player2_beast_id INTEGER REFERENCES beasts(id),
  winner_id UUID REFERENCES users(id),
  status VARCHAR(50) CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
  current_turn VARCHAR(20) CHECK (current_turn IN ('player1', 'player2')),
  turn_number INTEGER DEFAULT 1,
  turn_time_remaining INTEGER DEFAULT 30,
  room_code VARCHAR(6) UNIQUE,
  battle_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);
```

### Indexes

```sql
CREATE INDEX idx_battles_room_code ON battles(room_code);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_player1 ON battles(player1_id);
CREATE INDEX idx_battles_player2 ON battles(player2_id);
```

## Testing

### Unit Tests

```bash
npm test -- lib/__tests__/battleRoom.test.ts
npm test -- lib/__tests__/battleState.test.ts
npm test -- lib/__tests__/roomCode.test.ts
```

### Property-Based Tests

The battle system uses property-based testing to verify correctness:

- Room code uniqueness
- Damage calculation consistency
- Turn switching logic
- State synchronization

## Performance Considerations

### Optimizations

1. **Database Queries**: Indexed on frequently queried fields
2. **Real-time Messages**: Batched when possible
3. **State Updates**: Optimistic updates for local player
4. **Room Cleanup**: Automated cleanup of stale rooms (>10 minutes)

### Scalability

- WebSocket channels are lightweight
- Each battle is independent
- Database can handle thousands of concurrent battles
- Room codes provide 1+ billion unique combinations

## Security

### Validation

- All room codes validated before database queries
- Beast ownership verified before battle creation
- Turn validation prevents cheating
- Move validation ensures legal actions

### Data Protection

- Wallet addresses stored securely
- Battle data encrypted in transit
- No sensitive data in room codes

## Future Enhancements

- [ ] Spectator mode for battles
- [ ] Battle replays
- [ ] Tournament system
- [ ] Ranked matchmaking
- [ ] Battle statistics and analytics
- [ ] Custom battle rules
- [ ] Team battles (2v2, 3v3)

## Troubleshooting

### Battle Won't Start

1. Check both players have joined
2. Verify beasts are properly loaded
3. Check WebSocket connection status
4. Ensure database is accessible

### Moves Not Syncing

1. Check internet connection
2. Verify Supabase real-time is enabled
3. Check browser console for errors
4. Try refreshing the battle screen

### Room Code Not Working

1. Verify code format (6 characters, no 0/O/I/1/L)
2. Check room hasn't expired (>10 minutes)
3. Ensure room status is 'waiting'
4. Try generating a new room code

## Support

For issues or questions:
- Check the [main README](../README.md)
- Review [error handling docs](../lib/ERROR_HANDLING_README.md)
- Open an issue on GitHub
