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
    role: { type: String, required: true, enum: ["admin", "pharmacist", "hospital-admin", "radiologist", "lab-technologist", "doctor", "hospital-front-desk"] },
  },
  baseOptions
);

export const User = mongoose.model("User", userSchema);
