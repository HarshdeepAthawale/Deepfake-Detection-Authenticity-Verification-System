/**
 * Test Setup
 * Global test configuration and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.MONGODB_URI = 'mongodb://localhost:27017/deepfake-detection-test';
process.env.ML_SERVICE_URL = 'http://localhost:5000';
process.env.ML_SERVICE_ENABLED = 'false'; // Disable ML service for unit tests

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};
