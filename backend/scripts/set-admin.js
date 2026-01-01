/**
 * Set Admin User Script
 * Ensures a specific email is set as admin, handling the "only one admin" constraint
 */

import { connectDB } from '../src/config/db.js';
import User from '../src/users/user.model.js';
import { ROLES } from '../src/security/rbac.js';
import logger from '../src/utils/logger.js';

const ADMIN_EMAIL = 'harshdeepathawale27@gmail.com';

const setAdmin = async () => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    logger.info(`Setting ${ADMIN_EMAIL} as admin...`);

    // Find any existing admin
    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
    
    // Find or check if target user exists
    let targetUser = await User.findOne({ 
      email: ADMIN_EMAIL.toLowerCase() 
    });

    // If there's an existing admin that's not the target user, remove admin role
    if (existingAdmin && existingAdmin.email !== ADMIN_EMAIL.toLowerCase()) {
      logger.info(`Removing admin role from existing admin: ${existingAdmin.email}`);
      await User.updateOne(
        { _id: existingAdmin._id },
        { $set: { role: ROLES.OPERATIVE } }
      );
      logger.info(`Changed ${existingAdmin.email} to OPERATIVE role`);
    }

    // Check if ADMIN_1 operative ID is available
    const existingAdminId = await User.findOne({ 
      operativeId: 'ADMIN_1',
      email: { $ne: ADMIN_EMAIL.toLowerCase() }
    });

    if (targetUser) {
      // Update existing user to admin
      logger.info(`Updating existing user to admin: ${ADMIN_EMAIL}`);
      
      const updateData = {
        $set: {
          role: ROLES.ADMIN,
          authProvider: 'google',
          isActive: true,
        }
      };

      // Only update operativeId if ADMIN_1 is available or if current user already has it
      if (!existingAdminId || targetUser.operativeId === 'ADMIN_1') {
        updateData.$set.operativeId = 'ADMIN_1';
      } else {
        logger.info(`Operative ID 'ADMIN_1' is already in use. Keeping current operative ID: ${targetUser.operativeId}`);
      }

      // Remove password if it exists (for Google Auth)
      if (targetUser.password) {
        updateData.$unset = { password: "" };
      }

      await User.updateOne(
        { _id: targetUser._id },
        updateData
      );

      logger.info(`Updated user to admin: ${ADMIN_EMAIL}`);
    } else {
      // Create new user as admin
      logger.info(`Creating new admin user: ${ADMIN_EMAIL}`);
      
      const userData = {
        email: ADMIN_EMAIL.toLowerCase(),
        operativeId: existingAdminId ? `ADMIN_${Date.now()}` : 'ADMIN_1',
        role: ROLES.ADMIN,
        authProvider: 'google',
        isActive: true,
        metadata: {
          firstName: 'System',
          lastName: 'Administrator',
          department: 'IT',
          clearanceLevel: 'TOP_SECRET',
        },
      };

      // Use updateOne with upsert to bypass pre-save hook validation
      await User.updateOne(
        { email: ADMIN_EMAIL.toLowerCase() },
        { $set: userData },
        { upsert: true }
      );

      logger.info(`Created new admin user: ${ADMIN_EMAIL}`);
    }

    // Refresh and display the admin user
    const adminUser = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() });

    logger.info('\nAdmin user setup completed!');
    logger.info('\nAdmin User Details:');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info(`Email: ${adminUser.email}`);
    logger.info(`Operative ID: ${adminUser.operativeId}`);
    logger.info(`Role: ${adminUser.role}`);
    logger.info(`Auth Provider: ${adminUser.authProvider}`);
    logger.info(`Active: ${adminUser.isActive}`);
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('Admin must login via Google OAuth!');

    process.exit(0);
  } catch (error) {
    logger.error('Error setting admin:', error);
    process.exit(1);
  }
};

setAdmin();

