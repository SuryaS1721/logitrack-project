require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');
const errorHandler = require('./middleware/errorHandler');
const AppError = require('./utils/AppError');
const Order = require('./models/Order');

// Initialize database
connectDB();

const app = express();

// Handle CORS
app.use(
  cors({
    origin: '*', // Allow all origins for dev simplicity
    credentials: true,
  })
);

// Body Parser
app.use(express.json());

// Simple custom request logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Rate limiting to defend against API brute-forcing
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  }
});
app.use('/api/', limiter);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the LogiTrack Dispatch REST API API!'
  });
});

// Handle unmounted routes (404 Fallback)
app.all('*', (req, res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found on this server!`, 404));
});

// Centralized error handling middleware
app.use(errorHandler);

// Set Port
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`Server launched in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// ----------------------------------------------------
// 🚀 Live Transit Simulator Engine (Background worker)
// ----------------------------------------------------
setInterval(async () => {
  try {
    // Find all orders in SHIPPED status to advance coordinates
    const shippedOrders = await Order.find({ status: 'SHIPPED' });
    
    for (const order of shippedOrders) {
      const { pickup, delivery, current } = order.coordinates;
      
      const dx = delivery.x - pickup.x;
      const dy = delivery.y - pickup.y;
      const stepSize = 0.15; // Moves 15% distance per 8s tick (~50s total trip)

      // Calculate active route progress ratio
      let progress = 0;
      if (Math.abs(dx) > Math.abs(dy)) {
        progress = (current.x - pickup.x) / dx;
      } else {
        progress = (current.y - pickup.y) / dy;
      }

      let newProgress = progress + stepSize;

      if (newProgress >= 1.0) {
        // Cargo arrived! Advance state to DELIVERED
        order.status = 'DELIVERED';
        order.coordinates.current = delivery;
        order.history.push({
          status: 'DELIVERED',
          timestamp: new Date(),
          note: 'Transit flight path completed. Cargo safely arrived at delivery address.'
        });
        console.log(`[Simulator] Package ${order.trackingId} has arrived at destination.`);
      } else {
        // Move airplane closer along Cartesian line
        order.coordinates.current.x = Math.round(pickup.x + dx * newProgress);
        order.coordinates.current.y = Math.round(pickup.y + dy * newProgress);
      }
      
      await order.save();
    }
  } catch (error) {
    console.error(`[Simulator Error] Failed to process active coordinates tick:`, error.message);
  }
}, 8000); // Simulates tick movements every 8 seconds!
// ----------------------------------------------------

// Handle Unhandled Promise Rejections (e.g. database disconnects)
process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Handle Uncaught Exceptions
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message, err.stack);
  process.exit(1);
});
