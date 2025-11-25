/**
 * Room Code Generation and Validation Utilities
 * 
 * This module provides functions for generating unique battle room codes,
 * validating room codes, and checking uniqueness against the database.
 * 
 * Requirements: 3.1
 */

import { supabase } from './supabase';

// Characters used for room code generation
// Excludes ambiguous characters: 0, O, I, 1, L
const ROOM_CODE_CHARS = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
const ROOM_CODE_LENGTH = 6;
const MAX_RETRY_ATTEMPTS = 5;

/**
 * Generates a random 6-character alphanumeric room code
 * Excludes ambiguous characters (0, O, I, 1, L) to prevent confusion
 * 
 * @returns A 6-character room code string
 */
export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    const randomIndex = Math.floor(Math.random() * ROOM_CODE_CHARS.length);
    code += ROOM_CODE_CHARS.charAt(randomIndex);
  }
  return code;
}

/**
 * Validates the format of a room code
 * Checks if the code is exactly 6 characters and contains only allowed characters
 * 
 * @param code - The room code to validate
 * @returns true if the code format is valid, false otherwise
 */
export function isValidRoomCodeFormat(code: string): boolean {
  if (!code || code.length !== ROOM_CODE_LENGTH) {
    return false;
  }
  
  // Check if all characters are in the allowed set
  for (let i = 0; i < code.length; i++) {
    if (!ROOM_CODE_CHARS.includes(code.charAt(i))) {
      return false;
    }
  }
  
  return true;
}

/**
 * Checks if a room code already exists in the database
 * 
 * @param code - The room code to check
 * @returns true if the code exists, false otherwise
 * @throws Error if database query fails
 */
export async function isRoomCodeUnique(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('battles')
    .select('room_code')
    .eq('room_code', code)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to check room code uniqueness: ${error.message}`);
  }

  // If data is null, the code doesn't exist (is unique)
  return data === null;
}

/**
 * Generates a unique room code with retry logic for collision handling
 * Attempts to generate a unique code up to MAX_RETRY_ATTEMPTS times
 * 
 * @returns A unique room code string
 * @throws Error if unable to generate a unique code after max retries
 */
export async function generateUniqueRoomCode(): Promise<string> {
  for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
    const code = generateRoomCode();
    
    try {
      const isUnique = await isRoomCodeUnique(code);
      
      if (isUnique) {
        return code;
      }
      
      // Code collision detected, retry
      console.log(`Room code collision detected: ${code}. Retrying... (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
    } catch (error) {
      // On database error, throw immediately
      throw error;
    }
  }
  
  // If we've exhausted all retries, throw an error
  throw new Error(`Failed to generate unique room code after ${MAX_RETRY_ATTEMPTS} attempts`);
}

/**
 * Validates a room code and checks if it exists in the database
 * 
 * @param code - The room code to validate
 * @returns Object with validation result and optional error message
 */
export async function validateRoomCode(code: string): Promise<{
  isValid: boolean;
  error?: string;
}> {
  // First check format
  if (!isValidRoomCodeFormat(code)) {
    return {
      isValid: false,
      error: 'Invalid room code format. Code must be 6 characters using numbers 2-9 and letters A-Z (excluding I, L, O).',
    };
  }
  
  // Then check if it exists in the database
  try {
    const isUnique = await isRoomCodeUnique(code);
    
    if (isUnique) {
      return {
        isValid: false,
        error: 'Room code not found. Please check the code and try again.',
      };
    }
    
    return {
      isValid: true,
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Failed to validate room code. Please check your connection and try again.',
    };
  }
}
