/**
 * Update User to Admin Script
 * Updates harshdeepathawale27@gmail.com to admin role
 * 
 * Usage: node backend/scripts/update-to-admin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// User Schema
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: String,
    operativeId: { type: String, required: true, unique: true },
    role: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    authProvider: { type: String, default: 'local' },
    metadata: {
        firstName: String,
        lastName: String,
        department: String,
        clearanceLevel: String,
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function updateToAdmin() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI?.replace('mongodb:27017', 'localhost:27018')
            || 'mongodb://localhost:27018/deepfake-detection';
        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB\n');

        const adminEmail = 'harshdeepathawale27@gmail.com';

        // Find the user
        const user = await User.findOne({ email: adminEmail });
        if (!user) {
            console.log('✗ User not found!');
            console.log(`No user with email: ${adminEmail}`);
            process.exit(1);
        }

        console.log('Current user details:');
        console.log('═══════════════════════════════════════');
        console.log(`Email:        ${user.email}`);
        console.log(`Operative ID: ${user.operativeId}`);
        console.log(`Role:         ${user.role}`);
        console.log(`Active:       ${user.isActive}`);
        console.log('═══════════════════════════════════════\n');

        // Check if already admin
        if (user.role === 'admin') {
            console.log('✓ User is already an admin!');
            process.exit(0);
        }

        // Check if another admin exists
        const existingAdmin = await User.findOne({
            role: 'admin',
            _id: { $ne: user._id }
        });

        if (existingAdmin) {
            console.log('⚠ Another admin user already exists!');
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Operative ID: ${existingAdmin.operativeId}`);
            console.log('\nOnly one admin is allowed. Delete the existing admin first.');
            process.exit(1);
        }

        // Update to admin
        console.log('Updating user to admin role...');
        user.role = 'admin';
        user.metadata = {
            firstName: user.metadata?.firstName || 'Harshdeep',
            lastName: user.metadata?.lastName || 'Athawale',
            department: 'System Administration',
            clearanceLevel: 'TOP_SECRET',
        };
        await user.save();

        console.log('\n✓ User successfully updated to admin!');
        console.log('═══════════════════════════════════════');
        console.log('Updated user details:');
        console.log('═══════════════════════════════════════');
        console.log(`Email:        ${user.email}`);
        console.log(`Operative ID: ${user.operativeId}`);
        console.log(`Role:         ${user.role}`);
        console.log(`Department:   ${user.metadata.department}`);
        console.log(`Clearance:    ${user.metadata.clearanceLevel}`);
        console.log('═══════════════════════════════════════');
        console.log('\nYou can now login with admin privileges!');

    } catch (error) {
        console.error('✗ Error updating user:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Run the script
updateToAdmin();
