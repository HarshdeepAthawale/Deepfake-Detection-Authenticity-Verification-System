/**
 * Centralized Error Handler Middleware
 * Handles all errors in a consistent format
 */

import logger from '../utils/logger.js';

/**
 * Custom Application Error
 */
export class AppError extends Error {
    constructor(message, statusCode = 500, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.timestamp = new Date().toISOString();
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * Error types for common scenarios
 */
export class ValidationError extends AppError {
    constructor(message) {
        super(message, 400);
    }
}

export class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed') {
        super(message, 401);
    }
}

export class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(message, 403);
    }
}

export class NotFoundError extends AppError {
    constructor(resource = 'Resource') {
        super(`${resource} not found`, 404);
    }
}

export class ConflictError extends AppError {
    constructor(message) {
        super(message, 409);
    }
}

/**
 * Error response formatter
 */
const formatErrorResponse = (err, includeStack = false) => {
    const response = {
        success: false,
        error: {
            message: err.message || 'An unexpected error occurred',
            code: err.code || 'INTERNAL_ERROR',
            timestamp: err.timestamp || new Date().toISOString(),
        },
    };

    if (err.statusCode) {
        response.error.statusCode = err.statusCode;
    }

    if (err.details) {
        response.error.details = err.details;
    }

    if (includeStack && err.stack) {
        response.error.stack = err.stack;
    }

    return response;
};

/**
 * Main error handler middleware
 */
export const errorHandler = (err, req, res, next) => {
    // Default to 500 server error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Log error with context
    const errorContext = {
        method: req.method,
        url: req.url,
        ip: req.ip,
        userId: req.user?.id,
        statusCode,
        message,
    };

    if (statusCode >= 500) {
        logger.error('Server error:', errorContext);
        logger.error(err.stack);
    } else {
        logger.warn('Client error:', errorContext);
    }

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation failed';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    } else if (err.name === 'MongoError' && err.code === 11000) {
        statusCode = 409;
        message = 'Duplicate entry';
    } else if (err.name === 'MulterError') {
        statusCode = 400;
        if (err.code === 'LIMIT_FILE_SIZE') {
            message = 'File too large';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files';
        } else {
            message = 'File upload error';
        }
    }

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const includeStack = isDevelopment && statusCode >= 500;

    // Send error response
    res.status(statusCode).json(formatErrorResponse({
        ...err,
        message,
        statusCode,
    }, includeStack));
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
    const error = new NotFoundError(`Route ${req.method} ${req.url}`);
    next(error);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

export default {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    NotFoundError,
    ConflictError,
};
