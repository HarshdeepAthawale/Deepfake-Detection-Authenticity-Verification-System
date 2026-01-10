/**
 * Socket.IO Client
 * Manages WebSocket connection to backend for real-time updates
 */

import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

/**
 * Initialize Socket.IO connection
 * @param {string} token - JWT token for authentication
 * @param {string} userId - User ID for user-specific rooms
 * @returns {Socket} Socket.IO instance
 */
export const initializeSocket = (token?: string, userId?: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    auth: token ? { token } : undefined,
  });

  socket.on('connect', () => {
    console.log('[SOCKET] Connected to server:', socket?.id);
    
    // Authenticate with userId if provided
    if (userId) {
      socket?.emit('auth', { userId });
    }
  });

  socket.on('disconnect', (reason) => {
    console.log('[SOCKET] Disconnected from server:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('[SOCKET] Connection error:', error);
  });

  socket.on('auth:success', (data) => {
    console.log('[SOCKET] Authentication successful:', data);
  });

  return socket;
};

/**
 * Get current Socket.IO instance
 * @returns {Socket | null} Socket.IO instance or null if not initialized
 */
export const getSocket = (): Socket | null => {
  return socket;
};

/**
 * Disconnect Socket.IO connection
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('[SOCKET] Disconnected');
  }
};

/**
 * Subscribe to scan updates
 * @param {string} scanId - Scan ID to subscribe to
 * @param {Function} callback - Callback function for updates
 * @returns {Function} Unsubscribe function
 */
export const subscribeToScan = (scanId: string, callback: (data: any) => void): (() => void) => {
  if (!socket) {
    console.warn('[SOCKET] Socket not initialized, cannot subscribe to scan');
    return () => {};
  }

  socket.emit('scan:subscribe', { scanId });
  
  const handleUpdate = (data: any) => {
    if (data.scanId === scanId) {
      callback(data);
    }
  };

  socket.on('scan:update', handleUpdate);

  socket.once('scan:subscribed', (data) => {
    if (data.scanId === scanId) {
      console.log('[SOCKET] Subscribed to scan:', data.scanId);
    }
  });

  // Return unsubscribe function
  return () => {
    socket?.off('scan:update', handleUpdate);
    socket?.emit('scan:unsubscribe', { scanId });
  };
};

/**
 * Unsubscribe from scan updates
 * @param {string} scanId - Scan ID to unsubscribe from
 * @param {Function} callback - Optional callback to remove specific listener
 */
export const unsubscribeFromScan = (scanId: string, callback?: (data: any) => void) => {
  if (!socket) {
    return;
  }

  socket.emit('scan:unsubscribe', { scanId });
  if (callback) {
    // Remove specific listener by creating a wrapper that matches
    socket.off('scan:update', callback);
  }
  // Note: Don't remove all listeners as other scans might be using them
};

/**
 * Generic event listener for socket events
 * @param {string} event - Event name
 * @param {Function} callback - Callback function
 */
export const onSocketEvent = (event: string, callback: (...args: any[]) => void) => {
  if (!socket) {
    console.warn('[SOCKET] Socket not initialized, cannot listen to event');
    return;
  }

  socket.on(event, callback);
};

/**
 * Remove event listener
 * @param {string} event - Event name
 * @param {Function} callback - Optional callback to remove specific listener
 */
export const offSocketEvent = (event: string, callback?: (...args: any[]) => void) => {
  if (!socket) {
    return;
  }

  if (callback) {
    socket.off(event, callback);
  } else {
    socket.off(event);
  }
};

export default {
  initializeSocket,
  getSocket,
  disconnectSocket,
  subscribeToScan,
  unsubscribeFromScan,
  onSocketEvent,
  offSocketEvent,
};
