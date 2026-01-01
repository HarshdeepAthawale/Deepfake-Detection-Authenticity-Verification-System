/**
 * Google OAuth Service
 * Handles Google OAuth authentication and user creation/authentication
 */

import User from '../users/user.model.js';
import { generateToken } from './auth.service.js';
import { ROLES } from '../security/rbac.js';
import config from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Verify Google ID token and get user info
 * @param {string} idToken - Google ID token from frontend
 * @returns {Object} Google user info
 */
export const verifyGoogleToken = async (idToken) => {
  try {
    if (!idToken) {
      throw new Error('Google ID token is required');
    }

    // Verify token with Google's tokeninfo endpoint
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      logger.error('Google tokeninfo API error:', { status: response.status, error: errorText });
      throw new Error(`Invalid Google token: ${response.status} ${errorText}`);
    }

    const tokenInfo = await response.json();

    // Check for error in response
    if (tokenInfo.error) {
      logger.error('Google tokeninfo error:', tokenInfo);
      throw new Error(`Google token verification failed: ${tokenInfo.error_description || tokenInfo.error}`);
    }

    // Verify the token is for our app (only if client ID is configured)
    if (config.google.clientId) {
      if (tokenInfo.aud !== config.google.clientId) {
        logger.error('Token audience mismatch:', {
          expected: config.google.clientId,
          received: tokenInfo.aud
        });
        throw new Error('Token audience mismatch - client ID does not match');
      }
    } else {
      logger.warn('Google client ID not configured - skipping audience verification');
    }

    // Validate required fields
    if (!tokenInfo.sub || !tokenInfo.email) {
      throw new Error('Invalid token: missing required user information');
    }

    return {
      googleId: tokenInfo.sub,
      email: tokenInfo.email,
      emailVerified: tokenInfo.email_verified === 'true',
      name: tokenInfo.name,
      picture: tokenInfo.picture,
      givenName: tokenInfo.given_name,
      familyName: tokenInfo.family_name,
    };
  } catch (error) {
    logger.error('Google token verification error:', {
      message: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Authenticate or register user with Google OAuth
 * @param {string} idToken - Google ID token
 * @returns {Object} User object and JWT token
 */
export const authenticateWithGoogle = async (idToken) => {
  try {
    // Verify Google token
    const googleUser = await verifyGoogleToken(idToken);

    if (!googleUser.emailVerified) {
      throw new Error('Google email not verified');
    }

    // Check if user exists by Google ID
    let user = await User.findOne({ googleId: googleUser.googleId });

    // Admin email - always assign admin role
    const ADMIN_EMAIL = config.admin.email;
    const isAdminEmail = ADMIN_EMAIL && googleUser.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();

    if (!user) {
      // Check if user exists by email (for linking accounts)
      user = await User.findOne({ email: googleUser.email.toLowerCase() });

      if (user) {
        // Link Google account to existing user
        user.googleId = googleUser.googleId;
        user.authProvider = 'google';
        // Preserve admin role if it's the admin email
        if (isAdminEmail && user.role !== ROLES.ADMIN) {
          user.role = ROLES.ADMIN;
        }
        await user.save();
      } else {
        // Create new user
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const operativeId = isAdminEmail ? 'ADMIN_1' : `USER_${timestamp}_${random}`;

        user = new User({
          email: googleUser.email.toLowerCase(),
          googleId: googleUser.googleId,
          operativeId: operativeId,
          role: isAdminEmail ? ROLES.ADMIN : ROLES.OPERATIVE,
          authProvider: 'google',
          isActive: true,
          metadata: {
            firstName: googleUser.givenName || '',
            lastName: googleUser.familyName || '',
            ...(isAdminEmail && {
              department: 'IT',
              clearanceLevel: 'TOP_SECRET',
            }),
          },
        });

        await user.save();
        logger.info(`Google user registered: ${user.operativeId} (${user.email}) - Role: ${user.role}`);
      }
    } else {
      // Update role if it's admin email and user doesn't have admin role
      if (isAdminEmail && user.role !== ROLES.ADMIN) {
        user.role = ROLES.ADMIN;
        await user.save();
      }
      // Update last login
      user.lastLogin = new Date();
      await user.save({ validateBeforeSave: false });
      logger.info(`Google user authenticated: ${user.operativeId} (${user.email})`);
    }

    // Generate JWT token
    const token = generateToken(user);

    return {
      user: user.toJSON(),
      token,
    };
  } catch (error) {
    logger.error('Google authentication error:', error);
    throw error;
  }
};

export default {
  verifyGoogleToken,
  authenticateWithGoogle,
};

