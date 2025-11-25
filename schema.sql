-- ============================================================================
-- AlgoQuest Battle System Database Schema
-- ============================================================================
-- Description: Complete database schema for the AlgoQuest battle system
-- Version: 2.0
-- Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
-- ============================================================================

-- ============================================================================
-- USERS TABLE
-- ============================================================================
-- Stores user profile information and wallet addresses
CREATE TABLE IF NOT EXISTS users (
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

-- Index for fast wallet address lookups
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);

-- Add comment to document the table
COMMENT ON TABLE users IS 'Stores user profile information and Algorand wallet addresses';
COMMENT ON COLUMN users.wallet_address IS 'Algorand wallet address (unique identifier for users)';
COMMENT ON COLUMN users.profile_created IS 'Indicates if user has completed profile setup';

-- ============================================================================
-- BEASTS TABLE
-- ============================================================================
-- Stores beast (creature) information owned by users
CREATE TABLE IF NOT EXISTS beasts (
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

-- Index for fast owner lookups
CREATE INDEX IF NOT EXISTS idx_beasts_owner ON beasts(owner_id);

-- Add comments to document the table
COMMENT ON TABLE beasts IS 'Stores beast (creature) information owned by users';
COMMENT ON COLUMN beasts.element IS 'Beast element type: fire, water, earth, wind, light, or dark';
COMMENT ON COLUMN beasts.metadata IS 'Additional beast data including tier, abilities, and description';
COMMENT ON COLUMN beasts.allocated_stats IS 'Combat statistics: attack, defense, speed, and health';

-- ============================================================================
-- BEAST ABILITIES TABLE
-- ============================================================================
-- Stores predefined abilities that beasts can use in battle
CREATE TABLE IF NOT EXISTS beast_abilities (
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

-- Add comments to document the table
COMMENT ON TABLE beast_abilities IS 'Predefined abilities that beasts can use in battle';
COMMENT ON COLUMN beast_abilities.type IS 'Ability type: attack, heal, buff, debuff, or energy';
COMMENT ON COLUMN beast_abilities.element IS 'Ability element: fire, water, earth, wind, light, or dark';
COMMENT ON COLUMN beast_abilities.accuracy IS 'Hit chance percentage (0-100)';
COMMENT ON COLUMN beast_abilities.energy_cost IS 'Energy required to use this ability';

-- ============================================================================
-- BATTLES TABLE
-- ============================================================================
-- Stores battle information and state
CREATE TABLE IF NOT EXISTS battles (
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

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_battles_room_code ON battles(room_code);
CREATE INDEX IF NOT EXISTS idx_battles_status ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_player1 ON battles(player1_id);
CREATE INDEX IF NOT EXISTS idx_battles_player2 ON battles(player2_id);

-- Add comments to document the table
COMMENT ON TABLE battles IS 'Stores battle information and real-time state';
COMMENT ON COLUMN battles.room_code IS 'Unique 6-character alphanumeric code for joining battle rooms';
COMMENT ON COLUMN battles.status IS 'Battle status: waiting, active, completed, or abandoned';
COMMENT ON COLUMN battles.current_turn IS 'Which player''s turn it is: player1 or player2';
COMMENT ON COLUMN battles.turn_time_remaining IS 'Seconds remaining in current turn (default 30)';
COMMENT ON COLUMN battles.battle_data IS 'Real-time battle state including moves and beast states';

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to cleanup stale battle rooms
-- Removes rooms older than 10 minutes with status='waiting'
CREATE OR REPLACE FUNCTION cleanup_stale_battle_rooms()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM battles 
  WHERE status = 'waiting' 
    AND created_at < NOW() - INTERVAL '10 minutes'
    AND room_code IS NOT NULL;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_stale_battle_rooms() IS 'Deletes battle rooms that have been waiting for more than 10 minutes. Returns the number of deleted rooms.';

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to automatically update updated_at timestamp on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_battles_updated_at
  BEFORE UPDATE ON battles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp when a row is modified';

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================
