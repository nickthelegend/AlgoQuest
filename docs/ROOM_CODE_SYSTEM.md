# Room Code System Documentation

## Overview

The Room Code System is a matchmaking mechanism that allows players to create and join battles using unique 6-character alphanumeric codes. This provides a simple, user-friendly way for players to connect with specific opponents without requiring complex matchmaking algorithms.

## Why Room Codes?

### Advantages

1. **Simplicity**: Easy to share via text, voice, or screen sharing
2. **Flexibility**: Players can battle anyone, anywhere
3. **Privacy**: No public matchmaking queue
4. **Reliability**: Works across different networks and locations
5. **User Control**: Players choose who they battle

### Use Cases

- **Friend Battles**: Share code with friends to battle
- **Tournament Organization**: Organizers can manage brackets with codes
- **Streaming**: Streamers can share codes with viewers
- **Cross-Platform**: Works on any device with internet

## Code Format

### Specification

- **Length**: 6 characters
- **Character Set**: `23456789ABCDEFGHJKMNPQRSTUVWXYZ` (32 characters)
- **Excluded Characters**: `0`, `O`, `I`, `1`, `L` (to prevent confusion)
- **Case**: Always uppercase
- **Example**: `A3B7K9`, `MN4P2Q`, `XY8Z3W`

### Why These Characters?

**Excluded Characters Rationale:**
- `0` (zero) vs `O` (letter O) - visually similar
- `1` (one) vs `I` (letter I) vs `l` (lowercase L) - visually similar
- `L` (letter L) - can be confused with `1` or `I`

This reduces user error when manually entering codes.

### Uniqueness

With 32 possible characters and 6 positions:
- **Total Combinations**: 32^6 = 1,073,741,824 (over 1 billion)
- **Collision Probability**: Extremely low (<0.0001% for 10,000 active rooms)
- **Practical Capacity**: Can support millions of concurrent battles

## Implementation

### Code Generation

```typescript
// lib/roomCode.ts

const ALLOWED_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const CODE_LENGTH = 6;

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ALLOWED_CHARS.length);
    code += ALLOWED_CHARS[randomIndex];
  }
  return code;
}
```

### Code Validation

```typescript
export function isValidRoomCode(code: string): boolean {
  // Check length
  if (code.length !== CODE_LENGTH) {
    return false;
  }
  
  // Check characters
  const regex = new RegExp(`^[${ALLOWED_CHARS}]{${CODE_LENGTH}}$`);
  return regex.test(code);
}
```

### Uniqueness Check

```typescript
import { supabase } from './supabase';

export async function isRoomCodeUnique(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('battles')
    .select('id')
    .eq('room_code', code)
    .eq('status', 'waiting')
    .single();
  
  return !data; // Unique if no existing room found
}
```

### Code Generation with Retry

```typescript
export async function generateUniqueRoomCode(maxRetries = 5): Promise<string> {
  for (let i = 0; i < maxRetries; i++) {
    const code = generateRoomCode();
    const isUnique = await isRoomCodeUnique(code);
    
    if (isUnique) {
      return code;
    }
  }
  
  throw new Error('Failed to generate unique room code');
}
```

## Database Schema

### battles Table

```sql
CREATE TABLE battles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_code VARCHAR(6) UNIQUE,
  status VARCHAR(50) DEFAULT 'waiting',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- other fields...
);

CREATE INDEX idx_battles_room_code ON battles(room_code);
CREATE INDEX idx_battles_status ON battles(status);
```

### Constraints

- `room_code` is UNIQUE to prevent duplicates
- Indexed for fast lookups
- Only 'waiting' and 'active' battles have room codes
- Completed battles can have NULL room codes (for cleanup)

## Room Lifecycle

### 1. Room Creation

```typescript
import { createBattleRoom } from '@/lib/battleRoom';

const battle = await createBattleRoom({
  player1Id: userId,
  player1BeastId: beastId,
});

console.log(`Room Code: ${battle.room_code}`);
// Display to user: "Share this code: A3B7K9"
```

**Database State:**
```json
{
  "id": "uuid",
  "room_code": "A3B7K9",
  "status": "waiting",
  "player1_id": "uuid",
  "player2_id": null,
  "created_at": "2025-11-25T10:00:00Z"
}
```

### 2. Room Joining

```typescript
import { joinBattleRoom } from '@/lib/battleRoom';

try {
  const battle = await joinBattleRoom({
    roomCode: "A3B7K9",
    player2Id: userId,
    player2BeastId: beastId,
  });
  
  console.log('Joined battle successfully');
} catch (error) {
  console.error('Failed to join:', error.message);
}
```

**Database State After Join:**
```json
{
  "id": "uuid",
  "room_code": "A3B7K9",
  "status": "active",
  "player1_id": "uuid",
  "player2_id": "uuid",
  "created_at": "2025-11-25T10:00:00Z",
  "updated_at": "2025-11-25T10:01:00Z"
}
```

### 3. Battle Active

Once both players join:
- Status changes to 'active'
- Room code remains for reference
- Battle proceeds normally

### 4. Battle Completion

```typescript
{
  "status": "completed",
  "room_code": "A3B7K9", // Kept for history
  "winner_id": "uuid",
  "ended_at": "2025-11-25T10:15:00Z"
}
```

### 5. Room Cleanup

Stale rooms (waiting >10 minutes) are automatically cleaned up:

```typescript
export async function cleanupStaleRooms() {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  
  const { data, error } = await supabase
    .from('battles')
    .delete()
    .eq('status', 'waiting')
    .lt('created_at', tenMinutesAgo.toISOString());
  
  return data;
}
```

## User Interface

### Creating a Room

**Find Players Screen:**
```
┌─────────────────────────────────────┐
│  Create Battle Room                 │
│                                     │
│  Your Room Code:                    │
│  ┌─────────────────────────────┐  │
│  │      A 3 B 7 K 9            │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Share Code] [Copy Code]          │
│                                     │
│  Share this code with your         │
│  opponent to start the battle!     │
└─────────────────────────────────────┘
```

### Joining a Room

**Find Players Screen:**
```
┌─────────────────────────────────────┐
│  Join Battle Room                   │
│                                     │
│  Enter Room Code:                   │
│  ┌─────────────────────────────┐  │
│  │  [_][_][_][_][_][_]         │  │
│  └─────────────────────────────┘  │
│                                     │
│  [Join Battle]                      │
│                                     │
│  Enter the 6-character code         │
│  shared by your opponent            │
└─────────────────────────────────────┘
```

### Code Display Component

```typescript
import { View, Text, TouchableOpacity } from 'react-native';
import * as Clipboard from 'expo-clipboard';

function RoomCodeDisplay({ code }: { code: string }) {
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied!', 'Room code copied to clipboard');
  };
  
  return (
    <View style={styles.codeContainer}>
      <Text style={styles.codeLabel}>Your Room Code:</Text>
      <View style={styles.codeDisplay}>
        {code.split('').map((char, index) => (
          <Text key={index} style={styles.codeChar}>
            {char}
          </Text>
        ))}
      </View>
      <TouchableOpacity onPress={copyToClipboard}>
        <Text style={styles.copyButton}>Copy Code</Text>
      </TouchableOpacity>
    </View>
  );
}
```

### Code Input Component

```typescript
import { TextInput } from 'react-native';

function RoomCodeInput({ onCodeEntered }: { onCodeEntered: (code: string) => void }) {
  const [code, setCode] = useState('');
  
  const handleChange = (text: string) => {
    // Convert to uppercase and filter invalid characters
    const filtered = text.toUpperCase().replace(/[^23456789ABCDEFGHJKMNPQRSTUVWXYZ]/g, '');
    
    if (filtered.length <= 6) {
      setCode(filtered);
      
      if (filtered.length === 6) {
        onCodeEntered(filtered);
      }
    }
  };
  
  return (
    <TextInput
      value={code}
      onChangeText={handleChange}
      placeholder="Enter code"
      maxLength={6}
      autoCapitalize="characters"
      autoCorrect={false}
    />
  );
}
```

## Error Handling

### Invalid Code Format

```typescript
try {
  if (!isValidRoomCode(code)) {
    throw new Error('Invalid room code format');
  }
} catch (error) {
  Alert.alert(
    'Invalid Code',
    'Please enter a valid 6-character room code'
  );
}
```

### Room Not Found

```typescript
try {
  await joinBattleRoom({ roomCode: code });
} catch (error) {
  if (error.message.includes('not found')) {
    Alert.alert(
      'Room Not Found',
      'This room code does not exist or has expired'
    );
  }
}
```

### Room Full

```typescript
try {
  await joinBattleRoom({ roomCode: code });
} catch (error) {
  if (error.message.includes('full')) {
    Alert.alert(
      'Room Full',
      'This battle room already has two players'
    );
  }
}
```

### Room Expired

```typescript
try {
  await joinBattleRoom({ roomCode: code });
} catch (error) {
  if (error.message.includes('expired')) {
    Alert.alert(
      'Room Expired',
      'This room has been waiting too long and was cleaned up'
    );
  }
}
```

## Sharing Methods

### 1. Copy to Clipboard

```typescript
import * as Clipboard from 'expo-clipboard';

async function shareRoomCode(code: string) {
  await Clipboard.setStringAsync(code);
  Alert.alert('Copied!', 'Room code copied to clipboard');
}
```

### 2. Share Sheet

```typescript
import { Share } from 'react-native';

async function shareRoomCode(code: string) {
  await Share.share({
    message: `Join my AlgoQuest battle! Room code: ${code}`,
    title: 'AlgoQuest Battle Invitation',
  });
}
```

### 3. QR Code

```typescript
import QRCode from 'react-native-qrcode-svg';

function RoomCodeQR({ code }: { code: string }) {
  return (
    <QRCode
      value={code}
      size={200}
      backgroundColor="white"
      color="black"
    />
  );
}
```

### 4. Deep Link

```typescript
const deepLink = `algoquest://battle/join/${code}`;

// Share deep link
await Share.share({
  message: `Join my battle: ${deepLink}`,
});
```

## Security Considerations

### 1. Rate Limiting

Prevent abuse by limiting room creation:

```typescript
const RATE_LIMIT = 5; // rooms per minute
const rateLimitMap = new Map<string, number[]>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  
  // Remove requests older than 1 minute
  const recentRequests = userRequests.filter(
    time => now - time < 60000
  );
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false;
  }
  
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}
```

### 2. Code Expiration

Automatically expire old codes:

```typescript
// Cleanup job (run every 5 minutes)
setInterval(async () => {
  await cleanupStaleRooms();
}, 5 * 60 * 1000);
```

### 3. Validation

Always validate codes server-side:

```typescript
// Server-side validation
export async function validateRoomCode(code: string): Promise<boolean> {
  // Check format
  if (!isValidRoomCode(code)) {
    return false;
  }
  
  // Check exists and is waiting
  const { data } = await supabase
    .from('battles')
    .select('status')
    .eq('room_code', code)
    .single();
  
  return data?.status === 'waiting';
}
```

## Analytics

### Tracking Room Usage

```typescript
interface RoomAnalytics {
  totalRoomsCreated: number;
  totalRoomsJoined: number;
  averageWaitTime: number;
  expiredRooms: number;
  successRate: number;
}

async function getRoomAnalytics(): Promise<RoomAnalytics> {
  // Query database for analytics
  const { data } = await supabase
    .from('battles')
    .select('*')
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000));
  
  // Calculate metrics
  return {
    totalRoomsCreated: data.length,
    totalRoomsJoined: data.filter(b => b.player2_id).length,
    averageWaitTime: calculateAverageWaitTime(data),
    expiredRooms: data.filter(b => b.status === 'abandoned').length,
    successRate: calculateSuccessRate(data),
  };
}
```

## Testing

### Unit Tests

```typescript
describe('Room Code System', () => {
  it('should generate valid codes', () => {
    const code = generateRoomCode();
    expect(code).toHaveLength(6);
    expect(isValidRoomCode(code)).toBe(true);
  });
  
  it('should reject invalid codes', () => {
    expect(isValidRoomCode('O1IL00')).toBe(false);
    expect(isValidRoomCode('ABC')).toBe(false);
    expect(isValidRoomCode('ABCDEFG')).toBe(false);
  });
  
  it('should generate unique codes', async () => {
    const codes = new Set();
    for (let i = 0; i < 1000; i++) {
      codes.add(generateRoomCode());
    }
    expect(codes.size).toBe(1000);
  });
});
```

### Integration Tests

```typescript
describe('Room Lifecycle', () => {
  it('should create and join room', async () => {
    // Create room
    const battle = await createBattleRoom({
      player1Id: 'user1',
      player1BeastId: 1,
    });
    
    expect(battle.room_code).toBeDefined();
    expect(battle.status).toBe('waiting');
    
    // Join room
    const joined = await joinBattleRoom({
      roomCode: battle.room_code,
      player2Id: 'user2',
      player2BeastId: 2,
    });
    
    expect(joined.status).toBe('active');
    expect(joined.player2_id).toBe('user2');
  });
});
```

## Best Practices

### For Users

✅ **Do:**
- Share codes via secure channels
- Double-check code before entering
- Create new room if code doesn't work
- Use copy/paste to avoid typos

❌ **Don't:**
- Share codes publicly (unless intended)
- Reuse old codes
- Enter codes with excluded characters
- Wait too long to join (codes expire)

### For Developers

✅ **Do:**
- Validate codes on both client and server
- Implement rate limiting
- Clean up expired rooms
- Provide clear error messages
- Log room creation/joining for analytics

❌ **Don't:**
- Trust client-side validation alone
- Allow unlimited room creation
- Keep expired rooms indefinitely
- Use confusing characters
- Skip uniqueness checks

## Troubleshooting

### Code Not Working

**Problem**: User enters code but can't join

**Solutions**:
1. Verify code format (6 chars, no 0/O/I/1/L)
2. Check room hasn't expired (>10 min)
3. Ensure room status is 'waiting'
4. Try generating new code

### Duplicate Codes

**Problem**: Same code generated twice

**Solutions**:
1. Check uniqueness validation is working
2. Verify database constraint is active
3. Increase retry attempts
4. Check for race conditions

### Slow Code Generation

**Problem**: Takes too long to generate code

**Solutions**:
1. Optimize database query
2. Add database index on room_code
3. Reduce retry attempts
4. Cache recent codes

## Future Enhancements

- [ ] Custom code prefixes for tournaments
- [ ] Code expiration notifications
- [ ] Code history for users
- [ ] Favorite opponents (quick rematch)
- [ ] Code analytics dashboard
- [ ] Multi-use codes for tournaments
- [ ] Password-protected rooms
- [ ] Spectator codes

## Conclusion

The Room Code System provides a simple, reliable way for players to connect for battles. With proper implementation, validation, and error handling, it offers an excellent user experience while maintaining security and scalability.
