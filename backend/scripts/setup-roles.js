/**
 * Setup User Roles Script
 * Sets up three users with different roles: Admin, Operative, and Analyst
 */

import { connectDB } from '../src/config/db.js';
import User from '../src/users/user.model.js';
import { ROLES } from '../src/security/rbac.js';
import logger from '../src/utils/logger.js';

const USERS_CONFIG = [
  {
    email: 'harshdeepathawale27@gmail.com',
    role: ROLES.ADMIN,
    operativeId: 'ADMIN_1',
    metadata: {
      firstName: 'Harshdeep',
      lastName: 'Athawale',
      department: 'Administration',
      clearanceLevel: 'TOP_SECRET',
    }
  },
  {
    email: 'harshdeepathawale777@gmail.com',
    role: ROLES.OPERATIVE,
    operativeId: 'OP_001',
    metadata: {
      firstName: 'Harshdeep',
      lastName: 'Athawale',
      department: 'Operations',
      clearanceLevel: 'SECRET',
    }
  },
  {
    email: 'hathawale_be24@thapar.edu',
    role: ROLES.ANALYST,
    operativeId: 'AN_001',
    metadata: {
      firstName: 'Harshdeep',
      lastName: 'Athawale',
      department: 'Analysis',
      clearanceLevel: 'CONFIDENTIAL',
    }
  }
];

const setupRoles = async () => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    logger.info('\n═══════════════════════════════════════════');
    logger.info('Setting up user roles...');
    logger.info('═══════════════════════════════════════════\n');

    // First, handle the admin constraint - remove admin from any other user
    const adminUser = USERS_CONFIG.find(u => u.role === ROLES.ADMIN);
    if (adminUser) {
      const existingAdmin = await User.findOne({
        role: ROLES.ADMIN,
        email: { $ne: adminUser.email.toLowerCase() }
      });

      if (existingAdmin) {
        logger.info(`Removing admin role from: ${existingAdmin.email}`);
        await User.updateOne(
          { _id: existingAdmin._id },
          { $set: { role: ROLES.OPERATIVE } }
        );
      }
    }

    // Setup each user
    for (const userConfig of USERS_CONFIG) {
      const emailLower = userConfig.email.toLowerCase();

      try {
        const existingUser = await User.findOne({ email: emailLower });

        if (existingUser) {
          // Update existing user
          logger.info(`Updating user: ${emailLower}`);

          const updateData = {
            $set: {
              role: userConfig.role,
              authProvider: 'google',
              isActive: true,
              operativeId: userConfig.operativeId,
              metadata: userConfig.metadata,
            }
          };

          // Remove password if it exists (for Google Auth)
          if (existingUser.password) {
            updateData.$unset = { password: "" };
          }

          await User.updateOne(
            { _id: existingUser._id },
            updateData
          );

          logger.info(`✓ Updated ${emailLower} → ${userConfig.role.toUpperCase()}`);
        } else {
          // Create new user using updateOne with upsert to bypass pre-save hooks
          logger.info(`Creating new user: ${emailLower}`);

          await User.updateOne(
            { email: emailLower },
            {
              $set: {
                email: emailLower,
                operativeId: userConfig.operativeId,
                role: userConfig.role,
                authProvider: 'google',
                isActive: true,
                metadata: userConfig.metadata,
              }
            },
            { upsert: true }
          );

          logger.info(`✓ Created ${emailLower} → ${userConfig.role.toUpperCase()}`);
        }
      } catch (error) {
        logger.error(`✗ Error setting up ${emailLower}:`, error.message);
      }
    }

    // Display final user setup
    logger.info('\n═══════════════════════════════════════════');
    logger.info('User Setup Summary');
    logger.info('═══════════════════════════════════════════\n');

    for (const userConfig of USERS_CONFIG) {
      const user = await User.findOne({ email: userConfig.email.toLowerCase() });
      if (user) {
        logger.info(`Email: ${user.email}`);
        logger.info(`Operative ID: ${user.operativeId}`);
        logger.info(`Role: ${user.role.toUpperCase()}`);
        logger.info(`Auth Provider: ${user.authProvider}`);
        logger.info(`Active: ${user.isActive}`);
        logger.info('───────────────────────────────────────────');
      }
    }

    logger.info('\n✓ All users configured successfully!');
    logger.info('Users must login via Google OAuth.\n');

    process.exit(0);
  } catch (error) {
    logger.error('Error setting up roles:', error);
    process.exit(1);
  }
};

setupRoles();
