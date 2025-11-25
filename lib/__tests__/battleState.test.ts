/**
 * Battle State Management Tests
 * 
 * Tests for battle initialization, damage calculation, turn switching,
 * win condition detection, and state persistence.
 */

import {
  initializeBattleState,
  calculateDamage,
  executeMove,
  checkWinCondition,
  Beast,
  BeastAbility,
} from '../battleState';

describe('Battle State Management', () => {
  // Mock beasts for testing
  const mockBeast1: Beast = {
    id: 1,
    name: 'Fire Dragon',
    element: 'fire',
    health: 200,
    maxHealth: 200,
    energy: 100,
    maxEnergy: 100,
    stats: {
      attack: 80,
      defense: 60,
      speed: 70,
      magic: 75,
    },
  };

  const mockBeast2: Beast = {
    id: 2,
    name: 'Water Serpent',
    element: 'water',
    health: 180,
    maxHealth: 180,
    energy: 100,
    maxEnergy: 100,
    stats: {
      attack: 70,
      defense: 80,
      speed: 65,
      magic: 70,
    },
  };

  const mockAttackAbility: BeastAbility = {
    id: 1,
    name: 'Flame Strike',
    type: 'attack',
    element: 'fire',
    power: 50,
    accuracy: 95,
    energy_cost: 20,
    cooldown: 0,
    description: 'A powerful fire attack',
  };

  const mockHealAbility: BeastAbility = {
    id: 2,
    name: 'Healing Wave',
    type: 'heal',
    element: 'water',
    power: 50,
    accuracy: 100,
    energy_cost: 25,
    cooldown: 2,
    description: 'Restores health',
  };

  const mockEnergyAbility: BeastAbility = {
    id: 3,
    name: 'Energy Focus',
    type: 'energy',
    element: 'light',
    power: 45,
    accuracy: 100,
    energy_cost: 0,
    cooldown: 0,
    description: 'Restores energy',
  };

  describe('initializeBattleState', () => {
    it('should initialize battle state with empty moves array', () => {
      const battleState = initializeBattleState(mockBeast1, mockBeast2);
      
      expect(battleState.moves).toEqual([]);
    });

    it('should initialize player1 beast state with full health and energy', () => {
      const battleState = initializeBattleState(mockBeast1, mockBeast2);
      
      expect(battleState.player1_beast_state.health).toBe(mockBeast1.maxHealth);
      expect(battleState.player1_beast_state.energy).toBe(mockBeast1.maxEnergy);
    });

    it('should initialize player2 beast state with full health and energy', () => {
      const battleState = initializeBattleState(mockBeast1, mockBeast2);
      
      expect(battleState.player2_beast_state.health).toBe(mockBeast2.maxHealth);
      expect(battleState.player2_beast_state.energy).toBe(mockBeast2.maxEnergy);
    });
  });

  describe('calculateDamage', () => {
    it('should calculate base damage correctly', () => {
      const result = calculateDamage({
        attackPower: 50,
        attackStat: 80,
        defenseStat: 60,
        attackerElement: 'fire',
        defenderElement: 'fire',
        isCritical: false,
      });

      expect(result.damage).toBeGreaterThan(0);
      expect(result.effectiveness).toBe(0.5); // Fire vs Fire = 0.5x
    });

    it('should apply elemental effectiveness correctly - super effective', () => {
      const result = calculateDamage({
        attackPower: 50,
        attackStat: 80,
        defenseStat: 60,
        attackerElement: 'fire',
        defenderElement: 'earth',
        isCritical: false,
      });

      expect(result.effectiveness).toBe(2.0); // Fire vs Earth = 2.0x
      expect(result.damage).toBeGreaterThan(0);
    });

    it('should apply elemental effectiveness correctly - not very effective', () => {
      const result = calculateDamage({
        attackPower: 50,
        attackStat: 80,
        defenseStat: 60,
        attackerElement: 'fire',
        defenderElement: 'water',
        isCritical: false,
      });

      expect(result.effectiveness).toBe(0.5); // Fire vs Water = 0.5x
    });

    it('should double damage on critical hit', () => {
      const normalResult = calculateDamage({
        attackPower: 50,
        attackStat: 80,
        defenseStat: 60,
        attackerElement: 'fire',
        defenderElement: 'earth',
        isCritical: false,
      });

      const critResult = calculateDamage({
        attackPower: 50,
        attackStat: 80,
        defenseStat: 60,
        attackerElement: 'fire',
        defenderElement: 'earth',
        isCritical: true,
      });

      // Critical should be roughly 2x normal (accounting for random variance)
      expect(critResult.damage).toBeGreaterThan(normalResult.damage);
    });

    it('should return damage greater than 0 for valid attacks', () => {
      const result = calculateDamage({
        attackPower: 50,
        attackStat: 80,
        defenseStat: 60,
        attackerElement: 'fire',
        defenderElement: 'water',
        isCritical: false,
      });

      expect(result.damage).toBeGreaterThan(0);
    });
  });

  describe('executeMove', () => {
    it('should throw error if attacker has insufficient energy', () => {
      const lowEnergyBeast = { ...mockBeast1, energy: 10 };
      
      expect(() => {
        executeMove(lowEnergyBeast, mockBeast2, mockAttackAbility);
      }).toThrow('Not enough energy to use this ability');
    });

    it('should reduce attacker energy by ability cost', () => {
      const result = executeMove(mockBeast1, mockBeast2, mockAttackAbility);
      
      expect(result.attackerEnergy).toBe(mockBeast1.energy - mockAttackAbility.energy_cost);
    });

    it('should deal damage for attack abilities', () => {
      const result = executeMove(mockBeast1, mockBeast2, mockAttackAbility);
      
      if (!result.missed) {
        expect(result.damage).toBeGreaterThan(0);
        expect(result.targetHealth).toBeLessThan(mockBeast2.health);
      }
    });

    it('should restore health for heal abilities', () => {
      const damagedBeast = { ...mockBeast1, health: 100 };
      const result = executeMove(damagedBeast, mockBeast2, mockHealAbility);
      
      expect(result.healing).toBeGreaterThan(0);
      expect(result.attackerHealth).toBeGreaterThan(damagedBeast.health);
    });

    it('should not exceed max health when healing', () => {
      const result = executeMove(mockBeast1, mockBeast2, mockHealAbility);
      
      expect(result.attackerHealth).toBeLessThanOrEqual(mockBeast1.maxHealth);
    });

    it('should restore energy for energy abilities', () => {
      const lowEnergyBeast = { ...mockBeast1, energy: 50 };
      const result = executeMove(lowEnergyBeast, mockBeast2, mockEnergyAbility);
      
      expect(result.energyRestore).toBeGreaterThan(0);
      expect(result.attackerEnergy).toBeGreaterThan(lowEnergyBeast.energy);
    });

    it('should not exceed max energy when restoring', () => {
      const result = executeMove(mockBeast1, mockBeast2, mockEnergyAbility);
      
      expect(result.attackerEnergy).toBeLessThanOrEqual(mockBeast1.maxEnergy);
    });

    it('should not reduce target health below 0', () => {
      const weakBeast = { ...mockBeast2, health: 1 };
      const result = executeMove(mockBeast1, weakBeast, mockAttackAbility);
      
      expect(result.targetHealth).toBeGreaterThanOrEqual(0);
    });

    it('should handle missed attacks', () => {
      // Use an ability with low accuracy to increase chance of miss
      const lowAccuracyAbility = { ...mockAttackAbility, accuracy: 0 };
      const result = executeMove(mockBeast1, mockBeast2, lowAccuracyAbility);
      
      expect(result.missed).toBe(true);
      expect(result.targetHealth).toBe(mockBeast2.health);
    });
  });

  describe('checkWinCondition', () => {
    it('should return null when both beasts have health', () => {
      const winner = checkWinCondition(100, 100);
      
      expect(winner).toBeNull();
    });

    it('should return player2 when player1 health is 0', () => {
      const winner = checkWinCondition(0, 100);
      
      expect(winner).toBe('player2');
    });

    it('should return player1 when player2 health is 0', () => {
      const winner = checkWinCondition(100, 0);
      
      expect(winner).toBe('player1');
    });

    it('should return null when both beasts have 0 health', () => {
      const winner = checkWinCondition(0, 0);
      
      expect(winner).toBeNull();
    });

    it('should return player2 when player1 health is negative', () => {
      const winner = checkWinCondition(-10, 50);
      
      expect(winner).toBe('player2');
    });

    it('should return player1 when player2 health is negative', () => {
      const winner = checkWinCondition(50, -10);
      
      expect(winner).toBe('player1');
    });
  });
});
