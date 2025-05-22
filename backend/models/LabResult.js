import mongoose from 'mongoose';

const labResultSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  testType: {
    type: String,
    required: true,
    enum: ['Blood Test', 'Urine Test', 'Stool Test', 'Culture', 'Biopsy', 'Other']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  facility: {
    type: String,
    required: true
  },
  doctor: {
    type: String,
    required: true
  },
  results: [{
    parameter: {
      type: String,
      required: true
    },
    value: {
      type: String,
      required: true
    },
    unit: String,
    referenceRange: String,
    status: {
      type: String,
      enum: ['Normal', 'High', 'Low', 'Critical'],
      default: 'Normal'
    }
  }],
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  notes: String,
  reportUrl: {
    type: String,
    required: true
  },
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

const LabResult = mongoose.model('LabResult', labResultSchema);

export default LabResult; 