import Order from '../models/Order.js';
import PharmacyInventory from '../models/PharmacyInventory.js';
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
  try {
    const { cartId, deliveryAddress, deliveryType, paymentMethod, specialInstructions } = req.body;

    // Get cart
    const cart = await Cart.findById(cartId)
      .populate('user')
      .populate('pharmacy')
      .populate('items.product');

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check if cart can be converted to order
    const canConvert = cart.canConvertToOrder();
    if (!canConvert.valid) {
      return res.status(400).json({
        success: false,
        message: canConvert.reason
      });
    }

    // Create order items with product snapshots
    const orderItems = cart.items.map(item => ({
      product: item.product._id,
      productSnapshot: {
        productName: item.product.productName,
        brandName: item.product.brandName,
        genericName: item.product.genericName,
        manufacturer: item.product.manufacturer,
        strength: item.product.strength,
        packaging: item.product.packaging,
        dosageForm: item.product.dosageForm,
        image: item.product.images?.primary || ''
      },
      quantity: item.quantity,
      unitPrice: item.price,
      discountAmount: item.discountAmount,
      subtotal: item.subtotal,
      prescriptionRequired: item.prescriptionRequired
    }));

    // Create order
    const order = new Order({
      user: cart.user._id,
      pharmacy: cart.pharmacy._id,
      items: orderItems,
      customerInfo: {
        fullName: cart.user.name,
        phoneNumber: cart.user.phoneNumber || deliveryAddress.phoneNumber,
        email: cart.user.email
      },
      deliveryAddress,
      deliveryType,
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

    await order.save();

    // Deduct stock from inventory for each item
    for (const item of cart.items) {
      try {
        const inventory = await PharmacyInventory.findOne({
          pharmacy: cart.pharmacy._id,
          product: item.product._id
        });
        
        if (inventory) {
          await inventory.deductStock(item.quantity);
        }
      } catch (error) {
        console.error(`Error deducting stock for product ${item.product._id}:`, error);
      }
    }

    // Mark cart as converted
    cart.status = 'Converted to Order';
    await cart.save();

    const populatedOrder = await Order.findById(order._id)
      .populate('user', 'name email')
      .populate('pharmacy', 'pharmacyName address phoneNumber');

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: populatedOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
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

