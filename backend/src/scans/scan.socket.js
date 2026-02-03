/**
 * Scan Socket.IO Event Handlers
 * Manages real-time WebSocket events for scan processing
 */

import logger from '../utils/logger.js';

/**
 * Socket.IO instance - will be set by server.js
 */
let io = null;

/**
 * Initialize Socket.IO instance
 * @param {Object} socketIO - Socket.IO server instance
 */
export const initializeSocket = (socketIO) => {
  io = socketIO;
  logger.info('[SOCKET] Socket.IO initialized');
};

/**
 * Get Socket.IO instance
 * @returns {Object|null} Socket.IO instance
 */
export const getIO = () => {
  return io;
};

/**
 * Emit scan status update to all connected clients
 * @param {string} scanId - Scan ID
 * @param {Object} data - Status data
 */
export const emitScanUpdate = (scanId, data) => {
  if (!io) {
    logger.warn('[SOCKET] Socket.IO not initialized, cannot emit scan update');
    return;
  }

  io.emit('scan:update', {
    scanId,
    ...data,
    timestamp: new Date().toISOString(),
  });

  logger.debug(`[SOCKET] Emitted scan update for ${scanId}:`, data);
};

/**
 * Emit scan status update to specific user room
 * @param {string} userId - User ID
 * @param {string} scanId - Scan ID
 * @param {Object} data - Status data
 */
export const emitScanUpdateToUser = (userId, scanId, data) => {
  if (!io) {
    logger.warn('[SOCKET] Socket.IO not initialized, cannot emit scan update to user');
    return;
  }

  io.to(`user:${userId}`).emit('scan:update', {
    scanId,
    ...data,
    timestamp: new Date().toISOString(),
  });

  logger.debug(`[SOCKET] Emitted scan update to user ${userId} for scan ${scanId}`);
};

/**
 * Emit scan progress update
 * @param {string} scanId - Scan ID
 * @param {number} progress - Progress percentage (0-100)
 * @param {string} stage - Current processing stage
 */
export const emitScanProgress = (scanId, progress, stage) => {
  emitScanUpdate(scanId, {
    type: 'progress',
    progress,
    stage,
    status: 'PROCESSING',
  });
};

/**
 * Emit scan completion
 * @param {string} scanId - Scan ID
 * @param {Object} result - Scan result
 */
export const emitScanComplete = (scanId, result) => {
  emitScanUpdate(scanId, {
    type: 'complete',
    status: 'COMPLETED',
    result,
  });
};

/**
 * Emit scan failure
 * @param {string} scanId - Scan ID
 * @param {Object} error - Error object
 */
export const emitScanFailed = (scanId, error) => {
  emitScanUpdate(scanId, {
    type: 'failed',
    status: 'FAILED',
    error: {
      message: error.message,
    },
  });
};

/**
 * Emit notification to a specific user
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
export const emitNotification = (userId, notification) => {
  if (!io) {
    logger.warn('[SOCKET] Socket.IO not initialized, cannot emit notification');
    return;
  }

  io.to(`user:${userId}`).emit('notification:new', {
    ...notification,
    receivedAt: new Date().toISOString(),
  });

  logger.debug(`[SOCKET] Emitted notification to user ${userId}`);
};

/**
 * Setup Socket.IO connection handlers
 * @param {Object} socket - Socket.IO socket instance
 */
export const setupSocketHandlers = (socket) => {
  logger.info(`[SOCKET] Client connected: ${socket.id}`);

  // Handle user authentication and join user room
  socket.on('auth', (data) => {
    if (data.userId) {
      socket.join(`user:${data.userId}`);
      logger.info(`[SOCKET] User ${data.userId} joined their room`);
      socket.emit('auth:success', { message: 'Authenticated' });
    }
  });

  // Handle subscribe to specific scan
  socket.on('scan:subscribe', (data) => {
    if (data.scanId) {
      socket.join(`scan:${data.scanId}`);
      logger.info(`[SOCKET] Client ${socket.id} subscribed to scan ${data.scanId}`);
      socket.emit('scan:subscribed', { scanId: data.scanId });
    }
  });

  // Handle unsubscribe from scan
  socket.on('scan:unsubscribe', (data) => {
    if (data.scanId) {
      socket.leave(`scan:${data.scanId}`);
      logger.info(`[SOCKET] Client ${socket.id} unsubscribed from scan ${data.scanId}`);
    }
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    logger.info(`[SOCKET] Client disconnected: ${socket.id}, reason: ${reason}`);
  });

  // Handle ping/pong for connection health
  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() });
  });
};

export default {
  initializeSocket,
  getIO,
  emitScanUpdate,
  emitScanUpdateToUser,
  emitScanProgress,
  emitScanComplete,
  emitScanFailed,
  emitNotification,
  setupSocketHandlers,
};
