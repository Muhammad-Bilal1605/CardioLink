import mongoose from 'mongoose';
import AutomaticPrescriptionOrder from '../models/AutomaticPrescriptionOrder.js';
import AutomaticPrescription from '../models/AutomaticPrescription.js';
import Patient from '../models/User.js';
import Visit from '../models/Visit.js';
import Pharmacy from '../models/Pharmacy.js';

// Create automatic prescription order from visit (called from visitController)
export const createAutomaticOrderFromVisit = async (visitId, patientId, doctorId, medications) => {
  try {
    // Check if patient has automatic prescription enabled
    const autoPrescription = await AutomaticPrescription.findOne({ patientId });
    
    if (!autoPrescription || !autoPrescription.facilityAvailed) {
      return {
        success: false,
        message: 'Patient has not availed automatic prescription service'
      };
    }

    // Get patient details
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return {
        success: false,
        message: 'Patient not found'
      };
    }

    // Get pharmacy details
    const pharmacy = await Pharmacy.findById(autoPrescription.preferredPharmacy);
    if (!pharmacy || pharmacy.status !== 'Approved' || !pharmacy.isActive) {
      return {
        success: false,
        message: 'Preferred pharmacy not available'
      };
    }

    // Get visit details
    const visit = await Visit.findById(visitId);
    if (!visit) {
      return {
        success: false,
        message: 'Visit not found'
      };
    }

    // Calculate medication quantities based on preferred dosage (months)
    const durationMonths = autoPrescription.preferredDosage || 1;
    const medicationsWithDuration = medications.map(med => ({
      ...med,
      durationMonths: durationMonths
    }));

    // Get patient address or use pharmacy address as fallback
    const patientStreet = patient.address?.street || '';
    const pharmacyStreet = pharmacy.address?.street || '';
    const patientCity = patient.address?.city || '';
    const pharmacyCity = pharmacy.address?.city || '';
    const patientState = patient.address?.state || '';
    const pharmacyState = pharmacy.address?.state || '';
    const patientZip = patient.address?.zipCode || '';
    const pharmacyZip = pharmacy.address?.postalCode || '';

    const deliveryAddress = {
      addressLine1: patientStreet || pharmacyStreet || 'Address not provided',
      addressLine2: patient.address?.area || pharmacy.address?.area || '',
      city: patientCity || pharmacyCity || 'Unknown',
      state: patientState || pharmacyState || 'Unknown',
      postalCode: patientZip || pharmacyZip || '00000',
      country: patient.address?.country || pharmacy.address?.country || 'Pakistan'
    };

    // Generate order number manually
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderNumber = `AUTO-${dateStr}-${randomNum}`;

    // Create automatic prescription order
    const order = new AutomaticPrescriptionOrder({
      orderNumber, // Set orderNumber explicitly
      patientId,
      pharmacy: autoPrescription.preferredPharmacy,
      visitId,
      doctorId,
      medications: medicationsWithDuration,
      patientInfo: {
        fullName: `${patient.firstName} ${patient.lastName}`,
        phoneNumber: patient.phoneNumber || 'N/A',
        email: patient.email || ''
      },
      deliveryAddress,
      deliveryType: 'Home Delivery', // Default to home delivery
      orderStatus: 'Pending',
      statusHistory: [{
        status: 'Pending',
        timestamp: new Date(),
        note: 'Automatic prescription order created'
      }]
    });

    await order.save();

    // Populate and return
    await order.populate('pharmacy', 'pharmacyName address phoneNumber');
    await order.populate('patientId', 'firstName lastName');

    return {
      success: true,
      message: 'Automatic prescription order created successfully',
      data: order
    };
  } catch (error) {
    console.error('Error creating automatic prescription order:', error);
    console.error('Error details:', {
      message: error.message,
      errors: error.errors,
      stack: error.stack
    });
    return {
      success: false,
      message: 'Failed to create automatic prescription order',
      error: error.message,
      validationErrors: error.errors ? Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      })) : null
    };
  }
};

// Get all automatic prescription orders for a pharmacy
export const getPharmacyAutomaticOrders = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { status, page = 1, limit = 20 } = req.query;

    console.log('Fetching automatic orders for pharmacy:', pharmacyId, 'Status:', status);

    const query = { pharmacy: pharmacyId };
    // Only add status filter if it's not empty and not 'All'
    if (status && status.trim() !== '' && status !== 'All') {
      query.orderStatus = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const orders = await AutomaticPrescriptionOrder.find(query)
      .populate('patientId', 'firstName lastName email phoneNumber address')
      .populate('visitId', 'date provider reason diagnosis')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AutomaticPrescriptionOrder.countDocuments(query);

    console.log(`Found ${orders.length} automatic orders out of ${total} total`);

    res.status(200).json({
      success: true,
      data: orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total
      }
    });
  } catch (error) {
    console.error('Error getting pharmacy automatic orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automatic prescription orders',
      error: error.message
    });
  }
};

// Get single automatic prescription order
export const getAutomaticOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await AutomaticPrescriptionOrder.findById(orderId)
      .populate('patientId', 'firstName lastName email phoneNumber address')
      .populate('pharmacy', 'pharmacyName address phoneNumber')
      .populate('visitId', 'date provider reason diagnosis treatment')
      .populate('doctorId', 'name email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Automatic prescription order not found'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Error getting automatic order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automatic prescription order',
      error: error.message
    });
  }
};

// Update order status (Accept, Process, Out for Delivery, Delivered)
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, note, pricing, medications } = req.body;
    const updatedBy = req.userId; // From verifyToken middleware

    const validStatuses = ['Accepted', 'Processing', 'Out for Delivery', 'Delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const order = await AutomaticPrescriptionOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Automatic prescription order not found'
      });
    }

    // Check if order can be updated to this status
    if (order.orderStatus === 'Rejected' || order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update status of rejected or cancelled order'
      });
    }

    // If accepting order, require pricing information
    if (status === 'Accepted' && order.orderStatus === 'Pending') {
      if (!pricing || !pricing.totalAmount || pricing.totalAmount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Pricing information is required when accepting an order'
        });
      }

      // Update pricing
      order.pricing = {
        itemsTotal: pricing.itemsTotal || 0,
        deliveryCharges: pricing.deliveryCharges || 0,
        taxAmount: pricing.taxAmount || 0,
        discountAmount: pricing.discountAmount || 0,
        totalAmount: pricing.totalAmount
      };

      // Update medication prices if provided
      if (medications && Array.isArray(medications)) {
        medications.forEach((medPrice, index) => {
          if (order.medications[index]) {
            order.medications[index].unitPrice = medPrice.unitPrice || 0;
            order.medications[index].quantity = medPrice.quantity || 1;
            order.medications[index].subtotal = medPrice.subtotal || 0;
          }
        });
      }
    }

    await order.updateStatus(status, note, updatedBy);

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error.message
    });
  }
};

// Reject automatic prescription order
export const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const rejectedBy = req.userId; // From verifyToken middleware

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const order = await AutomaticPrescriptionOrder.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Automatic prescription order not found'
      });
    }

    if (order.orderStatus === 'Rejected' || order.orderStatus === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already rejected or cancelled'
      });
    }

    await order.rejectOrder(reason, rejectedBy);

    res.status(200).json({
      success: true,
      message: 'Order rejected successfully',
      data: order
    });
  } catch (error) {
    console.error('Error rejecting order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject order',
      error: error.message
    });
  }
};

// Get patient's automatic prescription orders
export const getPatientAutomaticOrders = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { status } = req.query;

    const query = { patientId };
    if (status) {
      query.orderStatus = status;
    }

    const orders = await AutomaticPrescriptionOrder.find(query)
      .populate('pharmacy', 'pharmacyName address phoneNumber')
      .populate('visitId', 'date provider reason')
      .populate('doctorId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Error getting patient automatic orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve automatic prescription orders',
      error: error.message
    });
  }
};

// Mark order as read by patient
export const markOrderAsRead = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await AutomaticPrescriptionOrder.findByIdAndUpdate(
      orderId,
      { isReadByPatient: true },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Automatic prescription order not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Order marked as read',
      data: order
    });
  } catch (error) {
    console.error('Error marking order as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark order as read',
      error: error.message
    });
  }
};

// Get order statistics for pharmacy
export const getPharmacyOrderStats = async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    const stats = await AutomaticPrescriptionOrder.aggregate([
      {
        $match: { pharmacy: mongoose.Types.ObjectId(pharmacyId) }
      },
      {
        $group: {
          _id: '$orderStatus',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      Pending: 0,
      Accepted: 0,
      Processing: 0,
      'Out for Delivery': 0,
      Delivered: 0,
      Rejected: 0,
      Cancelled: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const total = await AutomaticPrescriptionOrder.countDocuments({ pharmacy: pharmacyId });

    res.status(200).json({
      success: true,
      data: {
        statusCounts,
        total
      }
    });
  } catch (error) {
    console.error('Error getting pharmacy order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve order statistics',
      error: error.message
    });
  }
};

