import mongoose from 'mongoose';

const medicineSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dosage: {
    type: String,
    required: true
  },
  frequency: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    required: true
  },
  instructions: {
    type: String,
    default: ''
  }
});

const testSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

const prescriptionSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  diagnosis: {
    type: String,
    required: true,
    trim: true
  },
  symptoms: {
    type: String,
    default: ''
  },
  medicines: [medicineSchema],
  tests: [testSchema],
  advice: {
    type: String,
    default: ''
  },
  followUpDate: {
    type: Date
  },
  doctorNotes: {
    type: String,
    default: ''
  },
  doctorId: {
    type: String,
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  pdfUrl: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Create index for better query performance
prescriptionSchema.index({ patientId: 1, createdAt: -1 });
prescriptionSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model('Prescription', prescriptionSchema);