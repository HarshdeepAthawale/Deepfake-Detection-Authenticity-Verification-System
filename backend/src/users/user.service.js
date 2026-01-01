/**
 * User Service
 * Business logic for user management operations
 */

import User from './user.model.js';
import { ROLES } from '../security/rbac.js';
import logger from '../utils/logger.js';

/**
 * Get all users with pagination and filters
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {Object} filters - Filter options (role, isActive, search)
 * @returns {Object} Paginated users and metadata
 */
export const getAllUsers = async (page = 1, limit = 20, filters = {}) => {
  try {
    const skip = (page - 1) * limit;
    const query = {};

    // Apply filters
    if (filters.role) {
      query.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive === 'true' || filters.isActive === true;
    }

    // Search by email or operativeId
    if (filters.search) {
      query.$or = [
        { email: { $regex: filters.search, $options: 'i' } },
        { operativeId: { $regex: filters.search, $options: 'i' } },
      ];
    }

    // Get total count
    const total = await User.countDocuments(query);

    // Get users
    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Convert to JSON format (removes password, converts _id to id)
    const usersList = users.map((user) => {
      const userObj = { ...user };
      userObj.id = userObj._id.toString();
      delete userObj._id;
      delete userObj.password;
      delete userObj.__v;
      return userObj;
    });

    return {
      users: usersList,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get all users error:', error);
    throw error;
  }
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Object} User object
 */
export const getUserById = async (userId) => {
  try {
    const user = await User.findById(userId).lean();
    
    if (!user) {
      throw new Error('User not found');
    }

    // Convert to JSON format
    const userObj = { ...user };
    userObj.id = userObj._id.toString();
    delete userObj._id;
    delete userObj.password;
    delete userObj.__v;
    
    return userObj;
  } catch (error) {
    logger.error('Get user by ID error:', error);
    throw error;
  }
};

/**
 * Create a new user
 * @param {Object} userData - User data (email, password, operativeId, role, metadata)
 * @returns {Object} Created user object
 */
export const createUser = async (userData) => {
  try {
    // Validate email
    if (!userData.email) {
      throw new Error('Email is required');
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [
        { email: userData.email.toLowerCase() },
        { operativeId: userData.operativeId?.toUpperCase() },
      ],
    });

    if (existingUser) {
      throw new Error('User with this email or operative ID already exists');
    }

    // Prevent creating admin if one already exists
    if (userData.role === ROLES.ADMIN) {
      const existingAdmin = await User.findOne({ role: ROLES.ADMIN });
      if (existingAdmin) {
        throw new Error('Only one admin user is allowed in the system');
      }
    }

    // Generate operative ID if not provided
    let operativeId = userData.operativeId;
    if (!operativeId) {
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      operativeId = `USER_${timestamp}_${random}`;
    }

    // Create user
    const user = new User({
      email: userData.email.toLowerCase(),
      password: userData.password, // Will be hashed by pre-save hook
      operativeId: operativeId.toUpperCase(),
      role: userData.role || ROLES.OPERATIVE, // Default to operative
      isActive: userData.isActive !== undefined ? userData.isActive : true,
      metadata: userData.metadata || {},
    });

    await user.save();

    logger.info(`User created: ${user.operativeId} (${user.email}) by admin`);

    return user.toJSON();
  } catch (error) {
    logger.error('Create user error:', error);
    throw error;
  }
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} userData - Updated user data
 * @returns {Object} Updated user object
 */
export const updateUser = async (userId, userData) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent changing role to admin if admin already exists
    if (userData.role === ROLES.ADMIN && user.role !== ROLES.ADMIN) {
      const existingAdmin = await User.findOne({ 
        role: ROLES.ADMIN,
        _id: { $ne: userId }
      });
      if (existingAdmin) {
        throw new Error('Only one admin user is allowed in the system');
      }
    }

    // Update fields
    if (userData.email !== undefined) {
      // Check if email is already taken by another user
      const emailExists = await User.findOne({ 
        email: userData.email.toLowerCase(),
        _id: { $ne: userId }
      });
      if (emailExists) {
        throw new Error('Email already in use by another user');
      }
      user.email = userData.email.toLowerCase();
    }

    if (userData.password !== undefined && userData.password !== '') {
      user.password = userData.password; // Will be hashed by pre-save hook
    }

    if (userData.operativeId !== undefined) {
      // Check if operative ID is already taken by another user
      const operativeIdExists = await User.findOne({ 
        operativeId: userData.operativeId.toUpperCase(),
        _id: { $ne: userId }
      });
      if (operativeIdExists) {
        throw new Error('Operative ID already in use by another user');
      }
      user.operativeId = userData.operativeId.toUpperCase();
    }

    if (userData.role !== undefined) {
      user.role = userData.role;
    }

    if (userData.isActive !== undefined) {
      user.isActive = userData.isActive;
    }

    if (userData.metadata !== undefined) {
      user.metadata = { ...user.metadata, ...userData.metadata };
    }

    await user.save();

    logger.info(`User updated: ${user.operativeId} (${user.email}) by admin`);

    return user.toJSON();
  } catch (error) {
    logger.error('Update user error:', error);
    throw error;
  }
};

/**
 * Delete user
 * @param {string} userId - User ID
 * @returns {boolean} Success status
 */
export const deleteUser = async (userId) => {
  try {
    const user = await User.findById(userId);

    if (!user) {
      throw new Error('User not found');
    }

    // Prevent deleting admin user
    if (user.role === ROLES.ADMIN) {
      throw new Error('Cannot delete admin user');
    }

    await User.findByIdAndDelete(userId);

    logger.info(`User deleted: ${user.operativeId} (${user.email}) by admin`);

    return true;
  } catch (error) {
    logger.error('Delete user error:', error);
    throw error;
  }
};

/**
 * Get user statistics
 * @returns {Object} User statistics
 */
export const getUserStats = async () => {
  try {
    const total = await User.countDocuments();
    const active = await User.countDocuments({ isActive: true });
    const inactive = await User.countDocuments({ isActive: false });

    // Count by role
    const byRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
        },
      },
    ]);

    const roleStats = {};
    byRole.forEach((item) => {
      roleStats[item._id] = item.count;
    });

    return {
      total,
      active,
      inactive,
      byRole: {
        admin: roleStats[ROLES.ADMIN] || 0,
        operative: roleStats[ROLES.OPERATIVE] || 0,
        analyst: roleStats[ROLES.ANALYST] || 0,
      },
    };
  } catch (error) {
    logger.error('Get user stats error:', error);
    throw error;
  }
};

export default {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
};

