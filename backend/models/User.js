import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  allergies: {
    medicinal: [{
      name: String,
      reaction: String,
      criticality: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      },
      notes: String
    }],
    environmental: [{
      name: String,
      reaction: String,
      criticality: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      },
      notes: String
    }],
    food: [{
      name: String,
      reaction: String,
      criticality: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
      },
      notes: String
    }]
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  emergencyContact: {
    name: String,
    relationship: String,
    phoneNumber: String
  },
  socialHistory: {
    tobaccoUse: {
      type: String,
      enum: ['Never', 'Former', 'Current', 'Unknown'],
      default: 'Unknown'
    },
    tobaccoType: {
      type: String,
      default: ''
    },
    tobaccoFrequency: {
      type: String,
      default: ''
    },
    alcoholUse: {
      type: String,
      enum: ['Never', 'Former', 'Current', 'Unknown'],
      default: 'Unknown'
    },
    alcoholType: {
      type: String,
      default: ''
    },
    alcoholFrequency: {
      type: String,
      default: ''
    },
    illicitDrugUse: {
      type: String,
      enum: ['Never', 'Former', 'Current', 'Unknown'],
      default: 'Unknown'
    },
    drugType: {
      type: String,
      default: ''
    },
    drugFrequency: {
      type: String,
      default: ''
    },
    occupation: {
      type: String,
      default: ''
    }
  },
  specialDirectives: {
    dnr: {
      type: Boolean,
      default: false
    },
    livingWill: {
      type: Boolean,
      default: false
    },
    religiousInstructions: {
      type: String,
      default: ''
    },
    organDonor: {
      type: Boolean,
      default: false
    }
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

// Create indexes for better search performance
patientSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

const Patient = mongoose.model('Patient', patientSchema);

export default Patient; 