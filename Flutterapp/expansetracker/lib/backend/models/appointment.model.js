//========================================
// 2. UPDATED: Backend/models/appointment.model.js
//========================================
import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: [true, 'Patient ID is required'],
      index: true,
      trim: true
    },
    // REMOVED: patientName - No longer storing name, fetched on-demand
    doctorId: { 
      type: String, 
      required: true, 
      trim: true 
    },
    doctorName: { 
      type: String, 
      required: true, 
      trim: true 
    },
    doctorSpecialty: { 
      type: String, 
      required: true, 
      trim: true 
    },
    doctorImage: String,
    appointmentDate: { 
      type: Date, 
      required: true, 
      index: true 
    },
    appointmentTime: { 
      type: String, 
      required: true, 
      trim: true 
    },
    formattedDate: { 
      type: String, 
      required: true, 
      trim: true 
    },
    reason: { 
      type: String, 
      default: 'General Consultation', 
      trim: true 
    },
    paymentMethod: {
      type: String,
      enum: ['Credit/Debit Card', 'PayPal', 'Insurance', 'Cash'],
      default: 'Credit/Debit Card'
    },
    consultationFee: { 
      type: Number, 
      default: 0, 
      min: 0 
    },
    bookingFee: { 
      type: Number, 
      default: 5, 
      min: 0 
    },
    location: { 
      type: String, 
      required: true, 
      trim: true 
    },
    roomNumber: { 
      type: String, 
      default: '101', 
      trim: true 
    },
    joiningCode: {
      type: String,
      required: true,
      unique: true,
      sparse: true,
      index: true,
      trim: true
    },
    status: {
      type: String,
      enum: ['Upcoming', 'Completed', 'Cancelled'],
      default: 'Upcoming',
      index: true
    },
    cancellationReason: String,
    cancelledAt: Date
  },
  { timestamps: true, collection: 'appointments' }
);

export const Appointment = mongoose.models.Appointment || 
  mongoose.model('Appointment', appointmentSchema, 'appointments');
