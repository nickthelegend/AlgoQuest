/**
 * Battle Integration Helper
 * 
 * This module provides helper functions to integrate battle state management
 * with the battle arena UI and real-time synchronization.
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import {
  executeMove,
  updateBattleStateAfterMove,
  switchTurn,
  checkWinCondition,
  Beast,
  BeastAbility,
  BattleData,
} from './battleState';
import { supabase } from './supabase';
import {
  retryWithBackoff,
  safeDbOperation,
  AppError,
  ErrorType,
} from './errorHandling';

/**
 * Handles a player's move in a battle
 * 
 * This function:
 * 1. Executes the move and calculates effects
 * 2. Updates battle state in database
 * 3. Checks for win condition
 * 4. Switches turn if battle continues
 * 
 * @param battleId - The battle ID
 * @param playerId - The player making the move
 * @param isPlayer1 - Whether the player is player1
 * @param attacker - The attacking beast
 * @param defender - The defending beast
 * @param ability - The ability being used
 * @param currentBattleData - Current battle data
 * @returns Updated battle data and winner (if any)
 */
export async function handleBattleMove(
  battleId: string,
  playerId: string,
  isPlayer1: boolean,
  attacker: Beast,
  defender: Beast,
  ability: BeastAbility,
  currentBattleData: BattleData
): Promise<{
  battleData: BattleData;
  winner: 'player1' | 'player2' | null;
  moveResult: any;
}> {
  // Execute the move
  const moveResult = executeMove(attacker, defender, ability);

  // Update battle state in database
  const updatedBattleData = await updateBattleStateAfterMove(
    battleId,
    playerId,
    isPlayer1,
    ability,
    moveResult,
    currentBattleData
  );

  // Check for winner
  const winner = checkWinCondition(
    updatedBattleData.player1_beast_state.health,
    updatedBattleData.player2_beast_state.health
  );

  // If no winner, switch turn
  if (!winner) {
    // Get current turn info
    const { data: battle } = await supabase
      .from('battles')
      .select('current_turn, turn_number')
      .eq('id', battleId)
      .single();

    if (battle) {
      await switchTurn(battleId, battle.current_turn, battle.turn_number);
    }
  }

  return {
    battleData: updatedBattleData,
    winner,
    moveResult,
  };
}

/**
 * Loads battle state from database
 * 
 * @param battleId - The battle ID
 * @returns Battle data
 */
export async function loadBattleState(battleId: string): Promise<{
  battleData: BattleData;
  currentTurn: 'player1' | 'player2';
  turnNumber: number;
  turnTimeRemaining: number;
  status: string;
}> {
  return await safeDbOperation(async () => {
    const { data: battle, error } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (error || !battle) {
      throw new AppError(
        'Failed to load battle state',
        ErrorType.DATABASE,
        true
      );
    }

    return {
      battleData: battle.battle_data,
      currentTurn: battle.current_turn,
      turnNumber: battle.turn_number,
      turnTimeRemaining: battle.turn_time_remaining,
      status: battle.status,
    };
  }, 'load battle state');
}

/**
 * Handles turn timeout
 * 
 * @param battleId - The battle ID
 * @param currentTurn - Current turn
 * @param turnNumber - Current turn number
 */
export async function handleTurnTimeout(
  battleId: string,
  currentTurn: 'player1' | 'player2',
  turnNumber: number
): Promise<void> {
  await switchTurn(battleId, currentTurn, turnNumber);
}

/**
 * Gets the current battle state for a player
 * 
 * @param battleId - The battle ID
 * @param playerId - The player ID
 * @returns Player's perspective of battle state
 */
export async function getPlayerBattleState(
  battleId: string,
  playerId: string
): Promise<{
  isMyTurn: boolean;
  myBeastState: any;
  opponentBeastState: any;
  isPlayer1: boolean;
}> {
  return await safeDbOperation(async () => {
    const { data: battle, error } = await supabase
      .from('battles')
      .select('*')
      .eq('id', battleId)
      .single();

    if (error || !battle) {
      throw new AppError(
        'Failed to load battle state',
        ErrorType.DATABASE,
        true
      );
    }

    const isPlayer1 = battle.player1_id === playerId;
    const isMyTurn = (isPlayer1 && battle.current_turn === 'player1') || 
                     (!isPlayer1 && battle.current_turn === 'player2');

    return {
      isMyTurn,
      myBeastState: isPlayer1 
        ? battle.battle_data.player1_beast_state 
        : battle.battle_data.player2_beast_state,
      opponentBeastState: isPlayer1 
        ? battle.battle_data.player2_beast_state 
        : battle.battle_data.player1_beast_state,
      isPlayer1,
    };
  }, 'get player battle state');
}
