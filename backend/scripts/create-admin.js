/**
 * Create Admin User Script
 * Run this once to create the admin user
 * 
 * Usage: node backend/scripts/create-admin.js
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
    notificationPreferences: {
        emailEnabled: { type: Boolean, default: true },
        emailOnDeepfake: { type: Boolean, default: true },
        emailOnAll: { type: Boolean, default: false },
        inAppEnabled: { type: Boolean, default: true },
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdminUser() {
    try {
        // Connect to MongoDB (use localhost:27018 for Docker exposed port)
        const mongoUri = process.env.MONGODB_URI?.replace('mongodb:27017', 'localhost:27018')
            || 'mongodb://localhost:27018/deepfake-detection';
        console.log('Connecting to MongoDB...');
        console.log(`URI: ${mongoUri}`);
        await mongoose.connect(mongoUri);
        console.log('✓ Connected to MongoDB');

        // Admin user details
        const adminEmail = 'harshdeepathawale27@gmail.com';
        const adminPassword = 'Admin@123'; // Change this after first login!
        const adminOperativeId = 'ADMIN-001';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('⚠ Admin user already exists!');
            console.log(`Email: ${existingAdmin.email}`);
            console.log(`Operative ID: ${existingAdmin.operativeId}`);
            console.log(`Role: ${existingAdmin.role}`);
            console.log('\nTo reset password, delete the user and run this script again.');
            process.exit(0);
        }

        // Check if any admin exists
        const anyAdmin = await User.findOne({ role: 'ADMIN' });
        if (anyAdmin) {
            console.log('⚠ An admin user already exists in the system!');
            console.log(`Email: ${anyAdmin.email}`);
            console.log(`Operative ID: ${anyAdmin.operativeId}`);
            console.log('\nOnly one admin is allowed. Delete existing admin first if you want to create a new one.');
            process.exit(1);
        }

        // Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        // Create admin user
        console.log('Creating admin user...');
        const admin = await User.create({
            email: adminEmail,
            password: hashedPassword,
            operativeId: adminOperativeId,
            role: 'ADMIN',
            isActive: true,
            authProvider: 'local',
            metadata: {
                firstName: 'Harshdeep',
                lastName: 'Athawale',
                department: 'System Administration',
                clearanceLevel: 'TOP_SECRET',
            },
            notificationPreferences: {
                emailEnabled: true,
                emailOnDeepfake: true,
                emailOnAll: true,
                inAppEnabled: true,
            },
        });

        console.log('\n✓ Admin user created successfully!');
        console.log('═══════════════════════════════════════');
        console.log('Admin Credentials:');
        console.log('═══════════════════════════════════════');
        console.log(`Email:        ${adminEmail}`);
        console.log(`Password:     ${adminPassword}`);
        console.log(`Operative ID: ${adminOperativeId}`);
        console.log(`Role:         ${admin.role}`);
        console.log('═══════════════════════════════════════');
        console.log('\n⚠ IMPORTANT: Change the password after first login!');
        console.log('\nYou can now login at: http://localhost:3002');

    } catch (error) {
        console.error('✗ Error creating admin user:', error.message);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\n✓ Database connection closed');
    }
}

// Run the script
createAdminUser();
