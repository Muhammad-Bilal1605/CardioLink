// user.model.js
import mongoose from "mongoose";

const baseOptions = {
  discriminatorKey: "role", // our key to differentiate models
  timestamps: true,
};

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    lastLogin: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
    role: { 
      type: String, 
      required: true, 
      enum: ["patient", "ambulance-employer", "admin", "pharmacist", "hospital-admin", "radiologist", "lab-technologist", "doctor", "hospital-front-desk"] 
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hospital',
      required: function() {
        return ['hospital-admin', 'radiologist', 'lab-technologist', 'doctor', 'hospital-front-desk'].includes(this.role);
      }
    },
    // Patient-specific fields
    phoneNumber: { type: String },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    age: { type: Number },
    dateOfBirth: { type: Date },
    bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
    allergies: [{ type: String }],
    emergencyContact: { type: String }
  },
  baseOptions
);

export const User = mongoose.model("User", userSchema);
