// patient.model.js - Updated to match your existing structure
import mongoose from "mongoose";

const patientSchema = new mongoose.Schema({
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
    required: true,
    trim: true,
    unique: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  age: {
    type: Number,
    required: true,
    min: 1,
    max: 120
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  bloodType: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  allergies: [{
    type: String,
    trim: true
  }],
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
  medicalHistory: [{
    condition: String,
    diagnosedDate: Date,
    status: {
      type: String,
      enum: ['Active', 'Resolved', 'Chronic'],
      default: 'Active'
    },
    notes: String
  }],
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    prescribedDate: Date,
    prescribedBy: String,
    notes: String
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  // Additional medical fields
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  insurance: {
    provider: String,
    policyNumber: String,
    groupNumber: String,
    expiryDate: Date
  },
  vitalSigns: [{
    date: {
      type: Date,
      default: Date.now
    },
    heartRate: Number,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    temperature: Number,
    weight: Number,
    height: Number,
    notes: String
  }]
}, {
  timestamps: true
});

// Create indexes for better search performance
patientSchema.index({ email: 1 });
patientSchema.index({ phoneNumber: 1 });
patientSchema.index({ name: 'text', email: 'text' });

export const Patient = mongoose.model("Patient", patientSchema);