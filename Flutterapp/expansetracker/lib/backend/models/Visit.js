import mongoose from 'mongoose';

const VisitSchema = new mongoose.Schema({
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
  type: {
    type: String,
    enum: ['routine', 'followup', 'emergency', 'specialist'],
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  diagnosis: {
    type: String
  },
  treatment: {
    type: String
  },
  followUpDate: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'no-show'],
    default: 'scheduled'
  },
  documents: [{
    type: String
  }],
  images: [{
    type: String
  }],
  associatedLabResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabResult'
  }],
  associatedImaging: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Imaging'
  }],
  prescribedMedicines: [{
    name: {
      type: String,
      required: true
    },
    dosage: {
      type: String,
      required: true
    },
    frequency: {
      type: String,
      required: true
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: Date,
    prescribedBy: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Active', 'Completed', 'Discontinued'],
      default: 'Active'
    },
    sideEffects: [String],
    notes: String
  }]
}, {
  timestamps: true
});

export default mongoose.model('Visit', VisitSchema);