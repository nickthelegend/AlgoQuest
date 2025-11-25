/**
 * Supabase Configuration Verification Script
 * 
 * This script can be run manually to verify Supabase configuration
 * and database connectivity.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * Usage: Import and call verifySupabaseConfiguration() from your app
 */

import { supabase, testDatabaseConnection, testRealtimeSubscription, verifyDatabaseSchema } from './supabase';

/**
 * Comprehensive Supabase configuration verification
 * 
 * @returns Verification results
 */
export async function verifySupabaseConfiguration(): Promise<{
  success: boolean;
  results: {
    clientInitialized: boolean;
    databaseConnection: {
      success: boolean;
      error?: string;
      tables?: string[];
    };
    realtimeSubscription: {
      success: boolean;
      error?: string;
    };
    schemaVerification: {
      success: boolean;
      errors: string[];
      warnings: string[];
    };
  };
}> {
  console.log('🔍 Starting Supabase configuration verification...\n');

  // Check client initialization
  console.log('1️⃣ Checking Supabase client initialization...');
  const clientInitialized = !!(supabase && supabase.auth && supabase.from && supabase.channel);
  console.log(clientInitialized ? '✅ Client initialized successfully' : '❌ Client initialization failed');
  console.log('');

  // Test database connection
  console.log('2️⃣ Testing database connection...');
  const dbResult = await testDatabaseConnection();
  if (dbResult.success) {
    console.log('✅ Database connection successful');
    console.log(`   Tables found: ${dbResult.tables?.join(', ')}`);
  } else {
    console.log('❌ Database connection failed');
    console.log(`   Error: ${dbResult.error}`);
  }
  console.log('');

  // Test real-time subscriptions
  console.log('3️⃣ Testing real-time subscriptions...');
  const realtimeResult = await testRealtimeSubscription();
  if (realtimeResult.success) {
    console.log('✅ Real-time subscriptions working');
  } else {
    console.log('⚠️  Real-time subscription test failed');
    console.log(`   Error: ${realtimeResult.error}`);
    console.log('   Note: This may be expected in some environments');
  }
  console.log('');

  // Verify database schema
  console.log('4️⃣ Verifying database schema...');
  const schemaResult = await verifyDatabaseSchema();
  if (schemaResult.success) {
    console.log('✅ Database schema verified successfully');
  } else {
    console.log('❌ Database schema verification failed');
    schemaResult.errors.forEach((error, index) => {
      console.log(`   Error ${index + 1}: ${error}`);
    });
  }
  
  if (schemaResult.warnings.length > 0) {
    console.log('⚠️  Warnings:');
    schemaResult.warnings.forEach((warning, index) => {
      console.log(`   Warning ${index + 1}: ${warning}`);
    });
  }
  console.log('');

  // Overall result
  const overallSuccess = clientInitialized && dbResult.success && schemaResult.success;
  
  if (overallSuccess) {
    console.log('✅ All Supabase configuration checks passed!');
  } else {
    console.log('❌ Some Supabase configuration checks failed. Please review the errors above.');
  }

  return {
    success: overallSuccess,
    results: {
      clientInitialized,
      databaseConnection: dbResult,
      realtimeSubscription: realtimeResult,
      schemaVerification: schemaResult,
    },
  };
}

/**
 * Quick verification for specific database queries
 * 
 * @returns Query test results
 */
export async function verifyDatabaseQueries(): Promise<{
  success: boolean;
  results: Record<string, { success: boolean; error?: string }>;
}> {
  console.log('🔍 Testing database queries...\n');

  const results: Record<string, { success: boolean; error?: string }> = {};

  // Test users table query
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, wallet_address, profile_created')
      .limit(1);
    
    results.users = {
      success: !error,
      error: error?.message,
    };
    console.log(results.users.success ? '✅ Users table query successful' : `❌ Users table query failed: ${results.users.error}`);
  } catch (error) {
    results.users = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.log(`❌ Users table query failed: ${results.users.error}`);
  }

  // Test beasts table query
  try {
    const { data, error } = await supabase
      .from('beasts')
      .select('id, name, element, allocated_stats')
      .limit(1);
    
    results.beasts = {
      success: !error,
      error: error?.message,
    };
    console.log(results.beasts.success ? '✅ Beasts table query successful' : `❌ Beasts table query failed: ${results.beasts.error}`);
  } catch (error) {
    results.beasts = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.log(`❌ Beasts table query failed: ${results.beasts.error}`);
  }

  // Test battles table query with new schema
  try {
    const { data, error } = await supabase
      .from('battles')
      .select('id, room_code, status, current_turn, battle_data')
      .limit(1);
    
    results.battles = {
      success: !error,
      error: error?.message,
    };
    console.log(results.battles.success ? '✅ Battles table query successful' : `❌ Battles table query failed: ${results.battles.error}`);
  } catch (error) {
    results.battles = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.log(`❌ Battles table query failed: ${results.battles.error}`);
  }

  // Test beast_abilities table query
  try {
    const { data, error } = await supabase
      .from('beast_abilities')
      .select('id, name, type, element, power')
      .limit(1);
    
    results.beast_abilities = {
      success: !error,
      error: error?.message,
    };
    console.log(results.beast_abilities.success ? '✅ Beast abilities table query successful' : `❌ Beast abilities table query failed: ${results.beast_abilities.error}`);
  } catch (error) {
    results.beast_abilities = {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    console.log(`❌ Beast abilities table query failed: ${results.beast_abilities.error}`);
  }

  const allSuccess = Object.values(results).every(r => r.success);
  console.log('');
  console.log(allSuccess ? '✅ All database queries successful!' : '❌ Some database queries failed.');

  return {
    success: allSuccess,
    results,
  };
}

/**
 * Test real-time channel creation and subscription
 * 
 * @param channelName - Name of the test channel
 * @returns Test result
 */
export async function testRealtimeChannel(channelName: string = 'test-channel'): Promise<{
  success: boolean;
  error?: string;
  subscriptionStatus?: string;
}> {
  console.log(`🔍 Testing real-time channel: ${channelName}...\n`);

  try {
    const channel = supabase.channel(channelName);
    
    if (!channel) {
      return {
        success: false,
        error: 'Failed to create channel',
      };
    }

    console.log('✅ Channel created successfully');

    return new Promise((resolve) => {
      let subscriptionStatus: string | null = null;
      
      const timeout = setTimeout(() => {
        channel.unsubscribe();
        resolve({
          success: false,
          error: 'Subscription timeout',
          subscriptionStatus: subscriptionStatus || 'TIMEOUT',
        });
      }, 5000);

      channel.subscribe((status) => {
        subscriptionStatus = status;
        console.log(`   Subscription status: ${status}`);

        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          channel.unsubscribe();
          console.log('✅ Real-time channel subscription successful');
          resolve({
            success: true,
            subscriptionStatus: status,
          });
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          clearTimeout(timeout);
          channel.unsubscribe();
          console.log(`❌ Real-time channel subscription failed: ${status}`);
          resolve({
            success: false,
            error: `Subscription failed with status: ${status}`,
            subscriptionStatus: status,
          });
        }
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
