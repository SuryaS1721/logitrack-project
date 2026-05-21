const Order = require('../models/Order');
const AppError = require('../utils/AppError');

class OrderService {
  /**
   * Create a new delivery order
   */
  async createOrder(userId, orderData) {
    const { pickupAddress, deliveryAddress, packageType, weight } = orderData;

    if (!pickupAddress || !deliveryAddress || !packageType || !weight) {
      throw new AppError('Please provide all required fields: pickupAddress, deliveryAddress, packageType, weight', 400);
    }

    // Generate unique Tracking ID: TRK-YYYYMMDD-XXXX (4 random characters)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
    const trackingId = `TRK-${dateStr}-${randomChars}`;

    // Dynamic pricing calculation
    let basePrice = 12.0; // Flat base fee
    const weightFee = parseFloat(weight) * 2.5; // $2.5 per kg
    let categoryPremium = 0.0;

    switch (packageType) {
      case 'Fragile':
        categoryPremium = 8.5;
        break;
      case 'Express':
        categoryPremium = 15.0;
        break;
      case 'Hazardous':
        categoryPremium = 25.0;
        break;
      default:
        categoryPremium = 0.0;
    }

    const price = Math.round((basePrice + weightFee + categoryPremium) * 100) / 100;

    // Estimate delivery date (+3 days from now, or +1 if Express)
    const daysToAdd = packageType === 'Express' ? 1 : 3;
    const estimatedDeliveryDate = new Date();
    estimatedDeliveryDate.setDate(estimatedDeliveryDate.getDate() + daysToAdd);

    // Generate mockup Cartesian coordinates for visual map tracking
    // Pickup: x=100-250, y=100-300
    // Delivery: x=550-700, y=100-300
    const pickupX = Math.floor(Math.random() * 150) + 80;
    const pickupY = Math.floor(Math.random() * 200) + 100;
    const deliveryX = Math.floor(Math.random() * 150) + 550;
    const deliveryY = Math.floor(Math.random() * 200) + 100;

    const coordinates = {
      pickup: { x: pickupX, y: pickupY },
      delivery: { x: deliveryX, y: deliveryY },
      current: { x: pickupX, y: pickupY } // Starts at pickup location
    };

    // Construct history array
    const history = [
      {
        status: 'PENDING',
        note: 'Order placed by customer and awaiting confirmation.',
        timestamp: new Date()
      }
    ];

    const order = await Order.create({
      trackingId,
      customer: userId,
      pickupAddress,
      deliveryAddress,
      packageType,
      weight,
      price,
      estimatedDeliveryDate,
      coordinates,
      history,
      status: 'PENDING'
    });

    return order;
  }

  /**
   * Get paginated orders for a specific Customer
   */
  async getCustomerOrders(userId, queryParams) {
    const { status, search, page = 1, limit = 5 } = queryParams;
    
    // Construct database query filter
    const filter = { customer: userId };

    // Apply status filter
    if (status) {
      filter.status = status;
    }

    // Apply search filter (match tracking ID or addresses case-insensitively)
    if (search) {
      filter.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
        { deliveryAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const skipIndex = (page - 1) * limit;

    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    return {
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Admin: Get all platform orders with advanced searching & filters
   */
  async getAllPlatformOrders(queryParams) {
    const { status, search, page = 1, limit = 10 } = queryParams;
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { trackingId: { $regex: search, $options: 'i' } },
        { pickupAddress: { $regex: search, $options: 'i' } },
        { deliveryAddress: { $regex: search, $options: 'i' } }
      ];
    }

    const skipIndex = (page - 1) * limit;

    const total = await Order.countDocuments(filter);
    
    // Populate user profile info (name, email)
    const orders = await Order.find(filter)
      .populate('customer', 'name email')
      .sort({ createdAt: -1 })
      .skip(skipIndex)
      .limit(parseInt(limit));

    // Get order status summary counts for dashboard stats
    const stats = {
      pending: await Order.countDocuments({ status: 'PENDING' }),
      confirmed: await Order.countDocuments({ status: 'CONFIRMED' }),
      shipped: await Order.countDocuments({ status: 'SHIPPED' }),
      delivered: await Order.countDocuments({ status: 'DELIVERED' }),
      totalOrders: await Order.countDocuments(),
    };

    return {
      orders,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Fetch single order by Tracking ID or Mongo ID
   */
  async getOrderById(orderId, userId, userRole) {
    let order;

    // Check if input is a valid MongoDB ObjectId
    if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderId).populate('customer', 'name email');
    } else {
      order = await Order.findOne({ trackingId: orderId }).populate('customer', 'name email');
    }

    if (!order) {
      throw new AppError('Order not found!', 404);
    }

    // Role Security: Customers can only fetch their own orders, Admins can fetch any
    if (userRole !== 'Admin' && order.customer._id.toString() !== userId.toString()) {
      throw new AppError('Access Denied: You are not authorized to view this shipment.', 403);
    }

    return order;
  }

  /**
   * Cancel an order (Allowed only before status advances from PENDING)
   */
  async cancelOrder(orderId, userId) {
    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found!', 404);
    }

    // Check ownership
    if (order.customer.toString() !== userId.toString()) {
      throw new AppError('Access Denied: You can only cancel your own shipments.', 403);
    }

    // Restriction check: status MUST be PENDING
    if (order.status !== 'PENDING') {
      throw new AppError(`Cancellation Denied: Shipment has already been ${order.status.toLowerCase()} and cannot be cancelled.`, 400);
    }

    // Remove the order from Database
    await Order.findByIdAndDelete(orderId);

    return { success: true, message: 'Order successfully cancelled and deleted.' };
  }

  /**
   * Admin: Advance order status and log into timeline auditing
   */
  async updateOrderStatus(orderId, newStatus) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'];
    if (!validStatuses.includes(newStatus)) {
      throw new AppError(`Invalid status '${newStatus}'. Allowed: ${validStatuses.join(', ')}`, 400);
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new AppError('Order not found!', 404);
    }

    // Prevent moving backwards or double transitions
    if (order.status === newStatus) {
      return order;
    }

    // Append history note based on status change
    let note = '';
    switch (newStatus) {
      case 'CONFIRMED':
        note = 'Order verified. Dispatch preparing cargo.';
        break;
      case 'SHIPPED':
        note = 'Cargo shipped. Package is in active transit to destination.';
        break;
      case 'DELIVERED':
        note = 'Package successfully delivered and signed by recipient.';
        // Set current coordinates equal to delivery final address coordinates
        order.coordinates.current = order.coordinates.delivery;
        break;
      default:
        note = `Order advanced to ${newStatus}`;
    }

    order.status = newStatus;
    order.history.push({
      status: newStatus,
      timestamp: new Date(),
      note
    });

    await order.save();
    return order;
  }
}

module.exports = new OrderService();
