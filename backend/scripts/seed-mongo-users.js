/**
 * MongoDB Seed Script - Three Users
 * Seeds MongoDB with admin, operative, and analyst users
 */

import mongoose from 'mongoose';
import User from '../src/users/user.model.js';
import { ROLES } from '../src/security/rbac.js';
import bcrypt from 'bcryptjs';
import logger from '../src/utils/logger.js';

const USERS_CONFIG = [
  {
    name: 'Harshdeep Athawale',
    email: 'harshdeepathawale27@gmail.com',
    role: ROLES.ADMIN,
    operativeId: 'ADMIN_001',
    password: 'Password@123',
  },
  {
    name: 'Harshdeep Athawale',
    email: 'harshdeepathawale777@gmail.com',
    role: ROLES.OPERATIVE,
    operativeId: 'OP_001',
    password: 'Password@123',
  },
  {
    name: 'Harshdeep Athawale',
    email: 'hathawale_be24@thapar.edu',
    role: ROLES.ANALYST,
    operativeId: 'AN_001',
    password: 'Password@123',
  }
];

const seedUsers = async () => {
  try {
    logger.info('\n═══════════════════════════════════════════');
    logger.info('Seeding MongoDB with Users');
    logger.info('═══════════════════════════════════════════\n');

    // Connect to MongoDB on port 27019 (docker-compose mapping)
    await mongoose.connect('mongodb://localhost:27019/deepfake-detection');
    logger.info('Connected to MongoDB');

    // Remove existing admin to allow new admin
    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
    if (existingAdmin) {
      logger.info(`Removing existing admin: ${existingAdmin.email}`);
      await User.deleteOne({ _id: existingAdmin._id });
    }

    // Seed each user
    for (const userConfig of USERS_CONFIG) {
      try {
        const existingUser = await User.findOne({ email: userConfig.email });

        if (existingUser) {
          logger.info(`Updating user: ${userConfig.email}`);
          existingUser.name = userConfig.name;
          existingUser.role = userConfig.role;
          existingUser.password = userConfig.password;
          existingUser.operativeId = userConfig.operativeId;
          existingUser.isActive = true;
          existingUser.authProvider = 'local';
          await existingUser.save();
          logger.info(`✓ Updated ${userConfig.email} → ${userConfig.role.toUpperCase()}`);
        } else {
          logger.info(`Creating new user: ${userConfig.email}`);
          const newUser = new User({
            name: userConfig.name,
            email: userConfig.email,
            password: userConfig.password,
            role: userConfig.role,
            operativeId: userConfig.operativeId,
            isActive: true,
            authProvider: 'local',
            metadata: {
              firstName: 'Harshdeep',
              lastName: 'Athawale',
              department: userConfig.role.charAt(0).toUpperCase() + userConfig.role.slice(1),
              clearanceLevel: 'SECRET',
            },
          });
          await newUser.save();
          logger.info(`✓ Created ${userConfig.email} → ${userConfig.role.toUpperCase()}`);
        }
      } catch (error) {
        logger.error(`✗ Error seeding ${userConfig.email}:`, error.message);
      }
    }

    // Display final user setup
    logger.info('\n═══════════════════════════════════════════');
    logger.info('User Setup Summary');
    logger.info('═══════════════════════════════════════════\n');

    for (const userConfig of USERS_CONFIG) {
      const user = await User.findOne({ email: userConfig.email });
      if (user) {
        logger.info(`Email: ${user.email}`);
        logger.info(`Name: ${user.name}`);
        logger.info(`Role: ${user.role.toUpperCase()}`);
        logger.info(`Operative ID: ${user.operativeId}`);
        logger.info(`Active: ${user.isActive}`);
        logger.info('───────────────────────────────────────────');
      }
    }

    logger.info('\n✓ All users seeded successfully!');
    logger.info('You can now login with these credentials.\n');

    process.exit(0);
  } catch (error) {
    logger.error('\n✗ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
