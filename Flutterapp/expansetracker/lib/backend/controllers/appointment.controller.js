//========================================
// 3. UPDATED: Backend/controllers/appointment.controller.js
//========================================
import { Appointment } from "../models/appointment.model.js";

// Create new appointment - SIMPLIFIED, ID-ONLY
export const createAppointment = async (req, res) => {
  try {
    console.log('========== APPOINTMENT CREATION START ==========');
    console.log('📱 Appointment creation request received');
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
      roomNumber
    } = req.body;

    // Validate required fields
    if (!doctorId || !doctorName || !appointmentDate || !appointmentTime) {
      console.error('❌ Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: doctorId, doctorName, appointmentDate, appointmentTime'
      });
    }

    // Get patient ID from authenticated user
    const patientId = req.userId || req.user?._id;

    console.log('👤 Extracted patientId:', patientId);

    if (!patientId) {
      console.error('❌ No patient ID found in request');
      return res.status(401).json({
        success: false,
        message: 'Patient ID not found. Authentication failed.'
      });
    }

    // Ensure patientId is a string
    const patientIdStr = patientId.toString();

    // Generate unique joining code (6 digits)
    const joiningCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔑 Generated joining code:', joiningCode);

    // Create appointment data - NO patientName field
    const appointmentData = {
      patientId: patientIdStr,
      doctorId: doctorId.toString(),
      doctorName: doctorName || 'Unknown Doctor',
      doctorSpecialty: doctorSpecialty || 'General',
      doctorImage: doctorImage || '',
      appointmentDate: new Date(appointmentDate),
      appointmentTime: appointmentTime,
      formattedDate: formattedDate,
      reason: reason || 'General Consultation',
      paymentMethod: paymentMethod || 'Credit/Debit Card',
      consultationFee: parseInt(consultationFee) || 500,
      bookingFee: 5,
      location: location || 'Hospital',
      roomNumber: roomNumber || '101',
      joiningCode: joiningCode,
      status: 'Upcoming'
    };

    console.log('📝 Appointment data prepared:');
    console.log('   patientId:', appointmentData.patientId);
    console.log('   doctorId:', appointmentData.doctorId);
    console.log('   joiningCode:', appointmentData.joiningCode);

    // Create and save appointment
    console.log('💾 Creating appointment document...');
    const appointment = new Appointment(appointmentData);
    
    // Validate appointment
    const validationError = appointment.validateSync();
    if (validationError) {
      console.error('❌ Validation error:', validationError);
      return res.status(400).json({
        success: false,
        message: 'Appointment validation failed',
        error: validationError.message
      });
    }

    console.log('💾 Saving appointment to database...');
    await appointment.save();
    console.log('✅ Appointment saved successfully:', appointment._id);

    // Verify it was saved
    const saved = await Appointment.findById(appointment._id);
    if (!saved) {
      console.error('❌ Appointment was not actually saved!');
      return res.status(500).json({
        success: false,
        message: 'Appointment save verification failed'
      });
    }

    console.log('✅ Appointment verified in database');
    console.log('========== APPOINTMENT CREATION SUCCESS ==========');

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      appointment: {
        id: appointment._id.toString(),
        patientId: appointment.patientId,
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

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.error('❌ Duplicate key error');
      return res.status(400).json({
        success: false,
        message: 'This appointment slot is already booked',
        error: 'Duplicate joining code'
      });
    }

    if (error.name === 'ValidationError') {
      console.error('❌ MongoDB validation error:', error.errors);
      return res.status(400).json({
        success: false,
        message: 'Appointment validation failed',
        error: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }

    if (error.name === 'CastError') {
      console.error('❌ Invalid ID format:', error.path);
      return res.status(400).json({
        success: false,
        message: 'Invalid ID format',
        error: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: 'Error creating appointment',
      error: error.message
    });
  }
};

// Get patient's appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.userId || req.user?._id;

    if (!patientId) {
      return res.status(401).json({
        success: false,
        message: 'Patient ID not found'
      });
    }

    const patientIdStr = patientId.toString();
    const { status } = req.query;

    let query = { patientId: patientIdStr };
    if (status) {
      query.status = status;
    }

    console.log('📋 Fetching appointments with query:', query);

    const appointments = await Appointment.find(query)
      .sort({ appointmentDate: -1, appointmentTime: 1 })
      .lean();

    console.log('📋 Fetched ' + appointments.length + ' appointments for patient: ' + patientIdStr);

    const formattedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId,
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
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.userId || req.user?._id;

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
    if (appointment.patientId.toString() !== userId.toString()) {
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
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.userId || req.user?._id;

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
    if (appointment.patientId.toString() !== userId.toString()) {
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
};

// Verify joining code (public endpoint)
export const verifyJoiningCode = async (req, res) => {
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
    });

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
};