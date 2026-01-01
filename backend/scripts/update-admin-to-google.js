/**
 * Update Admin User to Google Auth Only
 * Removes password and sets up for Google OAuth authentication
 */

import { connectDB } from '../src/config/db.js';
import User from '../src/users/user.model.js';
import { ROLES } from '../src/security/rbac.js';
import logger from '../src/utils/logger.js';

const ADMIN_EMAIL = 'harshdeepathawale27@gmail.com';

const updateAdminToGoogle = async () => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    logger.info('Updating admin user to Google Auth only...');

    // Find the admin user
    const adminUser = await User.findOne({ 
      email: ADMIN_EMAIL.toLowerCase() 
    });

    if (!adminUser) {
      logger.error(`Admin user not found: ${ADMIN_EMAIL}`);
      process.exit(1);
    }

    // Check if ADMIN_1 operative ID is available
    const existingAdminId = await User.findOne({ 
      operativeId: 'ADMIN_1',
      _id: { $ne: adminUser._id }
    });

    // Prepare update object
    const updateData = {
      $unset: { password: "" },
      $set: {
        authProvider: 'google',
        role: ROLES.ADMIN,
      }
    };

    // Only update operativeId if ADMIN_1 is available or if current user already has it
    if (!existingAdminId || adminUser.operativeId === 'ADMIN_1') {
      updateData.$set.operativeId = 'ADMIN_1';
    } else {
      logger.info(`Operative ID 'ADMIN_1' is already in use. Keeping current operative ID: ${adminUser.operativeId}`);
    }

    // Update to Google Auth only
    // Use updateOne to bypass pre-save hooks
    await User.updateOne(
      { _id: adminUser._id },
      updateData
    );
    
    // Refresh the user object
    const updatedUser = await User.findById(adminUser._id);

    logger.info('Admin user updated successfully!');
    logger.info('\nUpdated Admin User:');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`Email: ${updatedUser.email}`);
    logger.info(`Operative ID: ${updatedUser.operativeId}`);
    logger.info(`Role: ${updatedUser.role}`);
    logger.info(`Auth Provider: ${updatedUser.authProvider}`);
    logger.info('Password: REMOVED (Google Auth only)');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('Admin must login via Google OAuth now!');

    process.exit(0);
  } catch (error) {
    logger.error('Update error:', error);
    process.exit(1);
  }
};

updateAdminToGoogle();

