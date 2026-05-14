/**
 * Setup MySQL Users Script
 * Creates/updates three users with different roles in MySQL
 */

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const USERS_CONFIG = [
  {
    name: 'Harshdeep Athawale',
    email: 'harshdeepathawale27@gmail.com',
    role: 'admin',
    operativeId: 'ADMIN_001',
  },
  {
    name: 'Harshdeep Athawale',
    email: 'harshdeepathawale777@gmail.com',
    role: 'operative',
    operativeId: 'OP_001',
  },
  {
    name: 'Harshdeep Athawale',
    email: 'hathawale_be24@thapar.edu',
    role: 'analyst',
    operativeId: 'AN_001',
  }
];

const DEFAULT_PASSWORD = 'Password@123';

const setupMySQLUsers = async () => {
  let connection;

  try {
    console.log('\n═══════════════════════════════════════════');
    console.log('Setting up MySQL Users');
    console.log('═══════════════════════════════════════════\n');

    // Create connection to MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'zenbook',
      database: 'sentinel_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('✓ Connected to MySQL database\n');

    // Hash the default password once
    const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

    // Setup each user
    for (const userConfig of USERS_CONFIG) {
      const emailLower = userConfig.email.toLowerCase();

      try {
        // Check if user exists
        const [existingUsers] = await connection.execute(
          'SELECT UserID FROM Users WHERE Email = ?',
          [emailLower]
        );

        if (existingUsers.length > 0) {
          // Update existing user
          console.log(`Updating user: ${emailLower}`);

          await connection.execute(
            'UPDATE Users SET Name = ?, Role = ?, PasswordHash = ?, OperativeID = ? WHERE Email = ?',
            [userConfig.name, userConfig.role, passwordHash, userConfig.operativeId, emailLower]
          );

          console.log(`✓ Updated ${emailLower} → ${userConfig.role.toUpperCase()}`);
        } else {
          // Insert new user
          console.log(`Creating new user: ${emailLower}`);

          await connection.execute(
            'INSERT INTO Users (Name, Email, Role, PasswordHash, OperativeID) VALUES (?, ?, ?, ?, ?)',
            [userConfig.name, emailLower, userConfig.role, passwordHash, userConfig.operativeId]
          );

          console.log(`✓ Created ${emailLower} → ${userConfig.role.toUpperCase()}`);
        }
      } catch (error) {
        console.error(`✗ Error setting up ${emailLower}:`, error.message);
      }
    }

    // Display final user setup
    console.log('\n═══════════════════════════════════════════');
    console.log('User Setup Summary');
    console.log('═══════════════════════════════════════════\n');

    const [users] = await connection.execute(
      'SELECT UserID, Name, Email, Role, OperativeID, CreatedAt FROM Users WHERE Email IN (?, ?, ?)',
      [
        USERS_CONFIG[0].email.toLowerCase(),
        USERS_CONFIG[1].email.toLowerCase(),
        USERS_CONFIG[2].email.toLowerCase(),
      ]
    );

    users.forEach((user) => {
      console.log(`UserID: ${user.UserID}`);
      console.log(`Name: ${user.Name}`);
      console.log(`Email: ${user.Email}`);
      console.log(`Role: ${user.Role.toUpperCase()}`);
      console.log(`Operative ID: ${user.OperativeID}`);
      console.log(`Created At: ${user.CreatedAt}`);
      console.log('───────────────────────────────────────────');
    });

    console.log(`\n✓ All users configured successfully!`);
    console.log(`Password for all users: ${DEFAULT_PASSWORD}\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error setting up users:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

setupMySQLUsers();
