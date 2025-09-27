import { Appointment } from "../models/appointment.model.js";
import { User } from "../models/user.model.js";

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    const {
      doctorId,
      appointmentDate,
      appointmentTime,
      reason,
      paymentMethod,
      appointmentType
    } = req.body;

    // Get patient ID from authenticated user
    const patientId = req.user.id;

    // Verify doctor exists
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({
        success: false,
        message: "Doctor not found"
      });
    }

    // Check if appointment slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['Upcoming', 'Rescheduled'] }
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This time slot is already booked"
      });
    }

    // Create appointment
    const appointment = new Appointment({
      patientId,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason: reason || 'General Consultation',
      paymentMethod: paymentMethod || 'Credit/Debit Card',
      appointmentType: appointmentType || 'Consultation',
      roomNumber: doctor.roomNumber || '101'
    });

    await appointment.save();

    // Populate patient and doctor details
    await appointment.populate([
      { path: 'patientId', select: 'name email' },
      { path: 'doctorId', select: 'name email specialty department' }
    ]);

    res.status(201).json({
      success: true,
      message: "Appointment created successfully",
      appointment: appointment
    });
  } catch (error) {
    console.error("Error creating appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error creating appointment",
      error: error.message
    });
  }
};

// Get patient's appointments
export const getPatientAppointments = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { status } = req.query;

    let query = { patientId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('doctorId', 'name email specialty department')
      .populate('patientId', 'name email')
      .sort({ appointmentDate: -1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      appointments: appointments
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message
    });
  }
};

// Get doctor's appointments
export const getDoctorAppointments = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { status } = req.query;

    let query = { doctorId };
    if (status) {
      query.status = status;
    }

    const appointments = await Appointment.find(query)
      .populate('patientId', 'name email phoneNumber')
      .populate('doctorId', 'name email specialty department')
      .sort({ appointmentDate: -1, appointmentTime: 1 });

    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      appointments: appointments
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointments",
      error: error.message
    });
  }
};

// Cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Check if user is authorized to cancel (patient or doctor)
    if (appointment.patientId.toString() !== userId && appointment.doctorId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to cancel this appointment"
      });
    }

    // Check if appointment can be cancelled
    if (appointment.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled"
      });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({
        success: false,
        message: "Cannot cancel completed appointment"
      });
    }

    // Update appointment
    appointment.status = 'Cancelled';
    appointment.cancellationReason = cancellationReason || 'No reason provided';
    appointment.cancelledAt = new Date();

    await appointment.save();

    // Populate details for response
    await appointment.populate([
      { path: 'patientId', select: 'name email' },
      { path: 'doctorId', select: 'name email specialty department' }
    ]);

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment: appointment
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error cancelling appointment",
      error: error.message
    });
  }
};

// Get appointments for chat (appointments with chat enabled)
export const getChatableAppointments = async (req, res) => {
  try {
    const userId = req.user.id;

    const appointments = await Appointment.find({
      $or: [
        { patientId: userId },
        { doctorId: userId }
      ],
      chatEnabled: true,
      status: { $in: ['Upcoming', 'Completed'] }
    })
    .populate('patientId', 'name email')
    .populate('doctorId', 'name email specialty department')
    .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      message: "Chatable appointments retrieved successfully",
      appointments: appointments
    });
  } catch (error) {
    console.error("Error fetching chatable appointments:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chatable appointments",
      error: error.message
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user.id;

    const appointment = await Appointment.findById(appointmentId)
      .populate('patientId', 'name email phoneNumber')
      .populate('doctorId', 'name email specialty department');

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found"
      });
    }

    // Check if user is authorized to view
    if (appointment.patientId._id.toString() !== userId && appointment.doctorId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this appointment"
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointment retrieved successfully",
      appointment: appointment
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching appointment",
      error: error.message
    });
  }
};
