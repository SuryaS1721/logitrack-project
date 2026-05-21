const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    pickupAddress: {
      type: String,
      required: [true, 'Please provide a pickup address'],
      trim: true,
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Please provide a delivery address'],
      trim: true,
    },
    packageType: {
      type: String,
      required: [true, 'Please select a package type'],
      enum: ['Standard', 'Fragile', 'Express', 'Hazardous'],
    },
    weight: {
      type: Number,
      required: [true, 'Please provide package weight'],
      min: [0.1, 'Weight must be at least 0.1 kg'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED'],
      default: 'PENDING',
      index: true,
    },
    estimatedDeliveryDate: {
      type: Date,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: [0, 'Price cannot be negative'],
    },
    coordinates: {
      pickup: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
      },
      delivery: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
      },
      current: {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 }
      }
    },
    history: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String }
      }
    ]
  },
  {
    timestamps: true,
  }
);

// Create compound index for faster retrieval of customer orders by status
OrderSchema.index({ customer: 1, status: 1 });

module.exports = mongoose.model('Order', OrderSchema);
