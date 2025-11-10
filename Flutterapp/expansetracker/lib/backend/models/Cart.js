import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  inventoryItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PharmacyInventory',
    required: [true, 'Inventory item reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: [0, 'Discount cannot be negative']
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
  prescriptionUploaded: {
    type: Boolean,
    default: false
  }
}, {
  _id: false,
  timestamps: true
});

const cartSchema = new mongoose.Schema({
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
  items: [cartItemSchema],
  
  // Pricing Summary
  itemsTotal: {
    type: Number,
    default: 0,
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
    min: [0, 'Tax amount cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0,
    min: [0, 'Total amount cannot be negative']
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
      default: 0,
      min: [0, 'Coupon discount cannot be negative']
    }
  },

  // Status
  status: {
    type: String,
    enum: ['Active', 'Merged', 'Converted to Order', 'Abandoned'],
    default: 'Active'
  },

  // Prescription
  requiresPrescription: {
    type: Boolean,
    default: false
  },
  prescriptions: [{
    url: {
      type: String,
      trim: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],

  // Last Activity
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
cartSchema.index({ user: 1, pharmacy: 1 }, { unique: true }); // Each user can have one cart per pharmacy
cartSchema.index({ user: 1, status: 1 });
cartSchema.index({ lastActivityAt: -1 });
cartSchema.index({ status: 1 });

// Virtual for total items count
cartSchema.virtual('totalItems').get(function() {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual for unique products count
cartSchema.virtual('uniqueProductsCount').get(function() {
  return this.items.length;
});

// Virtual for checking if cart is empty
cartSchema.virtual('isEmpty').get(function() {
  return this.items.length === 0;
});

// Pre-save middleware to calculate totals
cartSchema.pre('save', function(next) {
  // Calculate item subtotals and totals
  this.itemsTotal = 0;
  this.totalDiscount = 0;
  
  this.items.forEach(item => {
    item.subtotal = (item.price * item.quantity) - item.discountAmount;
    this.itemsTotal += item.price * item.quantity;
    this.totalDiscount += item.discountAmount;
  });

  // Check if any item requires prescription
  this.requiresPrescription = this.items.some(item => item.prescriptionRequired);

  // Calculate total amount
  let total = this.itemsTotal - this.totalDiscount;
  
  // Apply coupon discount if available
  if (this.appliedCoupon && this.appliedCoupon.discountAmount > 0) {
    total -= this.appliedCoupon.discountAmount;
  }
  
  // Add delivery charges
  total += this.deliveryCharges;
  
  // Add tax
  total += this.taxAmount;
  
  this.totalAmount = Math.max(0, total); // Ensure non-negative
  
  // Update last activity
  this.lastActivityAt = new Date();
  
  next();
});

// Instance method to add item to cart
cartSchema.methods.addItem = async function(productId, inventoryItemId, quantity, price, discountAmount = 0, prescriptionRequired = false) {
  // Check if item already exists
  const existingItemIndex = this.items.findIndex(
    item => item.product.toString() === productId.toString()
  );

  if (existingItemIndex > -1) {
    // Update quantity if item exists
    this.items[existingItemIndex].quantity += quantity;
    this.items[existingItemIndex].discountAmount = discountAmount;
  } else {
    // Add new item
    this.items.push({
      product: productId,
      inventoryItem: inventoryItemId,
      quantity,
      price,
      discountAmount,
      subtotal: (price * quantity) - discountAmount,
      prescriptionRequired
    });
  }

  return this.save();
};

// Instance method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const item = this.items.find(item => item.product.toString() === productId.toString());
  
  if (!item) {
    throw new Error('Item not found in cart');
  }

  if (quantity <= 0) {
    // Remove item if quantity is 0 or negative
    this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  } else {
    item.quantity = quantity;
  }

  return this.save();
};

// Instance method to remove item from cart
cartSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

// Instance method to clear cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.appliedCoupon = undefined;
  this.prescriptions = [];
  this.deliveryCharges = 0;
  this.taxAmount = 0;
  return this.save();
};

// Instance method to apply coupon
cartSchema.methods.applyCoupon = async function(couponCode, discountAmount) {
  this.appliedCoupon = {
    code: couponCode,
    discountAmount: discountAmount
  };
  return this.save();
};

// Instance method to remove coupon
cartSchema.methods.removeCoupon = async function() {
  this.appliedCoupon = undefined;
  return this.save();
};

// Instance method to add prescription
cartSchema.methods.addPrescription = async function(prescriptionUrl) {
  this.prescriptions.push({
    url: prescriptionUrl,
    uploadedAt: new Date()
  });
  
  // Mark prescription as uploaded for items
  this.items.forEach(item => {
    if (item.prescriptionRequired) {
      item.prescriptionUploaded = true;
    }
  });
  
  return this.save();
};

// Instance method to check if cart can be converted to order
cartSchema.methods.canConvertToOrder = function() {
  if (this.isEmpty) {
    return { valid: false, reason: 'Cart is empty' };
  }

  // Check if prescription is required but not uploaded
  const prescriptionRequired = this.items.some(item => item.prescriptionRequired && !item.prescriptionUploaded);
  if (prescriptionRequired && this.prescriptions.length === 0) {
    return { valid: false, reason: 'Prescription required but not uploaded' };
  }

  return { valid: true };
};

// Static method to find user's carts
cartSchema.statics.findUserCarts = function(userId) {
  return this.find({ user: userId, status: 'Active' })
    .populate('pharmacy')
    .populate({
      path: 'items.product',
      select: 'productName brandName images packaging strength requiresPrescription'
    });
};

// Static method to find abandoned carts
cartSchema.statics.findAbandonedCarts = function(daysThreshold = 7) {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - daysThreshold);
  
  return this.find({
    status: 'Active',
    lastActivityAt: { $lte: thresholdDate },
    items: { $ne: [] }
  }).populate('user pharmacy');
};

// Static method to get or create cart
cartSchema.statics.getOrCreateCart = async function(userId, pharmacyId) {
  let cart = await this.findOne({ user: userId, pharmacy: pharmacyId, status: 'Active' });
  
  if (!cart) {
    cart = await this.create({ user: userId, pharmacy: pharmacyId });
  }
  
  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;

