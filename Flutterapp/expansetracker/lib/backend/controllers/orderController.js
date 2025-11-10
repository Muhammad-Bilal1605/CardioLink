import mongoose from 'mongoose';
import Order from '../models/Order.js';
import PharmacyInventory from '../models/PharmacyInventory.js';
import Product from '../models/Product.js';
import Cart from '../models/Cart.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for prescription uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/prescriptions');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images and PDF files are allowed!'));
  }
});

export const uploadPrescription = upload.single('prescription');

// Create order from cart
export const createOrderFromCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cartId, deliveryAddress, deliveryType, paymentMethod, specialInstructions } = req.body;

    if (!cartId) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'cartId is required'
      });
    }

    const cart = await Cart.findOne({ _id: cartId, status: 'Active' })
      .populate('user')
      .populate('pharmacy')
      .populate('items.product')
      .session(session);

    if (!cart) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Patch legacy carts that might have been created without user reference
    if (!cart.user || !cart.user._id) {
      cart.user = req.userId;
      await cart.save({ session });
    }

    if (!cart.pharmacy || !cart.pharmacy._id) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cart has no associated pharmacy'
      });
    }

    if (cart.user._id?.toString() !== req.userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to place an order for this cart'
      });
    }

    const canConvert = cart.canConvertToOrder();
    if (!canConvert.valid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: canConvert.reason
      });
    }

    if (cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    // Deduct stock atomically
    const resolvedItems = [];

    for (const item of cart.items) {
      const productRef = item.product?._id ?? item.product;
      if (!productRef) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: 'Product details missing for an item in the cart. Please refresh your cart.'
        });
      }

      // Validate productRef format if string
      const productIdString = productRef.toString();
      if (!mongoose.Types.ObjectId.isValid(productIdString)) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Invalid product id in cart item: ${productIdString}`
        });
      }

      let productDoc = item.product && item.product._id ? item.product : await Product.findById(productIdString).lean();
      if (!productDoc) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: 'One of the products in your cart is no longer available.'
        });
      }

      const inventory = await PharmacyInventory.findOne({
        pharmacy: cart.pharmacy._id,
        product: productDoc._id,
        isAvailable: true
      }).session(session);

      if (!inventory) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({
          success: false,
          message: `Inventory not found for product ${productDoc.productName || productDoc._id}`
        });
      }

      try {
        await inventory.deductStock(item.quantity, session);
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({
          success: false,
          message: `Insufficient stock available for ${productDoc.productName || 'selected product'}`
        });
      }

      resolvedItems.push({ item, product: productDoc });
    }

    // Create order items with product snapshots
    const orderItems = resolvedItems.map(({ item, product }) => ({
      product: product?._id,
      productSnapshot: {
        productName: product?.productName ?? 'Unknown Product',
        brandName: product?.brandName,
        genericName: product?.genericName,
        manufacturer: product?.manufacturer,
        strength: product?.strength,
        packaging: product?.packaging,
        dosageForm: product?.dosageForm,
        image: product?.images?.primary || ''
      },
      quantity: item.quantity,
      unitPrice: item.price,
      discountAmount: item.discountAmount,
      subtotal: item.subtotal,
      prescriptionRequired: item.prescriptionRequired
    }));

    // Normalize delivery address and delivery type from client payload
    const normalizedAddress = {
      addressLine1: deliveryAddress?.addressLine1 || deliveryAddress?.street || '',
      addressLine2: deliveryAddress?.addressLine2 || '',
      landmark: deliveryAddress?.landmark || '',
      city: deliveryAddress?.city || '',
      state: deliveryAddress?.state || '',
      postalCode: deliveryAddress?.postalCode || deliveryAddress?.pincode || '',
      country: deliveryAddress?.country || 'Pakistan',
      coordinates: deliveryAddress?.coordinates || undefined
    };

    const normalizedDeliveryType =
      deliveryType === 'Store Pickup' ? 'Store Pickup' : 'Home Delivery';

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const customerFullName =
      (cart.user && (cart.user.name || cart.user.fullName)) ||
      deliveryAddress?.fullName ||
      deliveryAddress?.customerName ||
      'Customer';

    const order = new Order({
      orderNumber,
      user: cart.user._id,
      pharmacy: cart.pharmacy._id,
      items: orderItems,
      customerInfo: {
        fullName: customerFullName,
        phoneNumber: cart.user?.phoneNumber || deliveryAddress?.phoneNumber || '',
        email: cart.user?.email || ''
      },
      deliveryAddress: normalizedAddress,
      deliveryType: normalizedDeliveryType,
      pricing: {
        itemsTotal: cart.itemsTotal,
        totalDiscount: cart.totalDiscount,
        deliveryCharges: cart.deliveryCharges,
        taxAmount: cart.taxAmount,
        couponDiscount: cart.appliedCoupon?.discountAmount || 0,
        totalAmount: cart.totalAmount
      },
      appliedCoupon: cart.appliedCoupon,
      payment: {
        method: paymentMethod,
        status: paymentMethod === 'Cash on Delivery' ? 'Pending' : 'Processing'
      },
      prescriptions: cart.prescriptions.map(p => ({
        url: p.url,
        uploadedAt: p.uploadedAt
      })),
      specialInstructions
    });

    await order.save({ session });

    cart.status = 'Converted to Order';
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('pharmacy', 'pharmacyName address phoneNumber');

    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    await session.abortTransaction();
    session.endSession();
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to create order'
    });
  }
};

// Get pharmacy orders
export const getPharmacyOrders = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { 
      status, 
      search,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { pharmacy: pharmacyId };

    // Status filter
    if (status) {
      query.orderStatus = status;
    }

    // Search filter (by order number or customer name)
    if (search) {
      query.$or = [
        { orderNumber: new RegExp(search, 'i') },
        { 'customerInfo.fullName': new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Order.countDocuments(query);

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .populate('user', 'name email phoneNumber')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total
      }
    });
  } catch (error) {
    console.error('Error getting pharmacy orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
};

// Get current user's orders
export const getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { user: req.userId };
    if (status) query.orderStatus = status;

    const total = await Order.countDocuments(query);
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const orders = await Order.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('-payment.transactionId -payment.paidAt -internalNotes');

    return res.json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total
      }
    });
  } catch (error) {
    console.error('Error getting user orders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get orders'
    });
  }
};

// Reorder: create/replace active cart from order items
export const reorderToCart = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId).session(session);

    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    if (order.user.toString() !== req.userId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ success: false, message: 'Not authorized to reorder this' });
    }

    // Get or create cart for same pharmacy (race-safe upsert)
    let cart = await Cart.findOneAndUpdate(
      { user: req.userId, pharmacy: order.pharmacy },
      { $setOnInsert: { user: req.userId, pharmacy: order.pharmacy } },
      { new: true, upsert: true, session }
    );
    // Ensure this cart is active and replace items
    cart.status = 'Active';
    cart.items = [];

    for (const it of order.items) {
      // ensure product exists and inventory is available
      const productId = it.product;
      const inventory = await PharmacyInventory.findOne({
        pharmacy: order.pharmacy,
        product: productId,
        isAvailable: true
      }).session(session);

      if (!inventory) {
        // skip unavailable items
        continue;
      }

      const available = Math.max(0, inventory.stockQuantity);
      const desiredQty = Math.min(available, it.quantity);
      if (desiredQty <= 0) continue;

      const price = inventory.pricing?.sellingPrice ?? inventory.pricing?.mrp ?? it.unitPrice ?? 0;

      cart.items.push({
        product: productId,
        inventoryItem: inventory._id,
        quantity: desiredQty,
        price,
        discountAmount: 0,
        subtotal: (price * desiredQty),
        prescriptionRequired: it.prescriptionRequired ?? false,
        prescriptionUploaded: false
      });
    }

    // Recalculate totals (reuse cart pre-save hook)
    await cart.save({ session });
    cart = await cart.populate([
      { path: 'pharmacy', select: 'pharmacyName address phoneNumber images' },
      { path: 'items.product', select: 'productName brandName images dosageForm packaging mrp requiresPrescription' },
      { path: 'items.inventoryItem', select: 'stockQuantity pricing finalPrice stockStatus' }
    ]);

    await session.commitTransaction();
    session.endSession();

    return res.json({
      success: true,
      message: 'Cart created from previous order',
      data: {
        id: cart._id?.toString(),
        pharmacyId: cart.pharmacy?._id?.toString() ?? order.pharmacy?.toString(),
        items: cart.items.map(ci => ({
          productId: ci.product?._id?.toString() ?? ci.product?.toString(),
          inventoryItemId: ci.inventoryItem?._id?.toString() ?? ci.inventoryItem?.toString(),
          quantity: ci.quantity,
          price: ci.price,
          subtotal: ci.subtotal,
          product: ci.product,
          availableQuantity: ci.inventoryItem?.stockQuantity ?? 0
        })),
        itemsTotal: cart.itemsTotal,
        totalDiscount: cart.totalDiscount,
        deliveryCharges: cart.deliveryCharges,
        taxAmount: cart.taxAmount,
        totalAmount: cart.totalAmount,
        itemCount: cart.totalItems
      }
    });
  } catch (error) {
    console.error('Error reordering:', error);
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({
      success: false,
      message: 'Failed to reorder'
    });
  }
};
// Get single order
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phoneNumber')
      .populate('pharmacy', 'pharmacyName address phoneNumber emailAddress');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order'
    });
  }
};

// Update order status
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.updateStatus(status, note, req.userId);

    const updatedOrder = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('pharmacy', 'pharmacyName');

    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update order status'
    });
  }
};

// Verify prescription
export const verifyPrescription = async (req, res) => {
  try {
    const { orderId, prescriptionId } = req.params;
    const { status, rejectionReason } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    const prescription = order.prescriptions.id(prescriptionId);
    
    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: 'Prescription not found'
      });
    }

    prescription.verificationStatus = status;
    prescription.verifiedBy = req.userId;
    prescription.verifiedAt = new Date();
    
    if (status === 'Rejected' && rejectionReason) {
      prescription.rejectionReason = rejectionReason;
    }

    await order.save();

    res.status(200).json({
      success: true,
      message: `Prescription ${status.toLowerCase()} successfully`,
      data: order
    });
  } catch (error) {
    console.error('Error verifying prescription:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to verify prescription'
    });
  }
};

// Add prescription to order
export const addPrescriptionToOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No prescription file uploaded'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'auto',
      folder: 'cardiolink/prescriptions'
    });

    // Delete local file
    try { fs.unlinkSync(req.file.path); } catch (_) {}

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.prescriptions.push({
      url: result.secure_url,
      uploadedAt: new Date()
    });

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Prescription uploaded successfully',
      data: order
    });
  } catch (error) {
    console.error('Error adding prescription:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to upload prescription'
    });
  }
};

// Assign delivery
export const assignDelivery = async (req, res) => {
  try {
    const { assignedTo, estimatedDeliveryTime, deliveryInstructions } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    order.delivery = {
      ...order.delivery,
      assignedTo,
      estimatedDeliveryTime,
      deliveryInstructions
    };

    await order.save();

    res.status(200).json({
      success: true,
      message: 'Delivery assigned successfully',
      data: order
    });
  } catch (error) {
    console.error('Error assigning delivery:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to assign delivery'
    });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const { reason, refundAmount } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.cancelOrder('Pharmacy', reason, refundAmount);

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to cancel order'
    });
  }
};

// Add internal note
export const addInternalNote = async (req, res) => {
  try {
    const { note } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    await order.addInternalNote(note, req.userId);

    res.status(200).json({
      success: true,
      message: 'Note added successfully',
      data: order
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add note'
    });
  }
};

// Get pending orders
export const getPendingOrders = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const orders = await Order.getPendingOrders(pharmacyId);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error getting pending orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pending orders'
    });
  }
};

// Get orders requiring prescription verification
export const getOrdersRequiringPrescriptionVerification = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const orders = await Order.getOrdersRequiringPrescriptionVerification(pharmacyId);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('Error getting orders requiring prescription verification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders'
    });
  }
};

// Get order statistics
export const getOrderStats = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const stats = await Order.aggregate([
      {
        $match: {
          pharmacy: pharmacyId,
          createdAt: { $gte: start, $lte: end }
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

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting order statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order statistics'
    });
  }
};

