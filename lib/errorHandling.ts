/**
 * Error Handling and Fallbacks Module
 * 
 * This module provides centralized error handling utilities with retry logic,
 * validation, and user-friendly error messages.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { Alert, Platform } from 'react-native';
import { supabase } from './supabase';
import { Beast } from './battleState';

/**
 * Error types for categorization
 */
export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  PERMISSION = 'permission',
  REALTIME = 'realtime',
  DATABASE = 'database',
  UNKNOWN = 'unknown',
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  type: ErrorType;
  originalError?: Error;
  retryable: boolean;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN,
    retryable: boolean = false,
    originalError?: Error
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.retryable = retryable;
    this.originalError = originalError;
  }
}

/**
 * Network error detection
 */
export function isNetworkError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code?.toLowerCase() || '';
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('fetch') ||
    errorCode === 'econnrefused' ||
    errorCode === 'etimedout' ||
    errorCode === 'enotfound'
  );
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

/**
 * Retry a function with exponential backoff
 * 
 * Requirements: 10.1
 * 
 * @param fn - The async function to retry
 * @param config - Retry configuration
 * @returns The result of the function
 * @throws AppError if all retries fail
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Check if error is retryable
      if (!isNetworkError(error) && attempt === finalConfig.maxAttempts) {
        throw new AppError(
          lastError.message,
          ErrorType.NETWORK,
          false,
          lastError
        );
      }
      
      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt, lastError);
      }
      
      // Don't wait after the last attempt
      if (attempt < finalConfig.maxAttempts) {
        const delay = finalConfig.delayMs * Math.pow(finalConfig.backoffMultiplier, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new AppError(
    `Operation failed after ${finalConfig.maxAttempts} attempts: ${lastError?.message}`,
    ErrorType.NETWORK,
    false,
    lastError || undefined
  );
}

/**
 * Validate beast data before battle initiation
 * 
 * Requirements: 10.2
 * 
 * @param beast - The beast to validate
 * @returns Validation result with error message if invalid
 */
export function validateBeastData(beast: any): { isValid: boolean; error?: string } {
  if (!beast) {
    return { isValid: false, error: 'Beast data is missing' };
  }
  
  if (!beast.id) {
    return { isValid: false, error: 'Beast ID is missing' };
  }
  
  if (!beast.name || beast.name.trim() === '') {
    return { isValid: false, error: 'Beast name is missing' };
  }
  
  if (typeof beast.power !== 'number' || beast.power < 0) {
    return { isValid: false, error: 'Beast power is invalid' };
  }
  
  if (!beast.element) {
    return { isValid: false, error: 'Beast element is missing' };
  }
  
  if (!beast.owner_id) {
    return { isValid: false, error: 'Beast owner is missing' };
  }
  
  // Check for allocated stats
  if (!beast.allocated_stats) {
    return { isValid: false, error: 'Beast stats are missing' };
  }
  
  const stats = beast.allocated_stats;
  if (
    typeof stats.attack !== 'number' ||
    typeof stats.defense !== 'number' ||
    typeof stats.speed !== 'number' ||
    typeof stats.health !== 'number'
  ) {
    return { isValid: false, error: 'Beast stats are invalid' };
  }
  
  return { isValid: true };
}

/**
 * Validate room code format and provide feedback
 * 
 * Requirements: 10.3
 * 
 * @param roomCode - The room code to validate
 * @returns Validation result with user-friendly error message
 */
export function validateRoomCodeFormat(roomCode: string): { isValid: boolean; error?: string } {
  if (!roomCode || roomCode.trim() === '') {
    return {
      isValid: false,
      error: 'Please enter a room code',
    };
  }
  
  const trimmedCode = roomCode.trim().toUpperCase();
  
  if (trimmedCode.length !== 6) {
    return {
      isValid: false,
      error: 'Room code must be exactly 6 characters',
    };
  }
  
  // Check for valid characters (alphanumeric, excluding ambiguous ones)
  const validChars = /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/;
  if (!validChars.test(trimmedCode)) {
    return {
      isValid: false,
      error: 'Room code contains invalid characters. Please check and try again.',
    };
  }
  
  return { isValid: true };
}

/**
 * Handle invalid room code with user feedback
 * 
 * Requirements: 10.3
 * 
 * @param roomCode - The invalid room code
 * @param onRetry - Callback to retry with a new code
 */
export function handleInvalidRoomCode(roomCode: string, onRetry?: () => void): void {
  Alert.alert(
    'Room Not Found',
    `The room code "${roomCode}" was not found. Please check the code and try again.\n\nMake sure:\n• The code is exactly 6 characters\n• There are no spaces\n• The room hasn't expired (rooms expire after 10 minutes)`,
    [
      {
        text: 'Try Again',
        onPress: onRetry,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]
  );
}

/**
 * Permission types
 */
export enum PermissionType {
  BLUETOOTH = 'bluetooth',
  LOCATION = 'location',
  NOTIFICATIONS = 'notifications',
  NEARBY_DEVICES = 'nearby_devices',
}

/**
 * Get educational message for permission type
 */
function getPermissionEducationalMessage(permission: PermissionType): string {
  switch (permission) {
    case PermissionType.BLUETOOTH:
      return 'Bluetooth is required to discover and connect with nearby players for local battles.';
    case PermissionType.LOCATION:
      return 'Location permission is required for Bluetooth device discovery on Android.';
    case PermissionType.NOTIFICATIONS:
      return 'Notifications allow you to receive battle invitations and game updates.';
    case PermissionType.NEARBY_DEVICES:
      return 'Nearby devices permission is required to find and connect with players around you.';
    default:
      return 'This permission is required for the app to function properly.';
  }
}

/**
 * Handle permission denial with educational dialog
 * 
 * Requirements: 10.4
 * 
 * @param permission - The permission that was denied
 * @param onOpenSettings - Callback to open device settings
 */
export function handlePermissionDenied(
  permission: PermissionType,
  onOpenSettings?: () => void
): void {
  const message = getPermissionEducationalMessage(permission);
  
  Alert.alert(
    'Permission Required',
    `${message}\n\nTo enable this feature, please grant the permission in your device settings.`,
    [
      {
        text: 'Not Now',
        style: 'cancel',
      },
      {
        text: 'Open Settings',
        onPress: onOpenSettings || (() => {
          // Default behavior - could open settings using Linking
          console.log('Open settings requested');
        }),
      },
    ]
  );
}

/**
 * Handle real-time connection failure
 * 
 * Requirements: 10.5
 * 
 * @param onRetry - Callback to retry connection
 * @param onExit - Callback to exit battle
 */
export function handleRealtimeConnectionFailure(
  onRetry?: () => void,
  onExit?: () => void
): void {
  Alert.alert(
    'Connection Lost',
    'The real-time connection to the battle server was lost. This may be due to network issues.\n\nWould you like to try reconnecting?',
    [
      {
        text: 'Exit Battle',
        style: 'destructive',
        onPress: onExit,
      },
      {
        text: 'Retry',
        onPress: onRetry,
      },
    ]
  );
}

/**
 * Handle database query errors with retry
 * 
 * Requirements: 10.1
 * 
 * @param error - The database error
 * @param operation - Description of the operation that failed
 * @param onRetry - Callback to retry the operation
 */
export function handleDatabaseError(
  error: any,
  operation: string,
  onRetry?: () => void
): void {
  console.error(`Database error during ${operation}:`, error);
  
  const isNetwork = isNetworkError(error);
  const message = isNetwork
    ? `Network error while ${operation}. Please check your connection and try again.`
    : `An error occurred while ${operation}. Please try again.`;
  
  const buttons: any[] = [
    {
      text: 'Cancel',
      style: 'cancel',
    },
  ];
  
  if (onRetry) {
    buttons.push({
      text: 'Retry',
      onPress: onRetry,
    });
  }
  
  Alert.alert('Error', message, buttons);
}

/**
 * Safely execute a database operation with error handling
 * 
 * Requirements: 10.1
 * 
 * @param operation - The database operation to execute
 * @param operationName - Name of the operation for error messages
 * @returns The result of the operation
 */
export async function safeDbOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await retryWithBackoff(operation, {
      maxAttempts: 3,
      delayMs: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retrying ${operationName} (attempt ${attempt}):`, error.message);
      },
    });
  } catch (error) {
    throw new AppError(
      `Failed to ${operationName}: ${(error as Error).message}`,
      ErrorType.DATABASE,
      false,
      error as Error
    );
  }
}

/**
 * Log error for debugging
 */
export function logError(error: any, context: string): void {
  console.error(`[${context}]`, {
    message: error.message,
    type: error.type || 'unknown',
    stack: error.stack,
    originalError: error.originalError,
  });
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (error instanceof AppError) {
    return error.message;
  }
  
  if (isNetworkError(error)) {
    return 'Network connection error. Please check your internet connection and try again.';
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
