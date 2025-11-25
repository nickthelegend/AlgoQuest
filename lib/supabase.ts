import "react-native-url-polyfill/auto"
import { createClient } from "@supabase/supabase-js"
import * as SecureStore from "expo-secure-store"
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/constants/keys"

// SecureStore adapter for Supabase
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key: string, value: string) => {
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key: string) => {
    SecureStore.deleteItemAsync(key)
  },
}

// Initialize Supabase client with real-time configuration
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'x-client-info': 'algoquest-mobile',
    },
  },
})

/**
 * Test database connection
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @returns Connection status and error if any
 */
export async function testDatabaseConnection(): Promise<{
  success: boolean;
  error?: string;
  tables?: string[];
}> {
  try {
    // Test basic query to users table
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (usersError) {
      return {
        success: false,
        error: `Users table query failed: ${usersError.message}`,
      };
    }

    // Test beasts table
    const { data: beastsData, error: beastsError } = await supabase
      .from('beasts')
      .select('id')
      .limit(1);

    if (beastsError) {
      return {
        success: false,
        error: `Beasts table query failed: ${beastsError.message}`,
      };
    }

    // Test battles table
    const { data: battlesData, error: battlesError } = await supabase
      .from('battles')
      .select('id')
      .limit(1);

    if (battlesError) {
      return {
        success: false,
        error: `Battles table query failed: ${battlesError.message}`,
      };
    }

    // Test beast_abilities table
    const { data: abilitiesData, error: abilitiesError } = await supabase
      .from('beast_abilities')
      .select('id')
      .limit(1);

    if (abilitiesError) {
      return {
        success: false,
        error: `Beast abilities table query failed: ${abilitiesError.message}`,
      };
    }

    return {
      success: true,
      tables: ['users', 'beasts', 'battles', 'beast_abilities'],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test real-time subscription functionality
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @returns Subscription test status
 */
export async function testRealtimeSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    const testChannel = supabase.channel('connection-test');
    
    let subscribed = false;
    const timeout = setTimeout(() => {
      if (!subscribed) {
        testChannel.unsubscribe();
        resolve({
          success: false,
          error: 'Real-time subscription timeout',
        });
      }
    }, 5000);

    testChannel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        subscribed = true;
        clearTimeout(timeout);
        testChannel.unsubscribe();
        resolve({
          success: true,
        });
      } else if (status === 'CHANNEL_ERROR') {
        clearTimeout(timeout);
        testChannel.unsubscribe();
        resolve({
          success: false,
          error: 'Real-time channel error',
        });
      } else if (status === 'TIMED_OUT') {
        clearTimeout(timeout);
        testChannel.unsubscribe();
        resolve({
          success: false,
          error: 'Real-time subscription timed out',
        });
      }
    });
  });
}

/**
 * Verify all database queries work with the new schema
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @returns Verification results
 */
export async function verifyDatabaseSchema(): Promise<{
  success: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Test users table structure
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, wallet_address, full_name, email, profile_created')
      .limit(1);

    if (userError) {
      errors.push(`Users table structure error: ${userError.message}`);
    }

    // Test beasts table structure
    const { data: beastData, error: beastError } = await supabase
      .from('beasts')
      .select('id, owner_id, name, power, element, allocated_stats, metadata')
      .limit(1);

    if (beastError) {
      errors.push(`Beasts table structure error: ${beastError.message}`);
    }

    // Test battles table structure with new schema
    const { data: battleData, error: battleError } = await supabase
      .from('battles')
      .select('id, player1_id, player2_id, player1_beast_id, player2_beast_id, status, current_turn, turn_number, turn_time_remaining, room_code, battle_data')
      .limit(1);

    if (battleError) {
      errors.push(`Battles table structure error: ${battleError.message}`);
    }

    // Test beast_abilities table structure
    const { data: abilityData, error: abilityError } = await supabase
      .from('beast_abilities')
      .select('id, name, type, element, power, accuracy, energy_cost, cooldown')
      .limit(1);

    if (abilityError) {
      errors.push(`Beast abilities table structure error: ${abilityError.message}`);
    }

    // Test room_code uniqueness constraint
    const { data: roomCodeData, error: roomCodeError } = await supabase
      .from('battles')
      .select('room_code')
      .not('room_code', 'is', null)
      .limit(1);

    if (roomCodeError) {
      warnings.push(`Room code query warning: ${roomCodeError.message}`);
    }

    return {
      success: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Unknown error during schema verification');
    return {
      success: false,
      errors,
      warnings,
    };
  }
}

