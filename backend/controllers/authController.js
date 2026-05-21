const { validationResult } = require('express-validator');
const authService = require('../services/authService');
const AppError = require('../utils/AppError');

class AuthController {
  /**
   * Register a new user
   */
  async register(req, res, next) {
    try {
      // Validate inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(el => el.msg).join('. ');
        return next(new AppError(errorMessages, 400));
      }

      const { name, email, password, role } = req.body;
      const data = await authService.register({ name, email, password, role });

      res.status(201).json({
        success: true,
        message: 'Account successfully created!',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * User login
   */
  async login(req, res, next) {
    try {
      // Validate inputs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(el => el.msg).join('. ');
        return next(new AppError(errorMessages, 400));
      }

      const { email, password } = req.body;
      const data = await authService.login({ email, password });

      res.status(200).json({
        success: true,
        message: 'Login successful!',
        data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get currently logged-in user profile
   */
  async getMe(req, res, next) {
    try {
      // req.user has already been loaded by authMiddleware
      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
