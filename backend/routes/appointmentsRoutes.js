import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Get appointments for a specific doctor
router.get('/doctor/:doctorId', async (req, res) => {
  try {
    const { doctorId } = req.params;

    console.log('🔍 Searching for appointments with doctorId:', doctorId);

    // Access the database connection
    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');

    // Try multiple query formats to find appointments
    let appointments = [];
    
    // Query 1: Try as string (most common case)
    console.log('  Trying string format query...');
    appointments = await appointmentsCollection.find({
      doctorId: doctorId
    }).sort({ appointmentDate: -1 }).toArray();
    
    if (appointments.length > 0) {
      console.log('✅ Found', appointments.length, 'appointments with String query');
    } else {
      console.log('  String query returned 0 results');
    }
    
    // Query 2: If no results, try as ObjectId if it's a valid format
    if (appointments.length === 0 && mongoose.Types.ObjectId.isValid(doctorId)) {
      console.log('  Trying ObjectId format query...');
      appointments = await appointmentsCollection.find({
        doctorId: new mongoose.Types.ObjectId(doctorId)
      }).sort({ appointmentDate: -1 }).toArray();
      
      if (appointments.length > 0) {
        console.log('✅ Found', appointments.length, 'appointments with ObjectId query');
      } else {
        console.log('  ObjectId query returned 0 results');
      }
    }
    
    // Debug: Log what's actually in the collection
    if (appointments.length === 0) {
      console.log('⚠️ No appointments found for doctorId:', doctorId);
      console.log('📊 Checking all doctorIds in collection...');
      const allAppointments = await appointmentsCollection.find({}).limit(10).toArray();
      console.log('Sample appointments in DB:', allAppointments.map(a => ({
        _id: a._id?.toString(),
        doctorId: a.doctorId,
        doctorIdType: typeof a.doctorId,
        doctorIdIsObjectId: a.doctorId instanceof mongoose.Types.ObjectId,
        patientName: a.patientName,
        status: a.status
      })));
    }

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No appointments found for this doctor'
      });
    }

    // Transform the data to match frontend requirements
    const transformedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId?.toString() || '',
      doctorId: apt.doctorId?.toString() || '',
      doctorName: apt.doctorName || 'Unknown',
      doctorSpecialty: apt.doctorSpecialty || '',
      doctorImage: apt.doctorImage || '',
      patientName: apt.patientName || 'Unknown Patient',
      appointmentDate: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString() : null,
      appointmentTime: apt.appointmentTime || '',
      formattedDate: apt.formattedDate || '',
      reason: apt.reason || 'Consultation',
      status: apt.status || 'Upcoming',
      paymentMethod: apt.paymentMethod || '',
      consultationFee: apt.consultationFee || 0,
      bookingFee: apt.bookingFee || 0,
      location: apt.location || '',
      roomNumber: apt.roomNumber || '',
      joiningCode: apt.joiningCode || '',
      createdAt: apt.createdAt || new Date().toISOString(),
      updatedAt: apt.updatedAt || new Date().toISOString()
    }));

    res.status(200).json({
      success: true,
      data: transformedAppointments,
      count: transformedAppointments.length
    });

  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Get all appointments (admin view)
router.get('/', async (req, res) => {
  try {
    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');

    const appointments = await appointmentsCollection
      .find({})
      .sort({ appointmentDate: -1 })
      .toArray();

    const transformedAppointments = appointments.map(apt => ({
      id: apt._id.toString(),
      patientId: apt.patientId?.toString() || '',
      doctorId: apt.doctorId?.toString() || '',
      doctorName: apt.doctorName || 'Unknown',
      doctorSpecialty: apt.doctorSpecialty || '',
      patientName: apt.patientName || 'Unknown Patient',
      appointmentDate: apt.appointmentDate ? new Date(apt.appointmentDate).toISOString() : null,
      appointmentTime: apt.appointmentTime || '',
      formattedDate: apt.formattedDate || '',
      reason: apt.reason || 'Consultation',
      status: apt.status || 'Upcoming',
      location: apt.location || '',
      roomNumber: apt.roomNumber || '',
      joiningCode: apt.joiningCode || ''
    }));

    res.status(200).json({
      success: true,
      data: transformedAppointments,
      count: transformedAppointments.length
    });

  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch appointments',
      error: error.message
    });
  }
});

// Update appointment status
router.put('/:appointmentId', async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { status, videoCode } = req.body;

    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid appointment ID format'
      });
    }

    const db = mongoose.connection.db;
    const appointmentsCollection = db.collection('appointments');

    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (videoCode) {
      updateData.videoCode = videoCode;
    }

    const result = await appointmentsCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(appointmentId) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { _id: appointmentId, ...updateData },
      message: 'Appointment updated successfully'
    });

  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update appointment',
      error: error.message
    });
  }
});

export default router;