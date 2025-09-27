// ambulanceEmployer.model.js
import mongoose from "mongoose";

const ambulanceEmployerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true // Allows multiple null values, but enforces uniqueness when not null
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  age: {
    type: Number,
    min: 1,
    max: 120
  },
  dateOfBirth: {
    type: Date
  },
  companyName: {
    type: String,
    trim: true
  },
  licenseNumber: {
    type: String,
    trim: true,
    unique: true,
    sparse: true // Allows multiple null values
  },
  serviceArea: {
    type: String,
    trim: true
  },
  emergencyContact: {
    type: String,
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationTokenExpiresAt: Date,
  resetPasswordToken: String,
  resetPasswordExpiresAt: Date,
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Ambulance-specific fields
  vehicles: [{
    vehicleId: String,
    plateNumber: String,
    model: String,
    year: Number,
    status: {
      type: String,
      enum: ['Active', 'Maintenance', 'Inactive'],
      default: 'Active'
    }
  }],
  operatingHours: {
    start: String,
    end: String,
    is24Hours: {
      type: Boolean,
      default: false
    }
  },
  servicesOffered: [{
    type: String,
    enum: ['Emergency Transport', 'Non-Emergency Transport', 'Critical Care', 'Basic Life Support', 'Advanced Life Support']
  }]
}, {
  timestamps: true
});

// Create indexes
ambulanceEmployerSchema.index({ email: 1 });
ambulanceEmployerSchema.index({ phoneNumber: 1 });
ambulanceEmployerSchema.index({ licenseNumber: 1 });
ambulanceEmployerSchema.index({ companyName: 1 });

export const AmbulanceEmployer = mongoose.model("AmbulanceEmployer", ambulanceEmployerSchema);