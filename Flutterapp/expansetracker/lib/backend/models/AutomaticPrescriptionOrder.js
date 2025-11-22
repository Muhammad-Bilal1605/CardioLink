import mongoose from 'mongoose';

const automaticPrescriptionOrderSchema = new mongoose.Schema({
  // Order Identification
  orderNumber: {
    type: String,
    unique: true,
    trim: true
  },
  
  // References
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: true
  },
  visitId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Visit',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Prescription Medications (from visit)
  medications: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    prescribedBy: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    durationMonths: {
      type: Number,
      default: 1,
      min: 1,
      max: 12
    },
    notes: String,
    // Pricing added by pharmacist
    unitPrice: {
      type: Number,
      min: 0
    },
    quantity: {
      type: Number,
      min: 1
    },
    subtotal: {
      type: Number,
      min: 0
    }
  }],

  // Pricing Information (set by pharmacist when accepting)
  pricing: {
    itemsTotal: {
      type: Number,
      min: 0,
      default: 0
    },
    deliveryCharges: {
      type: Number,
      min: 0,
      default: 0
    },
    taxAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    discountAmount: {
      type: Number,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      min: 0,
      default: 0
    }
  },

  // Patient Information
  patientInfo: {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    }
  },

  // Delivery Information (from patient's address or pharmacy default)
  deliveryAddress: {
    addressLine1: {
      type: String,
      required: true,
      trim: true
    },
    addressLine2: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    postalCode: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      default: 'Pakistan',
      trim: true
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

  // Order Status
  orderStatus: {
    type: String,
    required: true,
    enum: [
      'Pending',
      'Accepted',
      'Processing',
      'Out for Delivery',
      'Delivered',
      'Rejected',
      'Cancelled'
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

  // Rejection Information
  rejection: {
    rejectedAt: Date,
    rejectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: {
      type: String,
      trim: true
    }
  },

  // Pharmacy Response/Notes
  pharmacyNotes: {
    type: String,
    trim: true
  },

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
    }
  },

  // Important Dates
  acceptedAt: Date,
  processedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,

  // Flags
  isUrgent: {
    type: Boolean,
    default: false
  },
  isReadByPatient: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
automaticPrescriptionOrderSchema.index({ orderNumber: 1 });
automaticPrescriptionOrderSchema.index({ patientId: 1, createdAt: -1 });
automaticPrescriptionOrderSchema.index({ pharmacy: 1, createdAt: -1 });
automaticPrescriptionOrderSchema.index({ orderStatus: 1 });
automaticPrescriptionOrderSchema.index({ visitId: 1 });
automaticPrescriptionOrderSchema.index({ createdAt: -1 });

// Compound indexes
automaticPrescriptionOrderSchema.index({ patientId: 1, orderStatus: 1 });
automaticPrescriptionOrderSchema.index({ pharmacy: 1, orderStatus: 1 });

// Pre-save middleware to generate order number (runs before validation)
automaticPrescriptionOrderSchema.pre('validate', function(next) {
  if (this.isNew && !this.orderNumber) {
    // Generate order number: AUTO-YYYYMMDD-XXXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    this.orderNumber = `AUTO-${dateStr}-${randomNum}`;
  }
  next();
});

// Pre-save middleware to add status history
automaticPrescriptionOrderSchema.pre('save', function(next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    // Add initial status to history
    this.statusHistory = [{
      status: this.orderStatus,
      timestamp: new Date(),
      note: 'Automatic prescription order created'
    }];
  }
  next();
});

// Instance method to update order status
automaticPrescriptionOrderSchema.methods.updateStatus = async function(newStatus, note, updatedBy) {
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
    case 'Accepted':
      this.acceptedAt = now;
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

// Instance method to reject order
automaticPrescriptionOrderSchema.methods.rejectOrder = async function(reason, rejectedBy) {
  this.orderStatus = 'Rejected';
  this.rejection = {
    rejectedAt: new Date(),
    rejectedBy,
    reason
  };

  this.statusHistory.push({
    status: 'Rejected',
    timestamp: new Date(),
    note: `Order rejected: ${reason}`,
    updatedBy: rejectedBy
  });

  return this.save();
};

// Static method to get patient's automatic prescription orders
automaticPrescriptionOrderSchema.statics.getPatientOrders = function(patientId, status = null) {
  const query = { patientId };
  if (status) {
    query.orderStatus = status;
  }
  return this.find(query)
    .populate('pharmacy', 'pharmacyName address phoneNumber')
    .populate('visitId', 'date provider reason')
    .populate('doctorId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get pharmacy's automatic prescription orders
automaticPrescriptionOrderSchema.statics.getPharmacyOrders = function(pharmacyId, status = null) {
  const query = { pharmacy: pharmacyId };
  if (status) {
    query.orderStatus = status;
  }
  return this.find(query)
    .populate('patientId', 'firstName lastName email phoneNumber')
    .populate('visitId', 'date provider reason')
    .populate('doctorId', 'name email')
    .sort({ createdAt: -1 });
};

const AutomaticPrescriptionOrder = mongoose.model('AutomaticPrescriptionOrder', automaticPrescriptionOrderSchema);

export default AutomaticPrescriptionOrder;

