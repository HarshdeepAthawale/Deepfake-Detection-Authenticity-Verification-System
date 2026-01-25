/**
 * Password Reset Service
 * Handles forgot password and password reset functionality
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../users/user.model.js';
import { sendPasswordResetEmail } from '../notifications/email.service.js';
import logger from '../utils/logger.js';

/**
 * Generate password reset token
 * @param {string} userId - User ID
 * @returns {Promise<{token: string, expires: Date}>}
 */
export const generateResetToken = async (userId) => {
    try {
        // Generate secure random token
        const token = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Token expires in 1 hour
        const expires = new Date(Date.now() + 3600000);

        // Store hashed token in database
        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires: expires,
                },
            }
        );

        logger.info(`[PASSWORD_RESET] Reset token generated for user: ${userId}`);

        return { token, expires };
    } catch (error) {
        logger.error(`[PASSWORD_RESET] Error generating reset token: ${error.message}`);
        throw error;
    }
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Promise<boolean>}
 */
export const requestPasswordReset = async (email) => {
    try {
        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            // Don't reveal if user exists
            logger.warn(`[PASSWORD_RESET] Reset requested for non-existent email: ${email}`);
            return true;
        }

        // Generate reset token
        const { token, expires } = await generateResetToken(user._id);

        // Send reset email
        await sendPasswordResetEmail(user.email, user.name, token);

        logger.info(`[PASSWORD_RESET] Reset email sent to: ${email}`);

        return true;
    } catch (error) {
        logger.error(`[PASSWORD_RESET] Error requesting password reset: ${error.message}`);
        throw new Error('Failed to process password reset request');
    }
};

/**
 * Verify reset token
 * @param {string} token - Reset token
 * @returns {Promise<User>}
 */
export const verifyResetToken = async (token) => {
    try {
        // Hash the token to compare with stored hash
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Find user with valid token
        const user = await User.findOne({
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            throw new Error('Invalid or expired reset token');
        }

        return user;
    } catch (error) {
        logger.error(`[PASSWORD_RESET] Error verifying reset token: ${error.message}`);
        throw error;
    }
};

/**
 * Reset password
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<boolean>}
 */
export const resetPassword = async (token, newPassword) => {
    try {
        // Verify token and get user
        const user = await verifyResetToken(token);

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        // Update password and clear reset token
        await User.updateOne(
            { _id: user._id },
            {
                $set: {
                    password: hashedPassword,
                },
                $unset: {
                    resetPasswordToken: '',
                    resetPasswordExpires: '',
                },
            }
        );

        logger.info(`[PASSWORD_RESET] Password reset successful for user: ${user._id}`);

        return true;
    } catch (error) {
        logger.error(`[PASSWORD_RESET] Error resetting password: ${error.message}`);
        throw error;
    }
};

/**
 * Clear expired reset tokens (cleanup job)
 * @returns {Promise<number>} Number of tokens cleared
 */
export const clearExpiredTokens = async () => {
    try {
        const result = await User.updateMany(
            { resetPasswordExpires: { $lt: Date.now() } },
            {
                $unset: {
                    resetPasswordToken: '',
                    resetPasswordExpires: '',
                },
            }
        );

        if (result.modifiedCount > 0) {
            logger.info(`[PASSWORD_RESET] Cleared ${result.modifiedCount} expired reset tokens`);
        }

        return result.modifiedCount;
    } catch (error) {
        logger.error(`[PASSWORD_RESET] Error clearing expired tokens: ${error.message}`);
        throw error;
    }
};

export default {
    requestPasswordReset,
    verifyResetToken,
    resetPassword,
    clearExpiredTokens,
};
