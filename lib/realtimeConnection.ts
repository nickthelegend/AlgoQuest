/**
 * Real-time Connection Management
 * 
 * This module provides utilities for managing Supabase real-time connections
 * with automatic reconnection and error handling.
 * 
 * Requirements: 10.5
 */

import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { handleRealtimeConnectionFailure, logError } from './errorHandling';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

export interface RealtimeConnectionConfig {
  channelName: string;
  onStatusChange?: (status: ConnectionStatus) => void;
  onError?: (error: Error) => void;
  maxReconnectAttempts?: number;
  reconnectDelay?: number;
}

/**
 * Manages a real-time connection with automatic reconnection
 */
export class RealtimeConnectionManager {
  private channel: RealtimeChannel | null = null;
  private config: RealtimeConnectionConfig;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isManualDisconnect = false;

  constructor(config: RealtimeConnectionConfig) {
    this.config = {
      maxReconnectAttempts: 5,
      reconnectDelay: 3000,
      ...config,
    };
  }

  /**
   * Connect to the real-time channel
   */
  async connect(): Promise<RealtimeChannel> {
    this.isManualDisconnect = false;
    
    if (this.channel) {
      console.log('Channel already exists, unsubscribing first');
      await this.disconnect();
    }

    this.updateStatus('connecting');

    try {
      this.channel = supabase.channel(this.config.channelName);

      // Subscribe to the channel
      this.channel.subscribe((status) => {
        console.log(`Channel ${this.config.channelName} status:`, status);

        if (status === 'SUBSCRIBED') {
          this.updateStatus('connected');
          this.reconnectAttempts = 0; // Reset reconnect attempts on successful connection
        } else if (status === 'CLOSED') {
          this.updateStatus('disconnected');
          this.handleDisconnection();
        } else if (status === 'CHANNEL_ERROR') {
          this.updateStatus('error');
          this.handleError(new Error('Channel error occurred'));
          this.handleDisconnection();
        }
      });

      return this.channel;
    } catch (error) {
      this.updateStatus('error');
      this.handleError(error as Error);
      throw error;
    }
  }

  /**
   * Disconnect from the real-time channel
   */
  async disconnect(): Promise<void> {
    this.isManualDisconnect = true;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      await this.channel.unsubscribe();
      this.channel = null;
    }

    this.updateStatus('disconnected');
  }

  /**
   * Get the current channel
   */
  getChannel(): RealtimeChannel | null {
    return this.channel;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.channel !== null;
  }

  /**
   * Handle disconnection with automatic reconnection
   */
  private handleDisconnection(): void {
    if (this.isManualDisconnect) {
      console.log('Manual disconnect, not attempting reconnection');
      return;
    }

    if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
      console.log('Max reconnection attempts reached');
      this.handleMaxReconnectAttemptsReached();
      return;
    }

    this.reconnectAttempts++;
    const delay = (this.config.reconnectDelay || 3000) * this.reconnectAttempts;

    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.config.maxReconnectAttempts}) in ${delay}ms`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect().catch((error) => {
        console.error('Reconnection failed:', error);
        this.handleError(error);
      });
    }, delay);
  }

  /**
   * Handle max reconnection attempts reached
   */
  private handleMaxReconnectAttemptsReached(): void {
    const error = new Error('Max reconnection attempts reached');
    this.handleError(error);

    // Show user-friendly error dialog
    handleRealtimeConnectionFailure(
      () => {
        // Reset and try again
        this.reconnectAttempts = 0;
        this.connect().catch((err) => {
          console.error('Manual reconnection failed:', err);
        });
      },
      () => {
        // User chose to exit
        this.disconnect();
      }
    );
  }

  /**
   * Update connection status
   */
  private updateStatus(status: ConnectionStatus): void {
    if (this.config.onStatusChange) {
      this.config.onStatusChange(status);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    logError(error, `RealtimeConnection:${this.config.channelName}`);
    
    if (this.config.onError) {
      this.config.onError(error);
    }
  }
}

/**
 * Create a managed real-time connection
 * 
 * @param config - Connection configuration
 * @returns Connection manager instance
 */
export function createRealtimeConnection(
  config: RealtimeConnectionConfig
): RealtimeConnectionManager {
  return new RealtimeConnectionManager(config);
}
