import mongoose from 'mongoose';

const vitalSignSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  temperature: {
    value: Number,
    unit: {
      type: String,
      enum: ['C', 'F'],
      default: 'C'
    }
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number,
    unit: {
      type: String,
      enum: ['mmHg'],
      default: 'mmHg'
    }
  },
  heartRate: {
    value: Number,
    unit: {
      type: String,
      enum: ['bpm'],
      default: 'bpm'
    }
  },
  respiratoryRate: {
    value: Number,
    unit: {
      type: String,
      enum: ['breaths/min'],
      default: 'breaths/min'
    }
  },
  oxygenSaturation: {
    value: Number,
    unit: {
      type: String,
      enum: ['%'],
      default: '%'
    }
  },
  weight: {
    value: Number,
    unit: {
      type: String,
      enum: ['kg', 'lbs'],
      default: 'kg'
    }
  },
  height: {
    value: Number,
    unit: {
      type: String,
      enum: ['cm', 'ft'],
      default: 'cm'
    }
  },
  bmi: Number,
  notes: String,
  recordedBy: {
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

const VitalSign = mongoose.model('VitalSign', vitalSignSchema);

export default VitalSign; 