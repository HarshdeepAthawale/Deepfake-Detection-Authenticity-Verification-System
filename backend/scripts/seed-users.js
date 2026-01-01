/**
 * User Seeding Script
 * Creates initial users for testing and development
 */

import { connectDB } from '../src/config/db.js';
import User from '../src/users/user.model.js';
import { ROLES } from '../src/security/rbac.js';
import logger from '../src/utils/logger.js';

const users = [
  {
    email: 'harshdeepathawale27@gmail.com',
    // No password - Google Auth only
    operativeId: 'ADMIN_1',
    role: ROLES.ADMIN,
    authProvider: 'google',
    metadata: {
      firstName: 'System',
      lastName: 'Administrator',
      department: 'IT',
      clearanceLevel: 'TOP_SECRET',
    },
  },
];

const seedUsers = async () => {
  try {
    logger.info('Connecting to database...');
    await connectDB();

    logger.info('Seeding users...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
    
    for (const userData of users) {
      // Prevent creating multiple admins
      if (userData.role === ROLES.ADMIN && existingAdmin) {
        logger.info(`Admin already exists. Skipping admin creation: ${userData.email}`);
        continue;
      }

      // Check if user already exists
      const existingUser = await User.findOne({
        $or: [
          { email: userData.email },
          { operativeId: userData.operativeId },
        ],
      });

      if (existingUser) {
        logger.info(`User already exists: ${userData.email} (${userData.operativeId})`);
        continue;
      }

      const user = new User(userData);
      await user.save();
      logger.info(`Created user: ${userData.email} (${userData.operativeId}) - Role: ${userData.role}`);
    }

    logger.info('User seeding completed!');
    logger.info('\nDefault Admin User:');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    const adminUser = users.find(u => u.role === ROLES.ADMIN);
    if (adminUser) {
      logger.info(`Email: ${adminUser.email}`);
      logger.info(`Password: ${adminUser.password || 'NOT_SET'}`);
      logger.info(`Operative ID: ${adminUser.operativeId}`);
      logger.info(`Role: ${adminUser.role}`);
      logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('IMPORTANT: Change the default password after first login!');
    }

    process.exit(0);
  } catch (error) {
    logger.error('Seeding error:', error);
    process.exit(1);
  }
};

seedUsers();



