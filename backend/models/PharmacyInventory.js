import mongoose from 'mongoose';

const pharmacyInventorySchema = new mongoose.Schema({
  pharmacy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pharmacy',
    required: [true, 'Pharmacy reference is required']
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  
  // Stock Information
  stockQuantity: {
    type: Number,
    required: [true, 'Stock quantity is required'],
    min: [0, 'Stock quantity cannot be negative'],
    default: 0
  },
  reorderLevel: {
    type: Number,
    default: 10,
    min: [0, 'Reorder level cannot be negative']
  },
  maxStockLevel: {
    type: Number,
    default: 1000,
    min: [0, 'Max stock level cannot be negative']
  },
  
  // Batch Information
  batches: [{
    batchNumber: {
      type: String,
      required: true,
      trim: true
    },
    quantity: {
      type: Number,
      required: true,
      min: [0, 'Batch quantity cannot be negative']
    },
    manufacturingDate: {
      type: Date
    },
    expiryDate: {
      type: Date,
      required: true
    },
    purchasePrice: {
      type: Number,
      required: true,
      min: [0, 'Purchase price cannot be negative']
    },
    supplierName: {
      type: String,
      trim: true
    },
    receivedDate: {
      type: Date,
      default: Date.now
    }
  }],

  // Pricing (Pharmacy-specific) - All prices in PKR
  pricing: {
    costPrice: {
      type: Number,
      required: [true, 'Cost price is required'],
      min: [0, 'Cost price cannot be negative']
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative']
    },
    mrp: {
      type: Number,
      required: [true, 'MRP is required'],
      min: [0, 'MRP cannot be negative']
    },
    discountPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Discount cannot be negative'],
      max: [100, 'Discount cannot exceed 100%']
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: [0, 'Discount amount cannot be negative']
    },
    taxPercentage: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    profitMargin: {
      type: Number,
      default: 0
    },
    currency: {
      type: String,
      default: 'PKR',
      enum: ['PKR']
    }
  },

  // Stock Status
  stockStatus: {
    type: String,
    enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Discontinued'],
    default: 'In Stock'
  },
  
  // Availability
  isAvailable: {
    type: Boolean,
    default: true
  },
  availableForSale: {
    type: Boolean,
    default: true
  },

  // Inventory Tracking
  lastRestockedDate: {
    type: Date
  },
  lastSoldDate: {
    type: Date
  },
  lastPurchaseDate: {
    type: Date
  },
  lastPurchaseQuantity: {
    type: Number,
    default: 0
  },
  
  // Sales Metrics
  totalSold: {
    type: Number,
    default: 0,
    min: [0, 'Total sold cannot be negative']
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: [0, 'Total revenue cannot be negative']
  },
  averageDailySales: {
    type: Number,
    default: 0
  },
  
  // Stock Management
  minimumOrderQuantity: {
    type: Number,
    default: 1,
    min: [1, 'Minimum order quantity must be at least 1']
  },
  optimalStockLevel: {
    type: Number,
    default: 100
  },
  leadTimeDays: {
    type: Number,
    default: 7,
    min: [0, 'Lead time cannot be negative']
  },
  
  // Alerts and Notifications
  lowStockAlert: {
    enabled: {
      type: Boolean,
      default: true
    },
    threshold: {
      type: Number,
      default: 10
    },
    lastAlertDate: {
      type: Date
    }
  },
  expiryAlert: {
    enabled: {
      type: Boolean,
      default: true
    },
    daysBeforeExpiry: {
      type: Number,
      default: 90
    },
    lastAlertDate: {
      type: Date
    }
  },

  // Location in Store
  warehouseLocation: {
    section: {
      type: String,
      trim: true
    },
    rackNumber: {
      type: String,
      trim: true
    },
    shelfNumber: {
      type: String,
      trim: true
    },
    binNumber: {
      type: String,
      trim: true
    }
  },
  
  // Supplier Information
  preferredSupplier: {
    name: {
      type: String,
      trim: true
    },
    contactNumber: {
      type: String,
      trim: true
    },
    lastSupplyDate: {
      type: Date
    }
  },

  // Notes
  notes: {
    type: String,
    trim: true,
    maxLength: [1000, 'Notes cannot exceed 1000 characters']
  },
  internalNotes: [{
    note: {
      type: String,
      trim: true
    },
    addedBy: {
      type: String,
      trim: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for performance
pharmacyInventorySchema.index({ pharmacy: 1, product: 1 }, { unique: true }); // Each pharmacy can have only one inventory entry per product
pharmacyInventorySchema.index({ pharmacy: 1, stockStatus: 1 });
pharmacyInventorySchema.index({ pharmacy: 1, isAvailable: 1 });
pharmacyInventorySchema.index({ product: 1 });
pharmacyInventorySchema.index({ stockQuantity: 1 });
pharmacyInventorySchema.index({ 'batches.expiryDate': 1 });
pharmacyInventorySchema.index({ pharmacy: 1, product: 1, isAvailable: 1 });

// Virtual for final price after discount
pharmacyInventorySchema.virtual('finalPrice').get(function() {
  if (this.pricing.discountAmount > 0) {
    return this.pricing.sellingPrice - this.pricing.discountAmount;
  } else if (this.pricing.discountPercentage > 0) {
    return this.pricing.sellingPrice * (1 - this.pricing.discountPercentage / 100);
  }
  return this.pricing.sellingPrice;
});

// Virtual for profit margin
pharmacyInventorySchema.virtual('profitMargin').get(function() {
  if (this.pricing.costPrice === 0) return 0;
  const profit = this.finalPrice - this.pricing.costPrice;
  return (profit / this.pricing.costPrice) * 100;
});

// Virtual for checking if near expiry (within 3 months)
pharmacyInventorySchema.virtual('hasNearExpiryBatch').get(function() {
  if (!this.batches || this.batches.length === 0) return false;
  
  const threeMonthsFromNow = new Date();
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
  
  return this.batches.some(batch => 
    new Date(batch.expiryDate) <= threeMonthsFromNow && 
    new Date(batch.expiryDate) > new Date()
  );
});

// Virtual for expired batches
pharmacyInventorySchema.virtual('hasExpiredBatch').get(function() {
  if (!this.batches || this.batches.length === 0) return false;
  
  return this.batches.some(batch => new Date(batch.expiryDate) <= new Date());
});

// Pre-save middleware to update stock status and calculations
pharmacyInventorySchema.pre('save', function(next) {
  // Update stock status based on quantity
  if (this.stockQuantity === 0) {
    this.stockStatus = 'Out of Stock';
    this.isAvailable = false;
  } else if (this.stockQuantity <= this.reorderLevel) {
    this.stockStatus = 'Low Stock';
    this.isAvailable = true;
  } else {
    this.stockStatus = 'In Stock';
    this.isAvailable = true;
  }

  // Calculate discount amount based on percentage
  if (this.pricing.discountPercentage > 0 && this.pricing.discountAmount === 0) {
    this.pricing.discountAmount = this.pricing.sellingPrice * (this.pricing.discountPercentage / 100);
  }

  // Calculate profit margin automatically
  if (this.pricing.costPrice > 0) {
    const finalPrice = this.finalPrice;
    this.pricing.profitMargin = ((finalPrice - this.pricing.costPrice) / this.pricing.costPrice) * 100;
  }

  // Update low stock alert threshold if not set
  if (!this.lowStockAlert.threshold) {
    this.lowStockAlert.threshold = this.reorderLevel;
  }

  // Remove expired batches from available stock
  if (this.batches && this.batches.length > 0) {
    const now = new Date();
    const expiredQuantity = this.batches
      .filter(batch => new Date(batch.expiryDate) <= now)
      .reduce((sum, batch) => sum + batch.quantity, 0);
    
    if (expiredQuantity > 0 && this.stockQuantity > expiredQuantity) {
      // Note: In a real scenario, you'd want to handle expired stock separately
      // This is just a simple check
    }
  }

  next();
});

// Instance method to deduct stock
pharmacyInventorySchema.methods.deductStock = async function(quantity) {
  if (this.stockQuantity < quantity) {
    throw new Error('Insufficient stock available');
  }
  
  this.stockQuantity -= quantity;
  this.totalSold += quantity;
  this.lastSoldDate = new Date();
  
  // Deduct from batches (FIFO - First In First Out based on expiry)
  let remainingToDeduct = quantity;
  const sortedBatches = this.batches.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));
  
  for (let batch of sortedBatches) {
    if (remainingToDeduct <= 0) break;
    
    if (batch.quantity >= remainingToDeduct) {
      batch.quantity -= remainingToDeduct;
      remainingToDeduct = 0;
    } else {
      remainingToDeduct -= batch.quantity;
      batch.quantity = 0;
    }
  }
  
  // Remove empty batches
  this.batches = this.batches.filter(batch => batch.quantity > 0);
  
  return this.save();
};

// Instance method to add stock
pharmacyInventorySchema.methods.addStock = async function(quantity, batchInfo) {
  this.stockQuantity += quantity;
  this.lastRestockedDate = new Date();
  
  if (batchInfo) {
    this.batches.push({
      ...batchInfo,
      quantity: quantity
    });
  }
  
  return this.save();
};

// Static method to find low stock items for a pharmacy
pharmacyInventorySchema.statics.findLowStock = function(pharmacyId) {
  return this.find({
    pharmacy: pharmacyId,
    stockStatus: 'Low Stock'
  }).populate('product');
};

// Static method to find out of stock items for a pharmacy
pharmacyInventorySchema.statics.findOutOfStock = function(pharmacyId) {
  return this.find({
    pharmacy: pharmacyId,
    stockStatus: 'Out of Stock'
  }).populate('product');
};

// Static method to find items expiring soon
pharmacyInventorySchema.statics.findExpiringSoon = function(pharmacyId, daysThreshold = 90) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() + daysThreshold);
  
  return this.find({
    pharmacy: pharmacyId,
    'batches.expiryDate': { $lte: thresholdDate, $gt: new Date() }
  }).populate('product');
};

// Static method to check product availability at a pharmacy
pharmacyInventorySchema.statics.checkAvailability = function(pharmacyId, productId, requiredQuantity = 1) {
  return this.findOne({
    pharmacy: pharmacyId,
    product: productId,
    stockQuantity: { $gte: requiredQuantity },
    isAvailable: true,
    availableForSale: true
  }).populate('product');
};

// Static method to get items needing reorder
pharmacyInventorySchema.statics.getReorderList = function(pharmacyId) {
  return this.find({
    pharmacy: pharmacyId,
    stockQuantity: { $lte: this.reorderLevel },
    stockStatus: { $in: ['Low Stock', 'Out of Stock'] },
    isAvailable: true
  }).populate('product').sort({ stockQuantity: 1 });
};

// Static method to get inventory value report
pharmacyInventorySchema.statics.getInventoryValueReport = async function(pharmacyId) {
  const result = await this.aggregate([
    { $match: { pharmacy: pharmacyId } },
    {
      $group: {
        _id: null,
        totalItems: { $sum: 1 },
        totalStockQuantity: { $sum: '$stockQuantity' },
        totalCostValue: { 
          $sum: { $multiply: ['$stockQuantity', '$pricing.costPrice'] }
        },
        totalSellingValue: { 
          $sum: { $multiply: ['$stockQuantity', '$pricing.sellingPrice'] }
        },
        totalMRPValue: { 
          $sum: { $multiply: ['$stockQuantity', '$pricing.mrp'] }
        },
        potentialProfit: {
          $sum: { 
            $multiply: [
              '$stockQuantity', 
              { $subtract: ['$pricing.sellingPrice', '$pricing.costPrice'] }
            ]
          }
        }
      }
    }
  ]);
  
  return result[0] || {
    totalItems: 0,
    totalStockQuantity: 0,
    totalCostValue: 0,
    totalSellingValue: 0,
    totalMRPValue: 0,
    potentialProfit: 0
  };
};

// Static method to get fast-moving items
pharmacyInventorySchema.statics.getFastMovingItems = function(pharmacyId, limit = 10) {
  return this.find({
    pharmacy: pharmacyId
  })
  .populate('product')
  .sort({ totalSold: -1, averageDailySales: -1 })
  .limit(limit);
};

// Static method to get slow-moving items
pharmacyInventorySchema.statics.getSlowMovingItems = function(pharmacyId, limit = 10) {
  return this.find({
    pharmacy: pharmacyId,
    stockQuantity: { $gt: 0 }
  })
  .populate('product')
  .sort({ totalSold: 1, averageDailySales: 1, lastSoldDate: 1 })
  .limit(limit);
};

// Instance method to update sales metrics
pharmacyInventorySchema.methods.updateSalesMetrics = async function(quantity, saleAmount) {
  this.totalSold += quantity;
  this.totalRevenue += saleAmount;
  this.lastSoldDate = new Date();
  
  // Calculate average daily sales
  const daysSinceFirstSale = Math.max(1, Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)));
  this.averageDailySales = this.totalSold / daysSinceFirstSale;
  
  return this.save();
};

// Instance method to add internal note
pharmacyInventorySchema.methods.addNote = async function(note, addedBy) {
  this.internalNotes.push({
    note,
    addedBy,
    addedAt: new Date()
  });
  return this.save();
};

const PharmacyInventory = mongoose.model('PharmacyInventory', pharmacyInventorySchema);

export default PharmacyInventory;

