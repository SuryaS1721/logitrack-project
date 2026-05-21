const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { restrictTo } = require('../middleware/roleMiddleware');

const router = express.Router();

// Apply protect middleware to ALL order routes
router.use(protect);

// Customer-Specific Routes
router.post(
  '/',
  restrictTo('Customer'),
  [
    body('pickupAddress').trim().notEmpty().withMessage('Pickup address is required'),
    body('deliveryAddress').trim().notEmpty().withMessage('Delivery address is required'),
    body('packageType')
      .isIn(['Standard', 'Fragile', 'Express', 'Hazardous'])
      .withMessage('Package type must be Standard, Fragile, Express, or Hazardous'),
    body('weight')
      .isFloat({ min: 0.1 })
      .withMessage('Weight must be a positive number greater than 0.1 kg')
  ],
  orderController.createOrder
);

router.get('/', restrictTo('Customer'), orderController.getMyOrders);

router.delete('/:id', restrictTo('Customer'), orderController.cancelOrder);

// Admin-Specific Routes
router.get('/all', restrictTo('Admin'), orderController.getAllOrders);

router.patch(
  '/:id/status',
  restrictTo('Admin'),
  [
    body('status')
      .isIn(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'])
      .withMessage('Status must be PENDING, CONFIRMED, SHIPPED, or DELIVERED')
  ],
  orderController.updateOrderStatus
);

// Shared Routes (Admin or Order Owner)
router.get('/:id', orderController.getOrderById);

module.exports = router;
