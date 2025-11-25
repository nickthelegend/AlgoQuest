# Design Document

## Overview

This design document outlines the architecture and implementation strategy for refactoring the AlgoQuest battle system. The refactoring removes quest functionality, implements battle room codes for matchmaking, integrates real-time WebSocket communication for battles, adds PeraWallet support, and recreates the database schema.

The system will support two primary battle connection methods:
1. **Room Code Matching**: Players create or join battles using 6-character alphanumeric codes
2. **Nearby Connections**: Players discover and connect with physically nearby opponents via Bluetooth/WiFi

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Mobile Application                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Find Players │  │ Battle Lobby │  │ Battle Arena │      │
│  │   Screen     │──│    Screen    │──│    Screen    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│         │                  │                  │              │
│         └──────────────────┴──────────────────┘              │
│                            │                                 │
│         ┌──────────────────┴──────────────────┐             │
│         │                                      │             │
│  ┌──────▼──────┐                    ┌─────────▼────────┐   │
│  │   Nearby    │                    │   Supabase       │   │
│  │ Connections │                    │   Client         │   │
│  │   Module    │                    │   (WebSocket)    │   │
│  └─────────────┘                    └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                              │
                                              │
                                    ┌─────────▼──────────┐
                                    │   Supabase Cloud   │
                                    │                    │
                                    │  ┌──────────────┐  │
                                    │  │  PostgreSQL  │  │
                                    │  │   Database   │  │
                                    │  └──────────────┘  │
                                    │  ┌──────────────┐  │
                                    │  │  Real-time   │  │
                                    │  │   Channels   │  │
                                    │  └──────────────┘  │
                                    └────────────────────┘
```

### Component Architecture

The application follows a modular architecture with clear separation of concerns:


**Presentation Layer**
- Find Players Screen: Discovery and matchmaking interface
- Battle Lobby Screen: Waiting room for opponent connection
- Battle Arena Screen: Real-time battle gameplay interface
- Create Wallet Screen: Wallet creation and PeraWallet connection

**Business Logic Layer**
- Battle Manager: Handles battle creation, joining, and state management
- Real-time Sync Manager: Manages WebSocket connections and message broadcasting
- Nearby Connections Manager: Handles device discovery and peer-to-peer communication
- Wallet Manager: Manages wallet creation and PeraWallet integration

**Data Layer**
- Supabase Client: Database operations and real-time subscriptions
- Secure Storage: Local encrypted storage for sensitive data (mnemonic, keys)
- Battle State Cache: Local cache for battle state to handle disconnections

## Components and Interfaces

### 1. Database Schema

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  email VARCHAR(255),
  roll_number VARCHAR(100),
  branch VARCHAR(100),
  gender VARCHAR(20),
  interests TEXT[],
  avatar_url TEXT,
  avatar_prompt TEXT,
  profile_created BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_wallet ON users(wallet_address);
```

#### Beasts Table
```sql
CREATE TABLE beasts (
  id SERIAL PRIMARY KEY,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  power INTEGER DEFAULT 0,
  element VARCHAR(50),
  image_url TEXT,
  metadata JSONB,
  allocated_stats JSONB DEFAULT '{"attack": 50, "defense": 50, "speed": 50, "health": 50}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beasts_owner ON beasts(owner_id);
```


#### Battles Table
```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player1_id UUID REFERENCES users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES users(id) ON DELETE SET NULL,
  player1_beast_id INTEGER REFERENCES beasts(id) ON DELETE CASCADE,
  player2_beast_id INTEGER REFERENCES beasts(id) ON DELETE SET NULL,
  winner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'completed', 'abandoned')),
  current_turn VARCHAR(20) CHECK (current_turn IN ('player1', 'player2')),
  turn_number INTEGER DEFAULT 1,
  turn_time_remaining INTEGER DEFAULT 30,
  room_code VARCHAR(6) UNIQUE,
  battle_data JSONB DEFAULT '{"moves": [], "player1_beast_state": {}, "player2_beast_state": {}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_battles_room_code ON battles(room_code);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battles_player1 ON battles(player1_id);
CREATE INDEX idx_battles_player2 ON battles(player2_id);
```

#### Beast Abilities Table
```sql
CREATE TABLE beast_abilities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) CHECK (type IN ('attack', 'heal', 'buff', 'debuff', 'energy')),
  element VARCHAR(50) CHECK (element IN ('fire', 'water', 'earth', 'wind', 'light', 'dark')),
  power INTEGER DEFAULT 0,
  accuracy INTEGER DEFAULT 100,
  energy_cost INTEGER DEFAULT 0,
  cooldown INTEGER DEFAULT 0,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Room Code Generation

The room code system generates unique, user-friendly codes for battle rooms:

**Algorithm:**
- Generate 6 random alphanumeric characters (uppercase letters and numbers)
- Exclude ambiguous characters (0, O, I, 1, L) to prevent confusion
- Check for uniqueness in the database
- Retry if collision occurs (extremely rare with 36^6 possibilities)

**Implementation:**
```typescript
function generateRoomCode(): string {
  const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'; // Excludes 0,O,I,1,L
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
```


### 3. Real-time Battle Synchronization

The battle system uses Supabase real-time channels for WebSocket communication:

**Channel Structure:**
- Each battle has a unique channel: `battle:{battleId}`
- Players subscribe to their battle's channel
- All game state changes are broadcast through the channel

**Message Types:**
```typescript
interface BattleMessage {
  type: 'move' | 'state_update' | 'player_joined' | 'player_left' | 'battle_end';
  payload: any;
  timestamp: number;
  sender_id: string;
}

interface MoveMessage {
  type: 'move';
  payload: {
    ability: BeastAbility;
    damage?: number;
    healing?: number;
    energyRestore?: number;
    isCritical?: boolean;
    effectiveness?: number;
    targetHealth: number;
    targetEnergy: number;
    attackerHealth: number;
    attackerEnergy: number;
  };
}
```

**Synchronization Flow:**
1. Player makes a move
2. Calculate damage/effects locally
3. Update local state immediately (optimistic update)
4. Broadcast move to opponent via WebSocket
5. Persist state to database
6. Opponent receives move and applies to their local state
7. Both clients remain synchronized

### 4. Nearby Connections Integration

Expo Nearby Connections enables local device discovery:

**Discovery Flow:**
1. Request Bluetooth and location permissions
2. Start advertising with wallet address as service ID
3. Start discovery to find nearby devices
4. Display discovered players in UI
5. Send battle invitation with room code as payload

**Connection Protocol:**
```typescript
// Advertise presence
const peerId = await NearbyConnections.startAdvertise(walletAddress);

// Discover nearby players
await NearbyConnections.startDiscovery(serviceId);

// Send battle invitation
await NearbyConnections.requestConnection(
  peerId,
  walletAddress,
  JSON.stringify({ roomCode, battleId, playerName })
);

// Handle invitation
NearbyConnections.onInvitationReceived((data) => {
  const { roomCode, battleId } = JSON.parse(data.payload);
  // Show accept/decline dialog
});
```


### 5. PeraWallet Integration

PeraWallet provides a secure way to connect existing Algorand wallets:

**Integration Architecture:**
```typescript
import { PeraWalletConnect } from '@perawallet/connect';

const peraWallet = new PeraWalletConnect({
  chainId: 416001, // Algorand MainNet
  shouldShowSignTxnToast: true,
});

// Connect wallet
async function connectPeraWallet() {
  try {
    const accounts = await peraWallet.connect();
    const walletAddress = accounts[0];
    
    // Store wallet address
    await SecureStore.setItemAsync('walletAddress', walletAddress);
    await SecureStore.setItemAsync('walletType', 'pera');
    
    // Create/update user in database
    await createOrUpdateUser(walletAddress);
    
    return walletAddress;
  } catch (error) {
    console.error('PeraWallet connection failed:', error);
    throw error;
  }
}

// Disconnect wallet
async function disconnectPeraWallet() {
  await peraWallet.disconnect();
  await SecureStore.deleteItemAsync('walletAddress');
  await SecureStore.deleteItemAsync('walletType');
}
```

**User Flow:**
1. User taps "Connect with PeraWallet" button
2. PeraWallet app opens (or QR code displayed)
3. User approves connection in PeraWallet
4. Wallet address returned to app
5. User profile created/updated in database
6. User redirected to main app

### 6. Battle State Management

Battle state is managed both locally and in the database:

**Local State (React State):**
```typescript
interface BattleState {
  battleId: string;
  myBeast: Beast;
  opponentBeast: Beast;
  currentTurn: 'player1' | 'player2';
  turnNumber: number;
  turnTimeRemaining: number;
  battleLogs: BattleLog[];
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isMyTurn: boolean;
}
```

**Database State (battles.battle_data):**
```typescript
interface BattleData {
  moves: Move[];
  player1_beast_state: {
    health: number;
    energy: number;
    status?: StatusEffect;
    buffs?: Buff[];
  };
  player2_beast_state: {
    health: number;
    energy: number;
    status?: StatusEffect;
    buffs?: Buff[];
  };
}
```

**State Synchronization Strategy:**
- Optimistic updates for local player actions
- Database as source of truth for conflict resolution
- Real-time channels for immediate opponent updates
- Periodic state reconciliation to handle edge cases


## Data Models

### TypeScript Interfaces

```typescript
interface User {
  id: string;
  wallet_address: string;
  full_name?: string;
  email?: string;
  roll_number?: string;
  branch?: string;
  gender?: 'male' | 'female';
  interests?: string[];
  avatar_url?: string;
  avatar_prompt?: string;
  profile_created: boolean;
  created_at: string;
  updated_at: string;
}

interface Beast {
  id: number;
  owner_id: string;
  name: string;
  power: number;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  image_url: string;
  metadata: {
    tier: number;
    abilities: number[];
    description?: string;
  };
  allocated_stats: {
    attack: number;
    defense: number;
    speed: number;
    health: number;
  };
  // Runtime battle properties
  health?: number;
  maxHealth?: number;
  energy?: number;
  maxEnergy?: number;
  abilities?: BeastAbility[];
  created_at: string;
}

interface BeastAbility {
  id: number;
  name: string;
  type: 'attack' | 'heal' | 'buff' | 'debuff' | 'energy';
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  power: number;
  accuracy: number;
  energy_cost: number;
  cooldown: number;
  description: string;
  metadata?: any;
}

interface Battle {
  id: string;
  player1_id: string;
  player2_id?: string;
  player1_beast_id: number;
  player2_beast_id?: number;
  winner_id?: string;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  current_turn: 'player1' | 'player2';
  turn_number: number;
  turn_time_remaining: number;
  room_code?: string;
  battle_data: {
    moves: Move[];
    player1_beast_state?: BeastState;
    player2_beast_state?: BeastState;
  };
  created_at: string;
  updated_at: string;
  ended_at?: string;
}

interface Move {
  id: string;
  player_id: string;
  ability: BeastAbility;
  damage?: number;
  healing?: number;
  energyRestore?: number;
  isCritical?: boolean;
  effectiveness?: number;
  targetHealth: number;
  targetEnergy: number;
  attackerHealth: number;
  attackerEnergy: number;
  timestamp: number;
}

interface BeastState {
  health: number;
  energy: number;
  status?: StatusEffect;
  buffs?: Buff[];
}

interface StatusEffect {
  type: 'burn' | 'freeze' | 'stun' | 'poison';
  duration: number;
}

interface Buff {
  type: 'attack' | 'defense' | 'speed';
  value: number;
  duration: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Room Code Uniqueness
*For any* battle room creation, the generated room code should be unique and not exist in any active or waiting battle rooms in the database.
**Validates: Requirements 3.1**

### Property 2: Room Code Join Success
*For any* valid room code that exists in the database with status 'waiting', a player should be able to successfully join the battle room and the battle status should transition to 'active'.
**Validates: Requirements 3.2**

### Property 3: Invalid Room Code Error Handling
*For any* room code that does not exist in the database or belongs to a completed/abandoned battle, the join attempt should fail with a clear error message.
**Validates: Requirements 3.3**

### Property 4: Room Code Cleanup
*For any* battle room with status 'waiting' that was created more than 10 minutes ago, the cleanup function should remove it from the database.
**Validates: Requirements 3.5**

### Property 5: Beast Selection Persistence
*For any* beast selected by a player, the selection should be stored in local state and displayed in the UI, and should persist across screen navigations within the same session.
**Validates: Requirements 4.5**

### Property 6: Nearby Player Discovery Display
*For any* player discovered via Expo Nearby Connections, their information should appear in the nearby players list within the UI.
**Validates: Requirements 5.3**

### Property 7: Battle Challenge Transmission
*For any* battle challenge sent via nearby connections, the transmitted data should include the room code, battle ID, and player information.
**Validates: Requirements 5.4**

### Property 8: Battle Invitation Notification
*For any* battle invitation received, a notification should be displayed to the user with accept and decline options.
**Validates: Requirements 5.5**


### Property 9: Move Broadcasting
*For any* move made by a player during an active battle, the move data should be broadcast to the opponent via the real-time WebSocket channel.
**Validates: Requirements 6.2**

### Property 10: Move Reception and State Update
*For any* move received from an opponent via the real-time channel, the local battle state should be updated immediately to reflect the move's effects.
**Validates: Requirements 6.3**

### Property 11: Battle State Synchronization
*For any* battle state change (health, energy, turn order, move history), both clients should have synchronized state within a reasonable time window (< 500ms).
**Validates: Requirements 6.4**

### Property 12: Battle Initialization
*For any* newly created battle, the battle_data field should be initialized with an empty moves array and initial beast states containing full health and energy.
**Validates: Requirements 7.1**

### Property 13: Move Execution Correctness
*For any* move executed during battle, the damage calculation should consider attack power, defense, elemental effectiveness, and critical hit chance, and the resulting health and energy values should be mathematically correct.
**Validates: Requirements 7.2**

### Property 14: Turn Switching
*For any* completed turn in a battle, the current_turn field should switch to the other player and the turn timer should reset to 30 seconds.
**Validates: Requirements 7.3**

### Property 15: Win Condition Detection
*For any* battle where a beast's health reaches zero or below, the system should immediately declare the owner of the other beast as the winner and set the battle status to 'completed'.
**Validates: Requirements 7.4**

### Property 16: Battle State Persistence
*For any* battle state update, the changes should be persisted to the database within 1 second to ensure recovery capability.
**Validates: Requirements 7.5**

### Property 17: PeraWallet Connection Success
*For any* successful PeraWallet connection, the wallet address should be retrieved and stored securely in SecureStore.
**Validates: Requirements 8.4**

### Property 18: User Profile Creation on Wallet Connection
*For any* successful wallet connection (either new wallet or PeraWallet), a user profile should be created or updated in the database with the wallet address.
**Validates: Requirements 8.5**


### Property 19: Battle Arena UI Updates
*For any* opponent move received during battle, the battle arena UI should update to show the attack animation and reflect the new health/energy values.
**Validates: Requirements 9.2**

### Property 20: Turn Control Enablement
*For any* turn transition where it becomes the current player's turn, the ability buttons should be enabled and the turn timer should start counting down.
**Validates: Requirements 9.3**

### Property 21: Turn Timer Expiration
*For any* turn where the timer reaches zero without a move being made, the turn should automatically skip and switch to the opponent.
**Validates: Requirements 9.4**

### Property 22: Invalid Room Code Feedback
*For any* invalid room code entered by a user, the system should provide clear error feedback and allow the user to attempt joining again.
**Validates: Requirements 10.3**

### Property 23: Battle Room Display Completeness
*For any* battle room displayed in the UI, the room code, player names (if available), and beast information should all be present and visible.
**Validates: Requirements 11.2**

### Property 24: Battle UI Element Presence
*For any* active battle, the UI should display health bars, energy bars, turn indicators, and be capable of showing move animations.
**Validates: Requirements 11.3**

### Property 25: Loading State Indicators
*For any* loading state in the application (data fetching, battle initialization, etc.), an appropriate loading indicator should be displayed to the user.
**Validates: Requirements 11.4**

### Property 26: Action Button Availability
*For any* screen requiring user action, clear call-to-action buttons should be present and enabled when appropriate.
**Validates: Requirements 11.5**

## Error Handling

### Network Errors
- **Connection Loss**: Implement exponential backoff retry strategy
- **Timeout Handling**: 30-second timeout for database operations, 10-second timeout for real-time messages
- **Offline Mode**: Cache battle state locally and sync when connection restored

### Data Validation Errors
- **Invalid Beast Data**: Prevent battle initiation if beast data is incomplete
- **Invalid Move Data**: Reject moves that don't meet energy requirements or cooldown constraints
- **Invalid Room Codes**: Provide clear feedback for non-existent or expired room codes

### Permission Errors
- **Bluetooth/Location Denied**: Show educational dialog explaining why permissions are needed
- **Notification Denied**: Gracefully degrade to in-app notifications only

### Real-time Channel Errors
- **Subscription Failure**: Retry subscription up to 3 times with exponential backoff
- **Message Delivery Failure**: Queue messages locally and retry when connection restored
- **Channel Disconnect**: Notify user and provide option to reconnect or exit battle


## Testing Strategy

### Unit Testing

The application will use **Jest** and **React Native Testing Library** for unit tests:

**Unit Test Coverage:**
- Room code generation function (uniqueness, format validation)
- Damage calculation functions (elemental effectiveness, critical hits)
- Battle state update functions (health/energy calculations)
- PeraWallet connection handlers (success/failure scenarios)
- Database query functions (CRUD operations)
- UI component rendering (snapshot tests for key screens)

**Example Unit Tests:**
```typescript
describe('generateRoomCode', () => {
  it('should generate a 6-character code', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
  });

  it('should only use allowed characters', () => {
    const code = generateRoomCode();
    expect(code).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/);
  });
});

describe('calculateDamage', () => {
  it('should apply elemental effectiveness correctly', () => {
    const damage = calculateDamage({
      attackPower: 100,
      defense: 50,
      attackerElement: 'fire',
      defenderElement: 'water',
    });
    expect(damage).toBeLessThan(100); // Fire is weak against water
  });
});
```

### Property-Based Testing

The application will use **fast-check** for property-based testing:

**Property Test Configuration:**
- Minimum 100 iterations per property test
- Each property test tagged with format: `**Feature: battle-system-refactor, Property {number}: {property_text}**`
- Random data generators for beasts, moves, and battle states

**Property Test Examples:**
```typescript
import fc from 'fast-check';

describe('Property Tests', () => {
  /**
   * Feature: battle-system-refactor, Property 1: Room Code Uniqueness
   */
  it('should generate unique room codes', async () => {
    await fc.assert(
      fc.asyncProperty(fc.nat(100), async (iterations) => {
        const codes = new Set();
        for (let i = 0; i < iterations; i++) {
          const code = generateRoomCode();
          expect(codes.has(code)).toBe(false);
          codes.add(code);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * Feature: battle-system-refactor, Property 13: Move Execution Correctness
   */
  it('should calculate damage correctly for any valid move', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          attackPower: fc.integer({ min: 1, max: 200 }),
          defense: fc.integer({ min: 1, max: 200 }),
          attackerElement: fc.constantFrom('fire', 'water', 'earth', 'wind', 'light', 'dark'),
          defenderElement: fc.constantFrom('fire', 'water', 'earth', 'wind', 'light', 'dark'),
        }),
        async (moveData) => {
          const damage = calculateDamage(moveData);
          expect(damage).toBeGreaterThanOrEqual(0);
          expect(damage).toBeLessThanOrEqual(moveData.attackPower * 2); // Max 2x with crit
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Integration Testing

**Integration Test Scenarios:**
- Complete battle flow from room creation to battle completion
- PeraWallet connection and user profile creation
- Real-time synchronization between two simulated clients
- Nearby connections discovery and invitation flow

### Manual Testing Checklist

- [ ] Create battle room and verify room code generation
- [ ] Join battle room using room code
- [ ] Test nearby connections discovery on physical devices
- [ ] Complete full battle with real-time synchronization
- [ ] Test PeraWallet connection flow
- [ ] Verify battle state persistence after app restart
- [ ] Test error scenarios (network loss, invalid codes, etc.)
- [ ] Verify UI responsiveness and animations
- [ ] Test on both iOS and Android platforms

