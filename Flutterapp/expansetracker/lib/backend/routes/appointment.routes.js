//Backend/routes/appointment.routes.js - COMPLETE FIX
import express from 'express';
import { Appointment } from '../models/appointment.model.js';
import { Patient } from '../models/patient.model.js';
import { User } from '../models/user.model.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// ============================================
// CREATE APPOINTMENT - PROTECTED
// ============================================
router.post('/', protect, async (req, res) => {
  try {
    console.log('========== APPOINTMENT CREATION ==========');
    console.log('📱 Creating appointment...');
    console.log('👤 req.userId:', req.userId);
    console.log('👤 req.userId type:', typeof req.userId);
    console.log('📊 Body:', JSON.stringify(req.body, null, 2));

    const {
      doctorId,
      doctorName,
      doctorSpecialty,
      doctorImage,
      appointmentDate,
      appointmentTime,
      formattedDate,
      reason,
      paymentMethod,
      consultationFee,
      location,
      roomNumber,
    } = req.body;

    // ============ VALIDATION ============
    if (!doctorId || !doctorName || !appointmentDate || !appointmentTime) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, doctorName, appointmentDate, appointmentTime',
      });
    }

    // ============ GET USER ID ============
    const patientId = req.userId?.toString() || req.user?._id?.toString();

    console.log('👤 Extracted patientId:', patientId);
    console.log('✅ PatientId is valid:', !!patientId);

    if (!patientId || patientId === 'undefined' || patientId === 'null') {
      console.error('❌ No patient ID found');
      return res.status(401).json({
        success: false,
        message: 'Patient ID not found. Authentication failed.',
        debug: {
          req_userId: req.userId,
          req_user_id: req.user?._id,
          auth_header: req.headers.authorization ? 'present' : 'missing'
        }
      });
    }

    // ============ FETCH PATIENT DATA FROM DATABASE ============
    console.log('🔍 Fetching patient data...');
    let patient = await Patient.findById(patientId).select('name');

    if (!patient) {
      console.log('⚠️  Patient not found in Patient model, checking User model');
      patient = await User.findById(patientId).select('name');
    }

    if (!patient) {
      console.error('❌ Patient not found in database:', patientId);
      return res.status(404).json({
        success: false,
        message: 'Patient not found in system',
        debug: { searchedId: patientId }
      });
    }

    const patientName = patient.name || 'Patient';
    console.log('✅ Patient found:', patientName);

    // ============ GENERATE JOINING CODE ============
    const joiningCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Generated joining code:', joiningCode);

    // ============ PREPARE APPOINTMENT DATA ============
    const appointmentData = {
      patientId: patientId,
      patientName: patientName, // Now we have the actual patient name from database
      doctorId: doctorId.toString(),
      doctorName,
      doctorSpecialty,
      doctorImage: doctorImage || '',
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      formattedDate,
      reason: reason || 'General Consultation',
      paymentMethod: paymentMethod || 'Credit/Debit Card',
      consultationFee: parseInt(consultationFee) || 500,
      bookingFee: 5,
      location: location || 'Hospital',
      roomNumber: roomNumber || '101',
      joiningCode,
      status: 'Upcoming',
    };

    console.log('📝 Appointment data prepared:');
    console.log('   patientId:', appointmentData.patientId);
    console.log('   patientName:', appointmentData.patientName);
    console.log('   doctorId:', appointmentData.doctorId);
    console.log('   joiningCode:', appointmentData.joiningCode);

    // ============ CREATE & SAVE APPOINTMENT ============
    console.log('💾 Creating appointment document...');
    const appointment = new Appointment(appointmentData);

    // Validate before saving
    const validationError = appointment.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Appointment validation failed',
        error: validationError.message
      });
    }

    console.log('💾 Saving to MongoDB...');
    await appointment.save();
    console.log('✅ Appointment saved:', appointment._id);

    // ============ VERIFY SAVE ============
    const saved = await Appointment.findById(appointment._id);
    if (!saved) {
      console.error('❌ Appointment save verification failed!');
      return res.status(500).json({
        success: false,
        message: 'Appointment save verification failed'
      });
    }

    console.log('✅ Verified in database');
    console.log('========== APPOINTMENT CREATION SUCCESS ==========\n');

    // ============ SUCCESS RESPONSE ============
    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        doctorSpecialty: appointment.doctorSpecialty,
        doctorImage: appointment.doctorImage,
        date: appointment.formattedDate,
        time: appointment.appointmentTime,
        location: appointment.location,
        status: appointment.status,
        joiningCode: appointment.joiningCode,
        consultationFee: appointment.consultationFee,
        bookingFee: appointment.bookingFee,
        totalFee: appointment.consultationFee + appointment.bookingFee,
        createdAt: appointment.createdAt
      }
    });

  } catch (error) {
    console.error('========== APPOINTMENT CREATION ERROR ==========');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error name:', error.name);
    console.error('❌ Full error:', error);

    // Handle duplicate joining code
    if (error.code === 11000) {
      console.error('❌ Duplicate key - joining code already exists');
      return res.status(400).json({
        success: false,
        message: 'This appointment slot is already booked',
        error: 'Duplicate joining code'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      return res.status(400).json({
        success: false,
        message: 'Appointment validation failed',
        errors
      });
    }

    // Handle cast errors
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: error.message
      });
    }

    // Generic error
    return res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? {
        name: error.name,
        code: error.code
      } : undefined
    });
  }
});

// ============================================
// GET PATIENT APPOINTMENTS - PROTECTED
// ============================================
router.get('/patient', protect, async (req, res) => {
  try {
    const patientId = req.userId?.toString() || req.user?._id?.toString();
    const { status } = req.query;

    console.log('📋 Fetching appointments for patient:', patientId);

    if (!patientId || patientId === 'undefined') {
      return res.status(401).json({
        success: false,
        message: 'Patient ID not found'
      });
    }

    let query = { patientId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: -1, appointmentTime: 1 })
      .lean();

    console.log(`📋 Found ${appointments.length} appointments`);

    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId,
      patientName: apt.patientName,
      doctorId: apt.doctorId,
      doctorName: apt.doctorName,
      doctorSpecialty: apt.doctorSpecialty,
      doctorImage: apt.doctorImage,
      date: apt.formattedDate,
      time: apt.appointmentTime,
      location: apt.location,
      status: apt.status,
      joiningCode: apt.joiningCode,
      consultationFee: apt.consultationFee,
      totalFee: apt.consultationFee + (apt.bookingFee || 5),
      createdAt: apt.createdAt
    }));

    return res.status(200).json({
      success: true,
      message: 'Appointments retrieved successfully',
      appointments: formattedAppointments
    });

  } catch (error) {
    console.error('❌ Error fetching appointments:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching appointments',
      error: error.message
    });
  }
});

// ============================================
// GET SINGLE APPOINTMENT - PROTECTED
// ============================================
router.get('/:appointmentId', protect, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.userId?.toString() || req.user?._id?.toString();

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    const appointment = await Appointment.findById(appointmentId).lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this appointment'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Appointment retrieved successfully',
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        doctorSpecialty: appointment.doctorSpecialty,
        doctorImage: appointment.doctorImage,
        date: appointment.formattedDate,
        time: appointment.appointmentTime,
        location: appointment.location,
        status: appointment.status,
        joiningCode: appointment.joiningCode,
        consultationFee: appointment.consultationFee,
        totalFee: appointment.consultationFee + (appointment.bookingFee || 5),
        createdAt: appointment.createdAt
      }
    });

  } catch (error) {
    console.error('❌ Error fetching appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching appointment',
      error: error.message
    });
  }
});

// ============================================
// CANCEL APPOINTMENT - PROTECTED
// ============================================
router.patch('/:appointmentId/cancel', protect, async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.userId?.toString() || req.user?._id?.toString();

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message: 'Appointment ID is required'
      });
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    // Check authorization
    if (appointment.patientId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this appointment'
      });
    }

    // Validate cancellation
    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Appointment is already cancelled'
      });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel completed appointment'
      });
    }

    // Update appointment
    appointment.status = 'Cancelled';
    appointment.cancellationReason = cancellationReason || 'No reason provided';
    appointment.cancelledAt = new Date();
    await appointment.save();

    console.log('✅ Appointment cancelled:', appointmentId);

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: {
        id: appointment._id.toString(),
        status: appointment.status,
        cancellationReason: appointment.cancellationReason,
        cancelledAt: appointment.cancelledAt
      }
    });

  } catch (error) {
    console.error('❌ Error cancelling appointment:', error);
    return res.status(500).json({
      success: false,
      message: 'Error cancelling appointment',
      error: error.message
    });
  }
});

// ============================================
// VERIFY JOINING CODE - PUBLIC (NO AUTH)
// ============================================
router.post('/verify-code', async (req, res) => {
  try {
    const { joiningCode } = req.body;

    if (!joiningCode) {
      return res.status(400).json({
        success: false,
        message: 'Joining code is required'
      });
    }

    const appointment = await Appointment.findOne({ 
      joiningCode: joiningCode.toString() 
    }).lean();

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Invalid joining code'
      });
    }

    console.log('✅ Joining code verified:', joiningCode);

    return res.status(200).json({
      success: true,
      message: 'Joining code verified',
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
        patientName: appointment.patientName,
        doctorId: appointment.doctorId,
        doctorName: appointment.doctorName,
        doctorSpecialty: appointment.doctorSpecialty,
        date: appointment.formattedDate,
        time: appointment.appointmentTime,
        location: appointment.location,
        status: appointment.status
      }
    });

  } catch (error) {
    console.error('❌ Error verifying joining code:', error);
    return res.status(500).json({
      success: false,
      message: 'Error verifying joining code',
      error: error.message
    });
  }
});

export default router;