import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  productSnapshot: {
    productName: String,
    brandName: String,
    genericName: String,
    manufacturer: String,
    strength: String,
    packaging: {
      packSize: String,
      unit: String
    },
    dosageForm: String,
    image: String
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  unitPrice: {
    type: Number,
    required: [true, 'Unit price is required'],
    min: [0, 'Unit price cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
  },
  taxAmount: {
    type: Number,
    default: 0,
    min: [0, 'Tax cannot be negative']
  },
  subtotal: {
    type: Number,
    required: true,
    min: [0, 'Subtotal cannot be negative']
  },
  prescriptionRequired: {
    type: Boolean,
    default: false
  },
  batchNumber: {
    type: String,
    trim: true
  },
  expiryDate: {
    type: Date
  }
}, {
  _id: false
});

const orderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // References
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required']
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: [true, 'Pharmacy reference is required']
  },

  // Order Items
  items: [orderItemSchema],

  // Customer Information
  customerInfo: {
    fullName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },

  // Delivery Information
  deliveryAddress: {
    addressLine1: {
      type: String,
      required: [true, 'Address line 1 is required'],
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true
    },
    landmark: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      default: 'Pakistan'
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },

  deliveryType: {
    type: String,
    enum: ['Home Delivery', 'Store Pickup'],
    default: 'Home Delivery'
  },

  // Pricing Details
  pricing: {
    itemsTotal: {
      type: Number,
      required: true,
      min: [0, 'Items total cannot be negative']
    },
    totalDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Total discount cannot be negative']
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charges cannot be negative']
    },
    taxAmount: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    couponDiscount: {
      type: Number,
      default: 0,
      min: [0, 'Coupon discount cannot be negative']
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    }
  },

  // Coupon
  appliedCoupon: {
    code: {
      type: String,
      trim: true,
      uppercase: true
    },
    discountAmount: {
      type: Number,
      default: 0
    }
  },

  // Payment Information
  payment: {
    method: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['Cash on Delivery', 'Credit Card', 'Debit Card', 'Online Banking', 'Mobile Wallet', 'UPI', 'Other']
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending', 'Processing', 'Paid', 'Failed', 'Refunded', 'Partially Refunded'],
      default: 'Pending'
    },
    transactionId: {
      type: String,
      trim: true
    },
    paidAt: {
      type: Date
    },
    paymentGateway: {
      type: String,
      trim: true
    },
    failureReason: {
      type: String,
      trim: true
    }
  },

  // Prescription
  prescriptions: [{
    url: {
      type: String,
      required: true,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verifiedAt: {
      type: Date
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Verified', 'Rejected'],
      default: 'Pending'
    },
    rejectionReason: {
      type: String,
      trim: true
    }
  }],

  // Order Status
  orderStatus: {
    type: String,
    required: true,
    enum: [
      'Pending',
      'Confirmed',
      'Processing',
      'Prescription Verification Pending',
      'Ready for Pickup',
      'Out for Delivery',
      'Delivered',
      'Cancelled',
      'Refunded',
      'Failed'
    ],
    default: 'Pending'
  },

  // Status History
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      trim: true
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Delivery Tracking
  delivery: {
    assignedTo: {
      name: {
        type: String,
        trim: true
      },
      phoneNumber: {
        type: String,
        trim: true
      },
      vehicleNumber: {
        type: String,
        trim: true
      }
    },
    estimatedDeliveryTime: {
      type: Date
    },
    actualDeliveryTime: {
      type: Date
    },
    trackingNumber: {
      type: String,
      trim: true
    },
    deliveryInstructions: {
      type: String,
      trim: true
    },
    deliveryAttempts: {
      type: Number,
      default: 0
    }
  },

  // Cancellation
  cancellation: {
    cancelledBy: {
      type: String,
      enum: ['Customer', 'Pharmacy', 'Admin', 'System']
    },
    cancelledAt: {
      type: Date
    },
    reason: {
      type: String,
      trim: true
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    refundStatus: {
      type: String,
      enum: ['Pending', 'Processed', 'Failed'],
      default: 'Pending'
    }
  },

  // Ratings and Feedback
  rating: {
    overall: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    delivery: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    packaging: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    productQuality: {
      type: Number,
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5']
    },
    review: {
      type: String,
      trim: true,
      maxLength: [1000, 'Review cannot exceed 1000 characters']
    },
    ratedAt: {
      type: Date
    }
  },

  // Special Instructions
  specialInstructions: {
    type: String,
    trim: true,
    maxLength: [500, 'Special instructions cannot exceed 500 characters']
  },

  // Notes (Internal - for pharmacy/admin)
  internalNotes: [{
    note: {
      type: String,
      trim: true
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Important Dates
  confirmedAt: Date,
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,

  // Flags
  isUrgent: {
    type: Boolean,
    default: false
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  requiresPrescription: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ pharmacy: 1, createdAt: -1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ deliveredAt: -1 });

// Compound indexes
orderSchema.index({ user: 1, orderStatus: 1 });
orderSchema.index({ pharmacy: 1, orderStatus: 1 });
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ user: 1, orderStatus: 1, createdAt: -1 });

// Virtual for total items
orderSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for order age in hours
orderSchema.virtual('orderAgeInHours').get(function() {
  const now = new Date();
  const diffMs = now - this.createdAt;
  return Math.floor(diffMs / (1000 * 60 * 60));
});

// Virtual for full delivery address
orderSchema.virtual('fullDeliveryAddress').get(function() {
  const addr = this.deliveryAddress;
  const parts = [addr.addressLine1];
  if (addr.addressLine2) parts.push(addr.addressLine2);
  if (addr.landmark) parts.push(addr.landmark);
  parts.push(addr.city, `${addr.state} ${addr.postalCode}`, addr.country);
  return parts.join(', ');
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew) {
    // Generate order number: ORD-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `ORD-${dateStr}-${randomNum}`;

    // Add initial status to history
    this.statusHistory.push({
      status: this.orderStatus,
      timestamp: new Date(),
      note: 'Order created'
    });
  }

  // Check if any item requires prescription
  this.requiresPrescription = this.items.some(item => item.prescriptionRequired);

  // Update isPaid flag
  this.isPaid = this.payment.status === 'Paid';

  next();
});

// Instance method to update order status
orderSchema.methods.updateStatus = async function(newStatus, note, updatedBy) {
  this.orderStatus = newStatus;
  
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    note: note || `Status changed to ${newStatus}`,
    updatedBy
  });

  // Update relevant date fields
  const now = new Date();
  switch (newStatus) {
    case 'Confirmed':
      this.confirmedAt = now;
      break;
    case 'Processing':
      this.processedAt = now;
      break;
    case 'Out for Delivery':
      this.shippedAt = now;
      break;
    case 'Delivered':
      this.deliveredAt = now;
      this.delivery.actualDeliveryTime = now;
      break;
  }

  return this.save();
};

// Instance method to add internal note
orderSchema.methods.addInternalNote = async function(note, addedBy) {
  this.internalNotes.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

// Instance method to cancel order
orderSchema.methods.cancelOrder = async function(cancelledBy, reason, refundAmount = 0) {
  this.orderStatus = 'Cancelled';
  this.cancellation = {
    cancelledBy,
    cancelledAt: new Date(),
    reason,
    refundAmount,
    refundStatus: refundAmount > 0 ? 'Pending' : 'Processed'
  };

  this.statusHistory.push({
    status: 'Cancelled',
    timestamp: new Date(),
    note: `Order cancelled by ${cancelledBy}: ${reason}`
  });

  return this.save();
};

// Instance method to add rating
orderSchema.methods.addRating = async function(ratingData) {
  this.rating = {
    ...ratingData,
    ratedAt: new Date()
  };
  return this.save();
};

// Static method to get user's orders
orderSchema.statics.getUserOrders = function(userId, status = null) {
  const query = { user: userId };
  if (status) {
    query.orderStatus = status;
  }
  return this.find(query)
    .populate('pharmacy', 'pharmacyName address phoneNumber')
    .sort({ createdAt: -1 });
};

// Static method to get pharmacy's orders
orderSchema.statics.getPharmacyOrders = function(pharmacyId, status = null) {
  const query = { pharmacy: pharmacyId };
  if (status) {
    query.orderStatus = status;
  }
  return this.find(query)
    .populate('user', 'name email phoneNumber')
    .sort({ createdAt: -1 });
};

// Static method to get pending orders for pharmacy
orderSchema.statics.getPendingOrders = function(pharmacyId) {
  return this.find({
    pharmacy: pharmacyId,
    orderStatus: { $in: ['Pending', 'Confirmed', 'Processing'] }
  })
  .populate('user', 'name email phoneNumber')
  .sort({ createdAt: 1 });
};

// Static method to get orders requiring prescription verification
orderSchema.statics.getOrdersRequiringPrescriptionVerification = function(pharmacyId) {
  return this.find({
    pharmacy: pharmacyId,
    requiresPrescription: true,
    'prescriptions.verificationStatus': 'Pending',
    orderStatus: { $nin: ['Cancelled', 'Delivered', 'Failed'] }
  })
  .populate('user', 'name email phoneNumber')
  .sort({ createdAt: 1 });
};

// Static method to get orders by status
orderSchema.statics.getOrdersByStatus = function(pharmacyId, statuses) {
  return this.find({
    pharmacy: pharmacyId,
    orderStatus: { $in: statuses }
  })
  .populate('user', 'name email phoneNumber')
  .sort({ createdAt: -1 });
};

// Static method to get delivery analytics
orderSchema.statics.getDeliveryAnalytics = function(pharmacyId, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        pharmacy: mongoose.Types.ObjectId(pharmacyId),
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: '$orderStatus',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' }
      }
    }
  ]);
};

const Order = mongoose.model('Order', orderSchema);

export default Order;

