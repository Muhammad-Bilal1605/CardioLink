import mongoose from 'mongoose';

const procedureSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  hospitalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hospital',
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  procedureName: {
    type: String,
    required: true
  },
  hospital: {
    type: String,
    required: true
  },
  physician: {
    type: String,
    required: true
  },
  indication: {
    type: String,
    required: true
  },
  findings: {
    type: String,
    required: true
  },
  complications: String,
  followUpPlan: String,
  // Simplified documents and images as arrays of strings
  documents: [String],
  images: [String],
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  notes: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Procedure = mongoose.model('Procedure', procedureSchema);

export default Procedure; 