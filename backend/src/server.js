/**
 * Server Entry Point
 * Starts the Express server and connects to database
 */

import app from './app.js';
import { connectDB } from './config/db.js';
import config from './config/env.js';
import logger from './utils/logger.js';
import { createServer } from 'http';

const PORT = config.server.port;

/**
 * Check if a port is available
 */
const isPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(false);
      }
    });
    server.listen(port, () => {
      server.once('close', () => resolve(true));
      server.close();
    });
  });
};

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Check if port is available
    const portAvailable = await isPortAvailable(PORT);
    if (!portAvailable) {
      logger.error(`Port ${PORT} is already in use!`);
      logger.error(`Please stop the process using port ${PORT} or run: .\\kill-ports.ps1`);
      logger.error(`On Windows, you can also run: Get-NetTCPConnection -LocalPort ${PORT} | Select-Object OwningProcess | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }`);
      process.exit(1);
    }

    // Connect to MongoDB
    logger.info('Connecting to database...');
    await connectDB();

    // Start Express server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${config.server.nodeEnv}`);
      logger.info(`Health check: http://localhost:${PORT}/health`);
      logger.info(`API base: http://localhost:${PORT}/api`);
    });

    // Handle server errors
    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use!`);
        logger.error(`Please stop the process using port ${PORT} or run: .\\kill-ports.ps1`);
      } else {
        logger.error('Server error:', error);
      }
      process.exit(1);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

// Start the server
startServer();

