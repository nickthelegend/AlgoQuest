import { PeraWalletConnect } from '@perawallet/connect';
import * as SecureStore from 'expo-secure-store';
import { supabase } from './supabase';

// Initialize PeraWallet instance
let peraWallet: PeraWalletConnect | null = null;

/**
 * Initialize PeraWallet with configuration
 */
export function initializePeraWallet(): PeraWalletConnect {
  if (!peraWallet) {
    peraWallet = new PeraWalletConnect({
      chainId: 416001, // Algorand MainNet
      shouldShowSignTxnToast: true,
    });
  }
  return peraWallet;
}

/**
 * Get the PeraWallet instance
 */
export function getPeraWallet(): PeraWalletConnect {
  if (!peraWallet) {
    return initializePeraWallet();
  }
  return peraWallet;
}

/**
 * Connect to PeraWallet and retrieve wallet address
 * @returns The connected wallet address
 */
export async function connectPeraWallet(): Promise<string> {
  try {
    const wallet = getPeraWallet();
    const accounts = await wallet.connect();
    
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts returned from PeraWallet');
    }
    
    const walletAddress = accounts[0];
    
    // Store wallet address and type securely
    await SecureStore.setItemAsync('walletAddress', walletAddress);
    await SecureStore.setItemAsync('walletType', 'pera');
    
    return walletAddress;
  } catch (error) {
    console.error('PeraWallet connection failed:', error);
    throw error;
  }
}

/**
 * Disconnect from PeraWallet and clear stored data
 */
export async function disconnectPeraWallet(): Promise<void> {
  try {
    const wallet = getPeraWallet();
    await wallet.disconnect();
    
    // Clear stored wallet data
    await SecureStore.deleteItemAsync('walletAddress');
    await SecureStore.deleteItemAsync('walletType');
  } catch (error) {
    console.error('PeraWallet disconnection failed:', error);
    throw error;
  }
}

/**
 * Create or update user profile in database with wallet address
 * @param walletAddress The wallet address to associate with the user
 * @param profileData Optional profile data to include
 */
export async function createOrUpdateUserProfile(
  walletAddress: string,
  profileData?: {
    full_name?: string;
    email?: string;
    roll_number?: string;
    branch?: string;
    gender?: 'male' | 'female';
    interests?: string[];
    avatar_url?: string;
    avatar_prompt?: string;
  }
): Promise<void> {
  try {
    // Check if user already exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', walletAddress)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is expected for new users
      throw fetchError;
    }

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq('wallet_address', walletAddress);

      if (updateError) {
        throw updateError;
      }
    } else {
      // Create new user
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          {
            wallet_address: walletAddress,
            ...profileData,
            profile_created: !!profileData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        throw insertError;
      }
    }
  } catch (error) {
    console.error('Failed to create/update user profile:', error);
    throw error;
  }
}

/**
 * Check if a wallet is currently connected
 */
export async function isWalletConnected(): Promise<boolean> {
  try {
    const walletAddress = await SecureStore.getItemAsync('walletAddress');
    return !!walletAddress;
  } catch (error) {
    console.error('Error checking wallet connection:', error);
    return false;
  }
}

/**
 * Get the currently connected wallet address
 */
export async function getConnectedWalletAddress(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync('walletAddress');
  } catch (error) {
    console.error('Error getting wallet address:', error);
    return null;
  }
}

/**
 * Get the wallet type (pera or generated)
 */
export async function getWalletType(): Promise<'pera' | 'generated' | null> {
  try {
    const walletType = await SecureStore.getItemAsync('walletType');
    return walletType as 'pera' | 'generated' | null;
  } catch (error) {
    console.error('Error getting wallet type:', error);
    return null;
  }
}
