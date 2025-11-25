/**
 * Battle State Management Module
 * 
 * This module provides functions for managing battle state including:
 * - Battle initialization with proper initial state
 * - Damage calculation with elemental effectiveness
 * - Turn switching logic with timer reset
 * - Win condition detection
 * - Battle state persistence to database
 * 
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { supabase } from './supabase';

/**
 * Beast interface for battle calculations
 */
export interface Beast {
  id: number | string;
  name: string;
  element: 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    magic?: number;
  };
}

/**
 * Beast ability interface
 */
export interface BeastAbility {
  id: string | number;
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

/**
 * Beast state for battle tracking
 */
export interface BeastState {
  health: number;
  energy: number;
  status?: {
    type: 'burn' | 'freeze' | 'stun' | 'poison';
    duration: number;
  };
  buffs?: Array<{
    type: 'attack' | 'defense' | 'speed';
    value: number;
    duration: number;
  }>;
}

/**
 * Move result interface
 */
export interface MoveResult {
  damage?: number;
  healing?: number;
  energyRestore?: number;
  isCritical: boolean;
  effectiveness: number;
  targetHealth: number;
  targetEnergy: number;
  attackerHealth: number;
  attackerEnergy: number;
  missed?: boolean;
}

/**
 * Battle data structure
 */
export interface BattleData {
  moves: Array<{
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
  }>;
  player1_beast_state: BeastState;
  player2_beast_state: BeastState;
}

/**
 * Elemental effectiveness chart
 * Maps attacker element -> defender element -> effectiveness multiplier
 */
const ELEMENTAL_CHART: Record<string, Record<string, number>> = {
  fire: { water: 0.5, earth: 2.0, wind: 1.5, light: 1.0, dark: 1.0, fire: 0.5 },
  water: { fire: 2.0, earth: 0.5, wind: 1.0, light: 1.0, dark: 1.0, water: 0.5 },
  earth: { fire: 0.5, water: 2.0, wind: 0.5, light: 1.0, dark: 1.0, earth: 0.5 },
  wind: { fire: 0.5, water: 1.0, earth: 2.0, light: 1.0, dark: 1.0, wind: 0.5 },
  light: { dark: 2.0, fire: 1.0, water: 1.0, earth: 1.0, wind: 1.0, light: 0.5 },
  dark: { light: 2.0, fire: 1.0, water: 1.0, earth: 1.0, wind: 1.0, dark: 0.5 },
};

/**
 * Initializes battle state with proper initial values
 * 
 * Requirements: 7.1
 * 
 * @param player1Beast - Player 1's beast
 * @param player2Beast - Player 2's beast
 * @returns Initial battle data structure
 */
export function initializeBattleState(
  player1Beast: Beast,
  player2Beast: Beast
): BattleData {
  return {
    moves: [],
    player1_beast_state: {
      health: player1Beast.maxHealth,
      energy: player1Beast.maxEnergy,
    },
    player2_beast_state: {
      health: player2Beast.maxHealth,
      energy: player2Beast.maxEnergy,
    },
  };
}

/**
 * Calculates damage with elemental effectiveness
 * 
 * Requirements: 7.2
 * 
 * @param params - Damage calculation parameters
 * @returns Calculated damage amount
 */
export function calculateDamage(params: {
  attackPower: number;
  attackStat: number;
  defenseStat: number;
  attackerElement: string;
  defenderElement: string;
  isCritical: boolean;
}): { damage: number; effectiveness: number } {
  const { attackPower, attackStat, defenseStat, attackerElement, defenderElement, isCritical } = params;

  // Get elemental effectiveness
  let effectiveness = 1.0;
  if (ELEMENTAL_CHART[attackerElement] && ELEMENTAL_CHART[attackerElement][defenderElement]) {
    effectiveness = ELEMENTAL_CHART[attackerElement][defenderElement];
  }

  // Base damage calculation: power * (attack / defense) * effectiveness * random factor
  let damage = attackPower * (attackStat / defenseStat) * 0.4 * effectiveness;
  
  // Add random variance (75% to 125% of base damage)
  damage = damage * (0.75 + Math.random() * 0.5);

  // Apply critical hit multiplier
  if (isCritical) {
    damage *= 2;
  }

  return {
    damage: Math.round(damage),
    effectiveness,
  };
}

/**
 * Executes a move and calculates all effects
 * 
 * Requirements: 7.2
 * 
 * @param attacker - The attacking beast
 * @param defender - The defending beast
 * @param ability - The ability being used
 * @returns Move result with all calculated values
 */
export function executeMove(
  attacker: Beast,
  defender: Beast,
  ability: BeastAbility
): MoveResult {
  // Check if attacker has enough energy
  if (attacker.energy < ability.energy_cost) {
    throw new Error('Not enough energy to use this ability');
  }

  // Calculate hit chance
  const hitRoll = Math.random() * 100;
  const missChance = 100 - ability.accuracy;

  if (hitRoll < missChance) {
    // Attack missed
    return {
      missed: true,
      isCritical: false,
      effectiveness: 1.0,
      targetHealth: defender.health,
      targetEnergy: defender.energy,
      attackerHealth: attacker.health,
      attackerEnergy: Math.max(0, attacker.energy - ability.energy_cost),
    };
  }

  // Calculate critical hit chance (base 10% + bonus from low health)
  const healthPercentage = attacker.health / attacker.maxHealth;
  const baseCritChance = 10;
  const lowHealthBonus = (1 - healthPercentage) * 20;
  const critChance = baseCritChance + lowHealthBonus;
  const critRoll = Math.random() * 100;
  const isCritical = critRoll < critChance;

  let damage = 0;
  let healing = 0;
  let energyRestore = 0;
  let effectiveness = 1.0;

  // Calculate effects based on ability type
  if (ability.type === 'attack') {
    const damageResult = calculateDamage({
      attackPower: ability.power,
      attackStat: attacker.stats.attack,
      defenseStat: defender.stats.defense,
      attackerElement: ability.element,
      defenderElement: defender.element,
      isCritical,
    });
    damage = damageResult.damage;
    effectiveness = damageResult.effectiveness;
  } else if (ability.type === 'heal') {
    healing = Math.round(ability.power * 0.8);
  } else if (ability.type === 'energy') {
    energyRestore = 30 + Math.floor(Math.random() * 31); // 30-60 energy
  }

  // Calculate new health and energy values
  const newDefenderHealth = Math.max(0, defender.health - damage);
  const newAttackerHealth = Math.min(attacker.maxHealth, attacker.health + healing);
  const newAttackerEnergy = Math.min(
    attacker.maxEnergy,
    Math.max(0, attacker.energy - ability.energy_cost + energyRestore)
  );

  return {
    damage,
    healing,
    energyRestore,
    isCritical,
    effectiveness,
    targetHealth: newDefenderHealth,
    targetEnergy: defender.energy,
    attackerHealth: newAttackerHealth,
    attackerEnergy: newAttackerEnergy,
  };
}

/**
 * Switches turn to the other player and resets timer
 * 
 * Requirements: 7.3
 * 
 * @param battleId - The battle ID
 * @param currentTurn - Current turn ('player1' or 'player2')
 * @param turnNumber - Current turn number
 * @returns Updated battle state
 */
export async function switchTurn(
  battleId: string,
  currentTurn: 'player1' | 'player2',
  turnNumber: number
): Promise<void> {
  const newTurn = currentTurn === 'player1' ? 'player2' : 'player1';
  const newTurnNumber = turnNumber + 1;

  const { error } = await supabase
    .from('battles')
    .update({
      current_turn: newTurn,
      turn_number: newTurnNumber,
      turn_time_remaining: 30, // Reset timer to 30 seconds
      updated_at: new Date().toISOString(),
    })
    .eq('id', battleId);

  if (error) {
    throw new Error(`Failed to switch turn: ${error.message}`);
  }
}

/**
 * Checks if win condition is met (health <= 0)
 * 
 * Requirements: 7.4
 * 
 * @param player1Health - Player 1's beast health
 * @param player2Health - Player 2's beast health
 * @returns Winner ID ('player1', 'player2', or null if no winner)
 */
export function checkWinCondition(
  player1Health: number,
  player2Health: number
): 'player1' | 'player2' | null {
  if (player1Health <= 0 && player2Health <= 0) {
    // Both beasts fainted, it's a draw - last one to attack wins
    // This is handled by the caller
    return null;
  }
  
  if (player1Health <= 0) {
    return 'player2';
  }
  
  if (player2Health <= 0) {
    return 'player1';
  }
  
  return null;
}

/**
 * Persists battle state to database
 * 
 * Requirements: 7.5
 * 
 * @param battleId - The battle ID
 * @param battleData - The battle data to persist
 * @param winnerId - Optional winner ID if battle is complete
 * @returns Success status
 */
export async function persistBattleState(
  battleId: string,
  battleData: BattleData,
  winnerId?: string
): Promise<void> {
  const updateData: any = {
    battle_data: battleData,
    updated_at: new Date().toISOString(),
  };

  // If there's a winner, mark battle as completed
  if (winnerId) {
    updateData.status = 'completed';
    updateData.winner_id = winnerId;
    updateData.ended_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('battles')
    .update(updateData)
    .eq('id', battleId);

  if (error) {
    throw new Error(`Failed to persist battle state: ${error.message}`);
  }
}

/**
 * Updates battle state after a move
 * 
 * Requirements: 7.2, 7.5
 * 
 * @param battleId - The battle ID
 * @param playerId - The player making the move
 * @param isPlayer1 - Whether the player is player1
 * @param ability - The ability used
 * @param moveResult - The result of the move
 * @param currentBattleData - Current battle data
 * @returns Updated battle data
 */
export async function updateBattleStateAfterMove(
  battleId: string,
  playerId: string,
  isPlayer1: boolean,
  ability: BeastAbility,
  moveResult: MoveResult,
  currentBattleData: BattleData
): Promise<BattleData> {
  // Create new move record
  const newMove = {
    id: Date.now().toString(),
    player_id: playerId,
    ability,
    ...moveResult,
    timestamp: Date.now(),
  };

  // Update beast states
  const updatedBattleData: BattleData = {
    moves: [...currentBattleData.moves, newMove],
    player1_beast_state: isPlayer1
      ? {
          ...currentBattleData.player1_beast_state,
          health: moveResult.attackerHealth,
          energy: moveResult.attackerEnergy,
        }
      : {
          ...currentBattleData.player1_beast_state,
          health: moveResult.targetHealth,
          energy: moveResult.targetEnergy,
        },
    player2_beast_state: !isPlayer1
      ? {
          ...currentBattleData.player2_beast_state,
          health: moveResult.attackerHealth,
          energy: moveResult.attackerEnergy,
        }
      : {
          ...currentBattleData.player2_beast_state,
          health: moveResult.targetHealth,
          energy: moveResult.targetEnergy,
        },
  };

  // Check for win condition
  const winner = checkWinCondition(
    updatedBattleData.player1_beast_state.health,
    updatedBattleData.player2_beast_state.health
  );

  // Determine actual winner ID if there is a winner
  let winnerId: string | undefined;
  if (winner) {
    // Get battle to find player IDs
    const { data: battle, error } = await supabase
      .from('battles')
      .select('player1_id, player2_id')
      .eq('id', battleId)
      .single();

    if (!error && battle) {
      winnerId = winner === 'player1' ? battle.player1_id : battle.player2_id;
    }
  }

  // Persist to database
  await persistBattleState(battleId, updatedBattleData, winnerId);

  return updatedBattleData;
}
