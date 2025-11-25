/**
 * Battle Room Management Module Tests
 * 
 * Tests for battle room creation, joining, retrieval, and cleanup functions.
 */

import {
  createBattleRoom,
  joinBattleRoom,
  getBattleByRoomCode,
  cleanupStaleBattleRooms,
  CreateBattleRoomParams,
  JoinBattleRoomParams,
} from '../battleRoom';
import { supabase } from '../supabase';

// Mock the supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

// Mock the roomCode module
jest.mock('../roomCode', () => ({
  generateUniqueRoomCode: jest.fn(),
  validateRoomCode: jest.fn(),
}));

import { generateUniqueRoomCode, validateRoomCode } from '../roomCode';

describe('Battle Room Management', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBattleRoom', () => {
    it('should create a battle room with a unique room code', async () => {
      const mockRoomCode = 'ABC123';
      const mockBattleRoom = {
        id: 'battle-id-1',
        player1_id: 'user-1',
        player1_beast_id: 1,
        player2_id: null,
        player2_beast_id: null,
        winner_id: null,
        status: 'waiting',
        current_turn: null,
        turn_number: 1,
        turn_time_remaining: 30,
        room_code: mockRoomCode,
        battle_data: {
          moves: [],
          player1_beast_state: {},
          player2_beast_state: {},
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ended_at: null,
      };

      (generateUniqueRoomCode as jest.Mock).mockResolvedValue(mockRoomCode);
      
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockBattleRoom,
          error: null,
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const params: CreateBattleRoomParams = {
        player1_id: 'user-1',
        player1_beast_id: 1,
      };

      const result = await createBattleRoom(params);

      expect(generateUniqueRoomCode).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('battles');
      expect(mockInsert).toHaveBeenCalledWith({
        player1_id: 'user-1',
        player1_beast_id: 1,
        room_code: mockRoomCode,
        status: 'waiting',
        turn_number: 1,
        turn_time_remaining: 30,
        battle_data: {
          moves: [],
          player1_beast_state: {},
          player2_beast_state: {},
        },
      });
      expect(result).toEqual(mockBattleRoom);
    });

    it('should throw an error if room creation fails', async () => {
      (generateUniqueRoomCode as jest.Mock).mockResolvedValue('ABC123');
      
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      });

      const mockInsert = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const params: CreateBattleRoomParams = {
        player1_id: 'user-1',
        player1_beast_id: 1,
      };

      await expect(createBattleRoom(params)).rejects.toThrow('Failed to create battle room: Database error');
    });
  });

  describe('joinBattleRoom', () => {
    it('should join a battle room with a valid room code', async () => {
      const mockRoomCode = 'ABC123';
      const mockExistingBattle = {
        id: 'battle-id-1',
        player1_id: 'user-1',
        player1_beast_id: 1,
        player2_id: null,
        player2_beast_id: null,
        status: 'waiting',
        room_code: mockRoomCode,
      };

      const mockUpdatedBattle = {
        ...mockExistingBattle,
        player2_id: 'user-2',
        player2_beast_id: 2,
        status: 'active',
        current_turn: 'player1',
      };

      (validateRoomCode as jest.Mock).mockResolvedValue({ isValid: true });

      // Mock getBattleByRoomCode
      const mockMaybeSingle = jest.fn()
        .mockResolvedValueOnce({
          data: mockExistingBattle,
          error: null,
        });

      // Mock update
      const mockSelect = jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({
          data: mockUpdatedBattle,
          error: null,
        }),
      });

      const mockEq = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockUpdate = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock)
        .mockReturnValueOnce({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        })
        .mockReturnValueOnce({
          update: mockUpdate,
        });

      const params: JoinBattleRoomParams = {
        room_code: mockRoomCode,
        player2_id: 'user-2',
        player2_beast_id: 2,
      };

      const result = await joinBattleRoom(params);

      expect(validateRoomCode).toHaveBeenCalledWith(mockRoomCode);
      expect(result.status).toBe('active');
      expect(result.player2_id).toBe('user-2');
      expect(result.current_turn).toBe('player1');
    });

    it('should throw an error for invalid room code', async () => {
      (validateRoomCode as jest.Mock).mockResolvedValue({
        isValid: false,
        error: 'Invalid room code format',
      });

      const params: JoinBattleRoomParams = {
        room_code: 'INVALID',
        player2_id: 'user-2',
        player2_beast_id: 2,
      };

      await expect(joinBattleRoom(params)).rejects.toThrow('Invalid room code format');
    });

    it('should throw an error if room is not in waiting status', async () => {
      const mockRoomCode = 'ABC123';
      const mockExistingBattle = {
        id: 'battle-id-1',
        status: 'active',
        room_code: mockRoomCode,
      };

      (validateRoomCode as jest.Mock).mockResolvedValue({ isValid: true });

      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockExistingBattle,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const params: JoinBattleRoomParams = {
        room_code: mockRoomCode,
        player2_id: 'user-2',
        player2_beast_id: 2,
      };

      await expect(joinBattleRoom(params)).rejects.toThrow('Cannot join room: Battle is active');
    });
  });

  describe('getBattleByRoomCode', () => {
    it('should retrieve a battle room by room code', async () => {
      const mockRoomCode = 'ABC123';
      const mockBattle = {
        id: 'battle-id-1',
        room_code: mockRoomCode,
        status: 'waiting',
      };

      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: mockBattle,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const result = await getBattleByRoomCode(mockRoomCode);

      expect(supabase.from).toHaveBeenCalledWith('battles');
      expect(result).toEqual(mockBattle);
    });

    it('should return null if room code not found', async () => {
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: mockMaybeSingle,
          }),
        }),
      });

      const result = await getBattleByRoomCode('NOTFOUND');

      expect(result).toBeNull();
    });
  });

  describe('cleanupStaleBattleRooms', () => {
    it('should delete stale battle rooms older than 10 minutes', async () => {
      const mockDeletedRooms = [
        { id: 'battle-1', room_code: 'ABC123' },
        { id: 'battle-2', room_code: 'DEF456' },
      ];

      const mockSelect = jest.fn().mockResolvedValue({
        data: mockDeletedRooms,
        error: null,
      });

      const mockNot = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockLt = jest.fn().mockReturnValue({
        not: mockNot,
      });

      const mockEq = jest.fn().mockReturnValue({
        lt: mockLt,
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await cleanupStaleBattleRooms();

      expect(supabase.from).toHaveBeenCalledWith('battles');
      expect(mockDelete).toHaveBeenCalled();
      expect(result).toBe(2);
    });

    it('should return 0 if no stale rooms found', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });

      const mockNot = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockLt = jest.fn().mockReturnValue({
        not: mockNot,
      });

      const mockEq = jest.fn().mockReturnValue({
        lt: mockLt,
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      const result = await cleanupStaleBattleRooms();

      expect(result).toBe(0);
    });

    it('should throw an error if cleanup fails', async () => {
      const mockSelect = jest.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      const mockNot = jest.fn().mockReturnValue({
        select: mockSelect,
      });

      const mockLt = jest.fn().mockReturnValue({
        not: mockNot,
      });

      const mockEq = jest.fn().mockReturnValue({
        lt: mockLt,
      });

      const mockDelete = jest.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        delete: mockDelete,
      });

      await expect(cleanupStaleBattleRooms()).rejects.toThrow('Failed to cleanup stale battle rooms: Database error');
    });
  });
});
