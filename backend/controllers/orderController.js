const { validationResult } = require('express-validator');
const orderService = require('../services/orderService');
const AppError = require('../utils/AppError');

class OrderController {
  /**
   * Create new order
   */
  async createOrder(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(el => el.msg).join('. ');
        return next(new AppError(errorMessages, 400));
      }

      const order = await orderService.createOrder(req.user._id, req.body);

      res.status(201).json({
        success: true,
        message: 'Delivery order created successfully!',
        data: {
          order
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all orders for the current Customer
   */
  async getMyOrders(req, res, next) {
    try {
      const data = await orderService.getCustomerOrders(req.user._id, req.query);

      res.status(200).json({
        success: true,
        ...data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Get all system orders and platform statistics
   */
  async getAllOrders(req, res, next) {
    try {
      const data = await orderService.getAllPlatformOrders(req.query);

      res.status(200).json({
        success: true,
        ...data
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get detail for a specific order (Admin or Owner only)
   */
  async getOrderById(req, res, next) {
    try {
      const order = await orderService.getOrderById(req.params.id, req.user._id, req.user.role);

      res.status(200).json({
        success: true,
        data: {
          order
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cancel a PENDING order
   */
  async cancelOrder(req, res, next) {
    try {
      const result = await orderService.cancelOrder(req.params.id, req.user._id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Admin: Update order status (PENDING -> CONFIRMED -> SHIPPED -> DELIVERED)
   */
  async updateOrderStatus(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const errorMessages = errors.array().map(el => el.msg).join('. ');
        return next(new AppError(errorMessages, 400));
      }

      const { status } = req.body;
      const order = await orderService.updateOrderStatus(req.params.id, status);

      res.status(200).json({
        success: true,
        message: `Order status advanced to ${status} successfully!`,
        data: {
          order
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new OrderController();
