// ambulanceRequest.model.js
import mongoose from "mongoose";

const ambulanceRequestSchema = new mongoose.Schema({
  patientId: {
    type: String,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  bloodType: String,
  allergies: [String],
  emergencyContact: String,
  medicalHistory: [mongoose.Schema.Types.Mixed],
  currentMedications: [mongoose.Schema.Types.Mixed],
  location: {
    latitude: Number,
    longitude: Number,
    address: String,
    coordinates: String
  },
  urgency: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  condition: {
    type: String,
    required: true
  },
  requestTime: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['Pending', 'Assigned', 'Completed'],
    default: 'Pending'
  }
}, {
  timestamps: true
});

export const AmbulanceRequest = mongoose.model("AmbulanceRequest", ambulanceRequestSchema);