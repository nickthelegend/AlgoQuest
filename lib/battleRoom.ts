/**
 * Battle Room Management Module
 * 
 * This module provides functions for creating, joining, and managing battle rooms.
 * It handles room code generation, validation, and cleanup of stale rooms.
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.5
 */

import { supabase } from './supabase';
import { generateUniqueRoomCode, validateRoomCode } from './roomCode';
import { initializeBattleState, Beast } from './battleState';
import {
  retryWithBackoff,
  validateBeastData,
  handleInvalidRoomCode,
  AppError,
  ErrorType,
  safeDbOperation,
} from './errorHandling';

/**
 * Interface for battle room creation parameters
 */
export interface CreateBattleRoomParams {
  player1_id: string;
  player1_beast_id: number;
  player1_beast?: Beast; // Optional: if provided, will initialize battle state
}

/**
 * Interface for battle room join parameters
 */
export interface JoinBattleRoomParams {
  room_code: string;
  player2_id: string;
  player2_beast_id: number;
  player2_beast?: Beast; // Optional: if provided, will initialize battle state
}

/**
 * Interface for battle room data returned from database
 */
export interface BattleRoom {
  id: string;
  player1_id: string;
  player2_id: string | null;
  player1_beast_id: number;
  player2_beast_id: number | null;
  winner_id: string | null;
  status: 'waiting' | 'active' | 'completed' | 'abandoned';
  current_turn: 'player1' | 'player2' | null;
  turn_number: number;
  turn_time_remaining: number;
  room_code: string | null;
  battle_data: {
    moves: any[];
    player1_beast_state: any;
    player2_beast_state: any;
  };
  created_at: string;
  updated_at: string;
  ended_at: string | null;
}

/**
 * Creates a new battle room with a unique room code
 * 
 * Requirements: 3.1
 * 
 * @param params - Battle room creation parameters
 * @returns The created battle room with room code
 * @throws Error if room creation fails
 */
export async function createBattleRoom(
  params: CreateBattleRoomParams
): Promise<BattleRoom> {
  const { player1_id, player1_beast_id, player1_beast } = params;

  // Validate beast data if provided
  if (player1_beast) {
    const validation = validateBeastData(player1_beast);
    if (!validation.isValid) {
      throw new AppError(
        validation.error || 'Invalid beast data',
        ErrorType.VALIDATION,
        false
      );
    }
  }

  // Generate a unique room code with retry logic
  const roomCode = await retryWithBackoff(
    () => generateUniqueRoomCode(),
    {
      maxAttempts: 3,
      delayMs: 500,
      onRetry: (attempt) => {
        console.log(`Retrying room code generation (attempt ${attempt})`);
      },
    }
  );

  // Create the battle room in the database with retry logic
  return await safeDbOperation(async () => {
    const { data, error } = await supabase
      .from('battles')
      .insert({
        player1_id,
        player1_beast_id,
        room_code: roomCode,
        status: 'waiting',
        turn_number: 1,
        turn_time_remaining: 30,
        battle_data: {
          moves: [],
          player1_beast_state: {},
          player2_beast_state: {},
        },
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create battle room: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to create battle room: No data returned');
    }

    return data as BattleRoom;
  }, 'create battle room');
}

/**
 * Joins an existing battle room using a room code
 * 
 * Requirements: 3.2, 3.3, 7.1
 * 
 * @param params - Battle room join parameters
 * @returns The updated battle room
 * @throws Error if room code is invalid or join fails
 */
export async function joinBattleRoom(
  params: JoinBattleRoomParams
): Promise<BattleRoom> {
  const { room_code, player2_id, player2_beast_id, player2_beast } = params;

  // Validate beast data if provided
  if (player2_beast) {
    const validation = validateBeastData(player2_beast);
    if (!validation.isValid) {
      throw new AppError(
        validation.error || 'Invalid beast data',
        ErrorType.VALIDATION,
        false
      );
    }
  }

  // Validate the room code format and existence with retry logic
  const validation = await retryWithBackoff(
    () => validateRoomCode(room_code),
    {
      maxAttempts: 2,
      delayMs: 500,
    }
  );
  
  if (!validation.isValid) {
    throw new AppError(
      validation.error || 'Invalid room code',
      ErrorType.VALIDATION,
      false
    );
  }

  // Get the battle room with retry logic
  const battle = await safeDbOperation(
    () => getBattleByRoomCode(room_code),
    'fetch battle room'
  );

  if (!battle) {
    throw new AppError(
      'Room code not found. Please check the code and try again.',
      ErrorType.VALIDATION,
      false
    );
  }

  // Check if the room is available to join
  if (battle.status !== 'waiting') {
    throw new AppError(
      `Cannot join room: Battle is ${battle.status}`,
      ErrorType.VALIDATION,
      false
    );
  }

  if (battle.player2_id) {
    throw new AppError(
      'Room is already full',
      ErrorType.VALIDATION,
      false
    );
  }

  // Initialize battle state if both beasts are provided
  let battleData = battle.battle_data;
  if (player2_beast && battle.battle_data.player1_beast_state) {
    // If player1_beast_state exists, we can get player1 beast data
    // For now, we'll initialize with the data we have
    // The full initialization will happen when both beasts are loaded
    battleData = {
      ...battle.battle_data,
      player2_beast_state: {
        health: player2_beast.maxHealth,
        energy: player2_beast.maxEnergy,
      },
    };
  }

  // Update the battle room with player 2 information with retry logic
  return await safeDbOperation(async () => {
    const { data, error } = await supabase
      .from('battles')
      .update({
        player2_id,
        player2_beast_id,
        status: 'active',
        current_turn: 'player1', // Player 1 goes first
        battle_data: battleData,
      })
      .eq('id', battle.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to join battle room: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to join battle room: No data returned');
    }

    return data as BattleRoom;
  }, 'join battle room');
}

/**
 * Retrieves a battle room by its room code
 * 
 * Requirements: 3.2, 3.3
 * 
 * @param room_code - The room code to search for
 * @returns The battle room if found, null otherwise
 * @throws Error if database query fails
 */
export async function getBattleByRoomCode(
  room_code: string
): Promise<BattleRoom | null> {
  return await safeDbOperation(async () => {
    const { data, error } = await supabase
      .from('battles')
      .select('*')
      .eq('room_code', room_code)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to get battle by room code: ${error.message}`);
    }

    return data as BattleRoom | null;
  }, 'get battle by room code');
}

/**
 * Cleans up stale battle rooms that have been waiting for more than 10 minutes
 * 
 * Requirements: 3.5
 * 
 * @returns The number of rooms cleaned up
 * @throws Error if cleanup fails
 */
export async function cleanupStaleBattleRooms(): Promise<number> {
  return await safeDbOperation(async () => {
    // Calculate the timestamp for 10 minutes ago
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    // Delete stale battle rooms
    const { data, error } = await supabase
      .from('battles')
      .delete()
      .eq('status', 'waiting')
      .lt('created_at', tenMinutesAgo)
      .not('room_code', 'is', null)
      .select();

    if (error) {
      throw new Error(`Failed to cleanup stale battle rooms: ${error.message}`);
    }

    return data?.length || 0;
  }, 'cleanup stale battle rooms');
}
