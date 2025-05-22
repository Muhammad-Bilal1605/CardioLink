import mongoose from 'mongoose';

const imagingSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['X-Ray', 'MRI', 'CT Scan', 'Ultrasound', 'Mammogram', 'Other']
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
  description: {
    type: String,
    required: true
  },
  findings: {
    type: String,
    required: true
  },
  imageUrl: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Completed', 'Cancelled'],
    default: 'Pending'
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

const Imaging = mongoose.model('Imaging', imagingSchema);

export default Imaging; 