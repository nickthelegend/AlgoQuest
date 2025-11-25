/**
 * Tests for Room Code Generation and Validation
 * 
 * This test suite includes both unit tests and property-based tests
 * for the room code generation system.
 */

import fc from 'fast-check';
import {
  generateRoomCode,
  isValidRoomCodeFormat,
  isRoomCodeUnique,
  generateUniqueRoomCode,
  validateRoomCode,
} from '../roomCode';
import { supabase } from '../supabase';

// Mock the supabase client
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('Room Code Generation and Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // =========================================================================
  // Unit Tests
  // =========================================================================

  describe('generateRoomCode', () => {
    it('should generate a 6-character code', () => {
      const code = generateRoomCode();
      expect(code).toHaveLength(6);
    });

    it('should only use allowed characters (no 0, O, I, 1, L)', () => {
      const code = generateRoomCode();
      const allowedChars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
      
      for (let i = 0; i < code.length; i++) {
        expect(allowedChars).toContain(code.charAt(i));
      }
    });

    it('should not contain ambiguous characters', () => {
      const code = generateRoomCode();
      const ambiguousChars = ['0', 'O', 'I', '1', 'L'];
      
      for (const char of ambiguousChars) {
        expect(code).not.toContain(char);
      }
    });

    it('should generate different codes on multiple calls', () => {
      const codes = new Set();
      for (let i = 0; i < 100; i++) {
        codes.add(generateRoomCode());
      }
      
      // With 100 generations, we should have high probability of uniqueness
      // (though not guaranteed due to randomness)
      expect(codes.size).toBeGreaterThan(90);
    });
  });

  describe('isValidRoomCodeFormat', () => {
    it('should return true for valid 6-character codes', () => {
      expect(isValidRoomCodeFormat('ABC234')).toBe(true);
      expect(isValidRoomCodeFormat('XYZ789')).toBe(true);
      expect(isValidRoomCodeFormat('2H4K9P')).toBe(true);
    });

    it('should return false for codes with wrong length', () => {
      expect(isValidRoomCodeFormat('ABC')).toBe(false);
      expect(isValidRoomCodeFormat('ABCDEFG')).toBe(false);
      expect(isValidRoomCodeFormat('')).toBe(false);
    });

    it('should return false for codes with ambiguous characters', () => {
      expect(isValidRoomCodeFormat('ABC0DE')).toBe(false); // Contains 0
      expect(isValidRoomCodeFormat('ABCODE')).toBe(false); // Contains O
      expect(isValidRoomCodeFormat('ABC1DE')).toBe(false); // Contains 1
      expect(isValidRoomCodeFormat('ABCIDE')).toBe(false); // Contains I
      expect(isValidRoomCodeFormat('ABCLDE')).toBe(false); // Contains L
    });

    it('should return false for codes with lowercase letters', () => {
      expect(isValidRoomCodeFormat('abc234')).toBe(false);
    });

    it('should return false for codes with special characters', () => {
      expect(isValidRoomCodeFormat('ABC-34')).toBe(false);
      expect(isValidRoomCodeFormat('ABC@34')).toBe(false);
    });

    it('should return false for null or undefined', () => {
      expect(isValidRoomCodeFormat(null as any)).toBe(false);
      expect(isValidRoomCodeFormat(undefined as any)).toBe(false);
    });
  });

  describe('isRoomCodeUnique', () => {
    it('should return true when code does not exist', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const result = await isRoomCodeUnique('ABC234');
      expect(result).toBe(true);
    });

    it('should return false when code exists', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { room_code: 'ABC234' },
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const result = await isRoomCodeUnique('ABC234');
      expect(result).toBe(false);
    });

    it('should throw error when database query fails', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' },
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      await expect(isRoomCodeUnique('ABC234')).rejects.toThrow(
        'Failed to check room code uniqueness: Database error'
      );
    });
  });

  describe('generateUniqueRoomCode', () => {
    it('should return a unique code on first attempt', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const code = await generateUniqueRoomCode();
      expect(code).toHaveLength(6);
      expect(isValidRoomCodeFormat(code)).toBe(true);
    });

    it('should retry on collision and eventually succeed', async () => {
      let callCount = 0;
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockImplementation(() => {
              callCount++;
              // First two calls return collision, third succeeds
              if (callCount <= 2) {
                return Promise.resolve({
                  data: { room_code: 'COLLISION' },
                  error: null,
                });
              }
              return Promise.resolve({ data: null, error: null });
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const code = await generateUniqueRoomCode();
      expect(code).toHaveLength(6);
      expect(callCount).toBe(3);
    });

    it('should throw error after max retries', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { room_code: 'COLLISION' },
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      await expect(generateUniqueRoomCode()).rejects.toThrow(
        'Failed to generate unique room code after 5 attempts'
      );
    });
  });

  describe('validateRoomCode', () => {
    it('should return invalid for malformed codes', async () => {
      const result = await validateRoomCode('ABC');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid room code format');
    });

    it('should return invalid for non-existent codes', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const result = await validateRoomCode('ABC234');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Room code not found');
    });

    it('should return valid for existing codes', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: { room_code: 'ABC234' },
              error: null,
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const result = await validateRoomCode('ABC234');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should handle database errors gracefully', async () => {
      const mockFrom = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Connection failed' },
            }),
          }),
        }),
      });
      (supabase.from as jest.Mock) = mockFrom;

      const result = await validateRoomCode('ABC234');
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Failed to validate room code');
    });
  });

  // =========================================================================
  // Property-Based Tests
  // =========================================================================

  describe('Property-Based Tests', () => {
    /**
     * Feature: battle-system-refactor, Property 1: Room Code Uniqueness
     * Validates: Requirements 3.1
     */
    it('should generate codes that pass format validation', () => {
      fc.assert(
        fc.property(fc.nat(100), (iterations) => {
          for (let i = 0; i < iterations; i++) {
            const code = generateRoomCode();
            expect(isValidRoomCodeFormat(code)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    });

    it('should generate codes with high uniqueness probability', () => {
      fc.assert(
        fc.property(fc.constant(null), () => {
          const codes = new Set<string>();
          const numCodes = 1000;
          
          for (let i = 0; i < numCodes; i++) {
            codes.add(generateRoomCode());
          }
          
          // With 32^6 possible codes, collision probability is very low
          // We expect at least 99% uniqueness in 1000 generations
          const uniquenessRatio = codes.size / numCodes;
          expect(uniquenessRatio).toBeGreaterThan(0.99);
        }),
        { numRuns: 10 } // Run fewer times since each run generates 1000 codes
      );
    });

    it('should validate format correctly for any string', () => {
      fc.assert(
        fc.property(fc.string(), (str) => {
          const result = isValidRoomCodeFormat(str);
          
          if (result) {
            // If validation passes, code must be 6 chars and use only allowed chars
            expect(str).toHaveLength(6);
            const allowedChars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
            for (let i = 0; i < str.length; i++) {
              expect(allowedChars).toContain(str.charAt(i));
            }
          }
        }),
        { numRuns: 100 }
      );
    });
  });
});
