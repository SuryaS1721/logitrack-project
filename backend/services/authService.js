const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

class AuthService {
  /**
   * Register a new user
   */
  async register({ name, email, password, role }) {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new AppError('Email address is already registered!', 400);
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role: role || 'Customer',
    });

    // Generate JWT token
    const token = this.generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    return { user, token };
  }

  /**
   * Login user and issue JWT
   */
  async login({ email, password }) {
    if (!email || !password) {
      throw new AppError('Please provide email and password', 400);
    }

    // Find user and explicitly select password field
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw new AppError('Invalid login credentials!', 401);
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new AppError('Invalid login credentials!', 401);
    }

    // Generate JWT token
    const token = this.generateToken(user._id);

    // Remove password from response
    user.password = undefined;

    return { user, token };
  }

  /**
   * Generate JWT Token
   */
  generateToken(id) {
    return jwt.sign(
      { id },
      process.env.JWT_SECRET || 'logitrack-super-secret-key-9812-auth',
      {
        expiresIn: process.env.JWT_EXPIRE || '30d',
      }
    );
  }
}

module.exports = new AuthService();
