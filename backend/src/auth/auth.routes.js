/**
 * Authentication Routes
 * Defines authentication-related API endpoints
 */

import express from 'express';
import { login, register, getCurrentUser, googleAuth, updateProfileHandler, changePasswordHandler, updateNotificationsHandler } from './auth.controller.js';
import { authenticate } from './auth.middleware.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user and get JWT token
 * @access  Public
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and get JWT token
 * @access  Public
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/google
 * @desc    Authenticate with Google OAuth
 * @access  Public
 */
router.post('/google', googleAuth);

/**
 * @route   PATCH /api/auth/me
 * @desc    Update user profile (firstName, lastName, department)
 * @access  Private
 */
router.patch('/me', authenticate, updateProfileHandler);

/**
 * @route   PATCH /api/auth/me/password
 * @desc    Change user password
 * @access  Private
 */
router.patch('/me/password', authenticate, changePasswordHandler);

/**
 * @route   PATCH /api/auth/me/notifications
 * @desc    Update notification preferences
 * @access  Private
 */
router.patch('/me/notifications', authenticate, updateNotificationsHandler);

export default router;

