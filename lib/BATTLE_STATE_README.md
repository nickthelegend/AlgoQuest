# Battle State Management System

This document describes the battle state management system implemented for the AlgoQuest battle system refactor.

## Overview

The battle state management system provides a complete solution for managing PVP battles, including:

- Battle initialization with proper initial state
- Damage calculation with elemental effectiveness
- Turn switching logic with timer reset
- Win condition detection
- Battle state persistence to database

## Requirements Addressed

- **Requirement 7.1**: Battle initialization with proper initial state
- **Requirement 7.2**: Damage calculation with elemental effectiveness
- **Requirement 7.3**: Turn switching logic with timer reset
- **Requirement 7.4**: Win condition detection (health <= 0)
- **Requirement 7.5**: Battle state persistence to database

## Core Modules

### 1. `battleState.ts`

The main battle state management module containing core battle logic.

#### Key Functions

##### `initializeBattleState(player1Beast, player2Beast)`

Initializes a new battle with proper initial state.

```typescript
const battleData = initializeBattleState(player1Beast, player2Beast);
// Returns:
// {
//   moves: [],
//   player1_beast_state: { health: maxHealth, energy: maxEnergy },
//   player2_beast_state: { health: maxHealth, energy: maxEnergy }
// }
```

##### `calculateDamage(params)`

Calculates damage with elemental effectiveness.

```typescript
const { damage, effectiveness } = calculateDamage({
  attackPower: 50,
  attackStat: 80,
  defenseStat: 60,
  attackerElement: 'fire',
  defenderElement: 'water',
  isCritical: false,
});
```

**Elemental Effectiveness Chart:**

| Attacker → Defender | Fire | Water | Earth | Wind | Light | Dark |
|---------------------|------|-------|-------|------|-------|------|
| Fire                | 0.5x | 0.5x  | 2.0x  | 1.5x | 1.0x  | 1.0x |
| Water               | 2.0x | 0.5x  | 0.5x  | 1.0x | 1.0x  | 1.0x |
| Earth               | 0.5x | 2.0x  | 0.5x  | 0.5x | 1.0x  | 1.0x |
| Wind                | 0.5x | 1.0x  | 2.0x  | 0.5x | 1.0x  | 1.0x |
| Light               | 1.0x | 1.0x  | 1.0x  | 1.0x | 0.5x  | 2.0x |
| Dark                | 1.0x | 1.0x  | 1.0x  | 1.0x | 2.0x  | 0.5x |

##### `executeMove(attacker, defender, ability)`

Executes a complete move including hit calculation, damage/healing, and energy management.

```typescript
const moveResult = executeMove(attackerBeast, defenderBeast, ability);
// Returns:
// {
//   damage?: number,
//   healing?: number,
//   energyRestore?: number,
//   isCritical: boolean,
//   effectiveness: number,
//   targetHealth: number,
//   targetEnergy: number,
//   attackerHealth: number,
//   attackerEnergy: number,
//   missed?: boolean
// }
```

##### `switchTurn(battleId, currentTurn, turnNumber)`

Switches turn to the other player and resets the timer to 30 seconds.

```typescript
await switchTurn(battleId, 'player1', 5);
// Updates database:
// - current_turn: 'player2'
// - turn_number: 6
// - turn_time_remaining: 30
```

##### `checkWinCondition(player1Health, player2Health)`

Checks if a win condition is met (health <= 0).

```typescript
const winner = checkWinCondition(player1Health, player2Health);
// Returns: 'player1' | 'player2' | null
```

##### `persistBattleState(battleId, battleData, winnerId?)`

Persists battle state to the database.

```typescript
await persistBattleState(battleId, battleData, winnerId);
// Updates battles table with current state
// If winnerId provided, marks battle as completed
```

##### `updateBattleStateAfterMove(battleId, playerId, isPlayer1, ability, moveResult, currentBattleData)`

Updates battle state after a move, including persistence and win condition check.

```typescript
const updatedBattleData = await updateBattleStateAfterMove(
  battleId,
  playerId,
  isPlayer1,
  ability,
  moveResult,
  currentBattleData
);
```

### 2. `battleIntegration.ts`

Helper functions for integrating battle state management with the UI.

#### Key Functions

##### `handleBattleMove(battleId, playerId, isPlayer1, attacker, defender, ability, currentBattleData)`

Complete move handler that executes move, updates state, checks win condition, and switches turn.

```typescript
const { battleData, winner, moveResult } = await handleBattleMove(
  battleId,
  playerId,
  isPlayer1,
  attackerBeast,
  defenderBeast,
  ability,
  currentBattleData
);

if (winner) {
  // Handle battle end
} else {
  // Continue battle
}
```

##### `loadBattleState(battleId)`

Loads complete battle state from database.

```typescript
const { battleData, currentTurn, turnNumber, turnTimeRemaining, status } = 
  await loadBattleState(battleId);
```

##### `handleTurnTimeout(battleId, currentTurn, turnNumber)`

Handles turn timeout by switching to the next player.

```typescript
await handleTurnTimeout(battleId, currentTurn, turnNumber);
```

##### `getPlayerBattleState(battleId, playerId)`

Gets battle state from a specific player's perspective.

```typescript
const { isMyTurn, myBeastState, opponentBeastState, isPlayer1 } = 
  await getPlayerBattleState(battleId, playerId);
```

## Usage Example

### In Battle Arena Component

```typescript
import { handleBattleMove } from '@/lib/battleIntegration';
import { Beast, BeastAbility } from '@/lib/battleState';

// When player makes a move
const handleAttack = async (ability: BeastAbility) => {
  if (!isMyTurn || !myBeast || !opponentBeast) return;

  try {
    const { battleData, winner, moveResult } = await handleBattleMove(
      battleId,
      currentUserId,
      isPlayer1,
      myBeast,
      opponentBeast,
      ability,
      currentBattleData
    );

    // Update local state
    setCurrentBattleData(battleData);

    // Apply visual effects
    applyMoveAnimation(moveResult);

    // Check for winner
    if (winner) {
      endBattle(winner);
    }
  } catch (error) {
    console.error('Move failed:', error);
  }
};
```

### In Real-time Sync

```typescript
import { loadBattleState } from '@/lib/battleIntegration';

// When receiving real-time update
const handleBattleUpdate = async (payload: any) => {
  const { battleData, currentTurn, turnNumber } = await loadBattleState(battleId);
  
  // Update UI with new state
  setCurrentBattleData(battleData);
  setCurrentTurn(currentTurn);
  setTurnNumber(turnNumber);
};
```

## Battle Flow

1. **Initialization**
   ```typescript
   const battleData = initializeBattleState(player1Beast, player2Beast);
   // Store in database when creating battle
   ```

2. **Player Makes Move**
   ```typescript
   const moveResult = executeMove(attacker, defender, ability);
   const updatedData = await updateBattleStateAfterMove(...);
   ```

3. **Check Win Condition**
   ```typescript
   const winner = checkWinCondition(player1Health, player2Health);
   if (winner) {
     await persistBattleState(battleId, battleData, winnerId);
   }
   ```

4. **Switch Turn**
   ```typescript
   if (!winner) {
     await switchTurn(battleId, currentTurn, turnNumber);
   }
   ```

5. **Persist State**
   ```typescript
   await persistBattleState(battleId, battleData);
   ```

## Testing

The battle state management system includes comprehensive unit tests covering:

- Battle initialization
- Damage calculation with all elemental combinations
- Critical hit mechanics
- Move execution (attack, heal, energy)
- Energy management
- Health boundaries (0 to max)
- Win condition detection
- Edge cases (missed attacks, insufficient energy, etc.)

Run tests with:
```bash
npx jest lib/__tests__/battleState.test.ts --no-watch
```

## Data Structures

### Beast
```typescript
interface Beast {
  id: number | string;
  name: string;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    magic?: number;
  };
}
```

### BeastAbility
```typescript
interface BeastAbility {
  id: string | number;
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'energy';
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  power: number;
  accuracy: number;
  energy_cost: number;
  cooldown: number;
  description: string;
}
```

### BattleData
```typescript
interface BattleData {
  moves: Array<Move>;
  player1_beast_state: BeastState;
  player2_beast_state: BeastState;
}
```

### BeastState
```typescript
interface BeastState {
  health: number;
  energy: number;
  status?: {
    type: 'burn' | 'freeze' | 'stun' | 'poison';
    duration: number;
  };
  buffs?: Array<{
    type: 'attack' | 'defense' | 'speed';
    value: number;
    duration: number;
  }>;
}
```

## Database Schema

The battle state is stored in the `battles` table:

```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  player1_beast_id INTEGER REFERENCES beasts(id),
  player2_beast_id INTEGER REFERENCES beasts(id),
  winner_id UUID REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'waiting',
  current_turn VARCHAR(20),
  turn_number INTEGER DEFAULT 1,
  turn_time_remaining INTEGER DEFAULT 30,
  room_code VARCHAR(6) UNIQUE,
  battle_data JSONB DEFAULT '{"moves": [], "player1_beast_state": {}, "player2_beast_state": {}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);
```

## Performance Considerations

- All calculations are performed locally before database updates
- Database updates are batched when possible
- Real-time synchronization uses WebSocket channels for low latency
- Battle state is cached locally to reduce database queries
- Turn timer is managed client-side with periodic sync

## Error Handling

The system includes comprehensive error handling for:

- Insufficient energy for abilities
- Invalid battle states
- Database connection failures
- Real-time synchronization issues
- Invalid move attempts

All errors are thrown with descriptive messages for easy debugging.
