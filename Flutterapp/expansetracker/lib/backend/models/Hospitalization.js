import mongoose from 'mongoose';

const hospitalizationSchema = new mongoose.Schema({
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
  hospital: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  admissionType: {
    type: String,
    enum: ['Emergency', 'Elective', 'Urgent'],
    required: true
  },
  attendingPhysician: {
    type: String,
    required: true
  },
  proceduresDone: [{
    type: String,
    required: true
  }],
  durationOfStay: {
    type: String,
    required: true
  },
  outcome: {
    type: String,
    required: true
  },
  dischargeSummary: {
    type: String,
    required: true
  },
  // References to associated records
  associatedLabResults: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabResult'
  }],
  associatedImaging: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Imaging'
  }],
  associatedProcedures: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Procedure'
  }],
  status: {
    type: String,
    enum: ['Active', 'Discharged', 'Transferred'],
    default: 'Active'
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

export default mongoose.model('Hospitalization', hospitalizationSchema); 