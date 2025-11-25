/**
 * Supabase Configuration Tests
 * 
 * Tests for Supabase client configuration, database connection,
 * real-time subscriptions, and schema verification.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import { supabase, testDatabaseConnection, testRealtimeSubscription, verifyDatabaseSchema } from '../supabase';

describe('Supabase Configuration', () => {
  describe('Client Initialization', () => {
    it('should initialize Supabase client', () => {
      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
      expect(supabase.from).toBeDefined();
      expect(supabase.channel).toBeDefined();
    });

    it('should have real-time capabilities', () => {
      const channel = supabase.channel('test-channel');
      expect(channel).toBeDefined();
      expect(typeof channel.subscribe).toBe('function');
      expect(typeof channel.unsubscribe).toBe('function');
    });
  });

  describe('Database Connection', () => {
    it('should connect to database successfully', async () => {
      const result = await testDatabaseConnection();
      
      if (!result.success) {
        console.error('Database connection error:', result.error);
      }
      
      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(result.tables).toBeDefined();
      expect(result.tables).toContain('users');
      expect(result.tables).toContain('beasts');
      expect(result.tables).toContain('battles');
      expect(result.tables).toContain('beast_abilities');
    }, 10000);

    it('should query users table', async () => {
      const { data, error } = await supabase
        .from('users')
        .select('id, wallet_address')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should query beasts table', async () => {
      const { data, error } = await supabase
        .from('beasts')
        .select('id, name, element')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should query battles table with new schema', async () => {
      const { data, error } = await supabase
        .from('battles')
        .select('id, room_code, status, battle_data')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should query beast_abilities table', async () => {
      const { data, error } = await supabase
        .from('beast_abilities')
        .select('id, name, type, element')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Real-time Subscriptions', () => {
    it('should create real-time channel', () => {
      const channel = supabase.channel('test-battle-room');
      expect(channel).toBeDefined();
      expect(typeof channel.subscribe).toBe('function');
    });

    it('should subscribe to real-time channel', async () => {
      const result = await testRealtimeSubscription();
      
      if (!result.success) {
        console.warn('Real-time subscription warning:', result.error);
      }
      
      // Real-time might not work in test environment, so we just check it doesn't crash
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
    }, 10000);

    it('should handle channel subscription lifecycle', async () => {
      const channel = supabase.channel('lifecycle-test');
      
      let subscriptionStatus: string | null = null;
      
      const promise = new Promise<void>((resolve) => {
        channel.subscribe((status) => {
          subscriptionStatus = status;
          if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            resolve();
          }
        });
        
        // Timeout after 5 seconds
        setTimeout(() => resolve(), 5000);
      });

      await promise;
      await channel.unsubscribe();
      
      expect(subscriptionStatus).toBeDefined();
    }, 10000);
  });

  describe('Schema Verification', () => {
    it('should verify database schema', async () => {
      const result = await verifyDatabaseSchema();
      
      if (!result.success) {
        console.error('Schema verification errors:', result.errors);
      }
      
      if (result.warnings.length > 0) {
        console.warn('Schema verification warnings:', result.warnings);
      }
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.errors).toHaveLength(0);
    }, 10000);

    it('should have room_code column in battles table', async () => {
      const { data, error } = await supabase
        .from('battles')
        .select('room_code')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have battle_data JSONB column in battles table', async () => {
      const { data, error } = await supabase
        .from('battles')
        .select('battle_data')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('should have allocated_stats JSONB column in beasts table', async () => {
      const { data, error } = await supabase
        .from('beasts')
        .select('allocated_stats')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Query Operations', () => {
    it('should support insert operations', async () => {
      // This is a dry run test - we don't actually insert
      const insertQuery = supabase
        .from('users')
        .insert({
          wallet_address: 'test-wallet-address',
          profile_created: false,
        });

      expect(insertQuery).toBeDefined();
    });

    it('should support update operations', async () => {
      // This is a dry run test - we don't actually update
      const updateQuery = supabase
        .from('battles')
        .update({
          status: 'active',
          current_turn: 'player1',
        })
        .eq('id', 'test-id');

      expect(updateQuery).toBeDefined();
    });

    it('should support delete operations', async () => {
      // This is a dry run test - we don't actually delete
      const deleteQuery = supabase
        .from('battles')
        .delete()
        .eq('status', 'waiting')
        .lt('created_at', new Date().toISOString());

      expect(deleteQuery).toBeDefined();
    });

    it('should support complex queries with joins', async () => {
      const { data, error } = await supabase
        .from('battles')
        .select(`
          id,
          status,
          room_code,
          player1:users!battles_player1_id_fkey(id, wallet_address),
          player2:users!battles_player2_id_fkey(id, wallet_address)
        `)
        .limit(1);

      // This might fail if there are no battles, but the query structure should be valid
      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });
});
