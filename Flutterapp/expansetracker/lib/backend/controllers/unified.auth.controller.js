// unified.auth.controller.js
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import mongoose from "mongoose";
import Patient  from "../models/User.js";
import { AmbulanceEmployer } from "../models/ambulanceEmployer.model.js";
import {
  sendVerificationEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendResetSuccessEmail,
} from "../mailtrap/emails.js";

// Generate JWT token for patients
const generatePatientToken = (patientId) => {
  return jwt.sign({ patientId, userType: 'patient' }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Generate JWT token for ambulance employers
const generateEmployerToken = (employerId) => {
  return jwt.sign({ employerId, userType: 'ambulance_employer' }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// Set cookie for patients
const setPatientCookie = (res, token) => {
  res.cookie("patient_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// Set cookie for ambulance employers
const setEmployerCookie = (res, token) => {
  res.cookie("ambulance_employer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// PATIENT SIGNUP
export const patientSignup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth,
      bloodType,
      allergies = [],
      emergencyContact,
      medicalHistory = [],
      currentMedications = []
    } = req.body;

    console.log("📝 Patient signup attempt for:", email);

    // Validation
    if (!email || !password || !name || !phoneNumber || !gender || !age || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // Age validation
    if (age < 1 || age > 120) {
      return res.status(400).json({
        success: false,
        message: "Age must be between 1 and 120"
      });
    }

    // Check if patient already exists
    const patientAlreadyExists = await Patient.findOne({ email });
    if (patientAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Patient already exists with this email"
      });
    }

    // Check if phone number already exists
    const phoneAlreadyExists = await Patient.findOne({ phoneNumber });
    if (phoneAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Patient already exists with this phone number"
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Split name into firstName and lastName
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Generate verification token (6-digit code)
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationTokenExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    // Create new patient (not verified yet)
    const newPatient = new Patient({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phoneNumber,
      gender,
      age,
      dateOfBirth: new Date(dateOfBirth),
      bloodType,
      allergies,
      emergencyContact,
      medicalHistory,
      currentMedications,
      isVerified: false,
      verificationToken,
      verificationTokenExpiresAt,
      lastLogin: new Date()
    });

    await newPatient.save();

    console.log("✅ Patient created successfully:", newPatient._id);

    // Send verification email
    try {
      await sendVerificationEmail(newPatient.email, verificationToken);
      console.log("✅ Verification email sent to:", newPatient.email);
    } catch (emailError) {
      console.error("❌ Error sending verification email:", emailError);
      // Don't fail signup if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: "Patient account created. Please verify your email to continue.",
      userType: "patient",
      requiresVerification: true,
      user: {
        id: newPatient._id,
        name: `${newPatient.firstName} ${newPatient.lastName}`.trim(),
        firstName: newPatient.firstName,
        lastName: newPatient.lastName,
        email: newPatient.email,
        phoneNumber: newPatient.phoneNumber,
        gender: newPatient.gender,
        age: newPatient.age,
        dateOfBirth: newPatient.dateOfBirth,
        bloodType: newPatient.bloodType,
        allergies: newPatient.allergies,
        emergencyContact: newPatient.emergencyContact,
        medicalHistory: newPatient.medicalHistory,
        currentMedications: newPatient.currentMedications,
        isVerified: newPatient.isVerified,
        lastLogin: newPatient.lastLogin
      },
    });

  } catch (error) {
    console.error("❌ Patient signup error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating patient account"
    });
  }
};

// AMBULANCE EMPLOYER SIGNUP
export const ambulanceEmployerSignup = async (req, res) => {
  try {
    const {
      email,
      password,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth,
      companyName,
      licenseNumber,
      serviceArea,
      emergencyContact
    } = req.body;

    console.log("📝 Ambulance employer signup attempt for:", email);

    // Validation
    if (!email || !password || !name || !phoneNumber || !gender || !age || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: "All required fields must be provided"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email address"
      });
    }

    // Age validation
    if (age < 1 || age > 120) {
      return res.status(400).json({
        success: false,
        message: "Age must be between 1 and 120"
      });
    }

    // Check if employer already exists
    const employerAlreadyExists = await AmbulanceEmployer.findOne({ email });
    if (employerAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Ambulance employer already exists with this email"
      });
    }

    // Check if phone number already exists
    const phoneAlreadyExists = await AmbulanceEmployer.findOne({ phoneNumber });
    if (phoneAlreadyExists) {
      return res.status(400).json({
        success: false,
        message: "Ambulance employer already exists with this phone number"
      });
    }

    // Check if license number already exists (if provided)
    if (licenseNumber) {
      const licenseAlreadyExists = await AmbulanceEmployer.findOne({ licenseNumber });
      if (licenseAlreadyExists) {
        return res.status(400).json({
          success: false,
          message: "Ambulance employer already exists with this license number"
        });
      }
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create new ambulance employer
    const newEmployer = new AmbulanceEmployer({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth: new Date(dateOfBirth),
      companyName,
      licenseNumber,
      serviceArea,
      emergencyContact,
      isVerified: true,
      lastLogin: new Date()
    });

    await newEmployer.save();

    console.log("✅ Ambulance employer created successfully:", newEmployer._id);

    // Generate token and set cookie
    const token = generateEmployerToken(newEmployer._id);
    setEmployerCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Ambulance employer account created successfully",
      userType: "ambulance_employer",
      token: token,
      user: {
        id: newEmployer._id,
        name: newEmployer.name,
        email: newEmployer.email,
        phoneNumber: newEmployer.phoneNumber,
        gender: newEmployer.gender,
        age: newEmployer.age,
        dateOfBirth: newEmployer.dateOfBirth,
        companyName: newEmployer.companyName,
        licenseNumber: newEmployer.licenseNumber,
        serviceArea: newEmployer.serviceArea,
        emergencyContact: newEmployer.emergencyContact,
        isVerified: newEmployer.isVerified,
        lastLogin: newEmployer.lastLogin
      },
    });

  } catch (error) {
    console.error("❌ Ambulance employer signup error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error creating ambulance employer account"
    });
  }
};

// PATIENT LOGIN
export const patientLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Patient login attempt for:", email);
    console.log("📝 Request body:", req.body);

    // Validation
    if (!email || !password) {
      console.log("❌ Missing email or password");
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if patient exists
    console.log("🔍 Searching for patient with email:", email);
    const patient = await Patient.findOne({ email });
    console.log("🔍 Patient found:", patient ? "Yes" : "No");
    if (patient) {
      console.log("🔍 Patient ID:", patient._id);
      console.log("🔍 Patient email:", patient.email);
    }
    if (!patient) {
      console.log("❌ Patient not found for email:", email);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // List of emails that bypass verification check (existing accounts)
    const bypassVerificationEmails = [
      'faizanmkhan@gmail.com',
      'new2@gmail.com',
      'new1@gmail.com'
    ];

    // Check if account is verified (skip check for existing accounts)
    if (patient.isVerified === false && !bypassVerificationEmails.includes(email.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: "Account not verified. Please verify your email to continue.",
        requiresVerification: true
      });
    }

    // Validate password
    console.log("🔐 Validating password...");
    const isPasswordValid = await bcryptjs.compare(password, patient.password);
    console.log("🔐 Password valid:", isPasswordValid);
    if (!isPasswordValid) {
      console.log("❌ Invalid password for patient:", patient._id);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    patient.lastLogin = new Date();
    await patient.save();

    // Generate token and set cookie
    const token = generatePatientToken(patient._id);
    setPatientCookie(res, token);

    console.log("✅ Patient logged in successfully:", patient._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      userType: "patient",
      token: token,
      patient: {
        id: patient._id,
        name: `${patient.firstName} ${patient.lastName}`.trim(),
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        age: patient.age,
        dateOfBirth: patient.dateOfBirth,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        currentMedications: patient.currentMedications,
        isVerified: patient.isVerified,
        lastLogin: patient.lastLogin
      }
    });

  } catch (error) {
    console.error("❌ Patient login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login"
    });
  }
};

// AMBULANCE EMPLOYER LOGIN
export const ambulanceEmployerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Ambulance employer login attempt for:", email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if employer exists
    const employer = await AmbulanceEmployer.findOne({ email });
    if (!employer) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if account is active
    if (!employer.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account has been deactivated. Please contact support."
      });
    }

    // Validate password
    const isPasswordValid = await bcryptjs.compare(password, employer.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Update last login
    employer.lastLogin = new Date();
    await employer.save();

    // Generate token and set cookie
    const token = generateEmployerToken(employer._id);
    setEmployerCookie(res, token);

    console.log("✅ Ambulance employer logged in successfully:", employer._id);

    res.status(200).json({
      success: true,
      message: "Login successful",
      userType: "ambulance_employer",
      token: token,
      employer: {
        id: employer._id,
        name: employer.name,
        email: employer.email,
        phoneNumber: employer.phoneNumber,
        gender: employer.gender,
        age: employer.age,
        dateOfBirth: employer.dateOfBirth,
        companyName: employer.companyName,
        licenseNumber: employer.licenseNumber,
        serviceArea: employer.serviceArea,
        emergencyContact: employer.emergencyContact,
        isVerified: employer.isVerified,
        lastLogin: employer.lastLogin
      }
    });

  } catch (error) {
    console.error("❌ Ambulance employer login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login"
    });
  }
};

// VERIFY EMAIL (for patients)
export const verifyPatientEmail = async (req, res) => {
  try {
    const { code, email } = req.body;

    if (!code || !email) {
      return res.status(400).json({
        success: false,
        message: "Verification code and email are required"
      });
    }

    const patient = await Patient.findOne({
      email,
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() }
    });

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    // Mark as verified and clear verification token
    patient.isVerified = true;
    patient.verificationToken = undefined;
    patient.verificationTokenExpiresAt = undefined;
    await patient.save();

    // Send welcome email
    try {
      await sendWelcomeEmail(patient.email, `${patient.firstName} ${patient.lastName}`.trim());
    } catch (emailError) {
      console.error("❌ Error sending welcome email:", emailError);
    }

    // Generate token and set cookie
    const token = generatePatientToken(patient._id);
    setPatientCookie(res, token);

    console.log("✅ Patient email verified:", patient._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      token: token,
      userType: "patient",
      patient: {
        id: patient._id,
        name: `${patient.firstName} ${patient.lastName}`.trim(),
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        age: patient.age,
        dateOfBirth: patient.dateOfBirth,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
        emergencyContact: patient.emergencyContact,
        medicalHistory: patient.medicalHistory,
        currentMedications: patient.currentMedications,
        isVerified: patient.isVerified,
        lastLogin: patient.lastLogin
      }
    });
  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying email"
    });
  }
};

// FORGOT PASSWORD (for patients)
export const forgotPatientPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please try again later."
      });
    }

    let patient;
    try {
      patient = await Patient.findOne({ email });
    } catch (dbError) {
      console.error("❌ Database query error:", dbError);
      
      // Check if it's a connection error
      if (dbError.name === 'MongoServerSelectionError' || 
          dbError.message.includes('ENOTFOUND') ||
          dbError.message.includes('connection')) {
        return res.status(503).json({
          success: false,
          message: "Database connection error. Please check your MongoDB connection and try again."
        });
      }
      
      // Re-throw other errors
      throw dbError;
    }

    if (!patient) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent"
      });
    }

    // Generate 6-digit verification code for password reset
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    patient.resetPasswordToken = resetCode; // Store code as token
    patient.resetPasswordExpiresAt = resetCodeExpiresAt;
    
    try {
      await patient.save();
    } catch (saveError) {
      console.error("❌ Error saving reset code:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error processing password reset request"
      });
    }

    // Send password reset verification code email
    try {
      await sendPasswordResetEmail(patient.email, resetCode);
      console.log("✅ Password reset verification code sent to:", patient.email);
    } catch (emailError) {
      console.error("❌ Error sending password reset email:", emailError);
      // Still return success since the code was saved
      // User can request another email if needed
      return res.status(200).json({
        success: true,
        message: "Password reset code generated. Email sending failed, please try again or contact support."
      });
    }

    res.status(200).json({
      success: true,
      message: "If an account exists with this email, a password reset code has been sent"
    });
  } catch (error) {
    console.error("❌ Forgot password error:", error);
    
    // Provide more specific error messages
    if (error.name === 'MongoServerSelectionError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please check your MongoDB connection."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error processing password reset request"
    });
  }
};

// VERIFY PASSWORD RESET CODE (for patients)
export const verifyPasswordResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required"
      });
    }

    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please try again later."
      });
    }

    let patient;
    try {
      patient = await Patient.findOne({
        email,
        resetPasswordToken: code,
        resetPasswordExpiresAt: { $gt: Date.now() }
      });
    } catch (dbError) {
      console.error("❌ Database query error:", dbError);
      
      // Check if it's a connection error
      if (dbError.name === 'MongoServerSelectionError' || 
          dbError.message.includes('ENOTFOUND') ||
          dbError.message.includes('connection')) {
        return res.status(503).json({
          success: false,
          message: "Database connection error. Please check your MongoDB connection and try again."
        });
      }
      
      // Re-throw other errors
      throw dbError;
    }

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    // Code is valid, return success (code will be used in reset password step)
    res.status(200).json({
      success: true,
      message: "Verification code is valid"
    });
  } catch (error) {
    console.error("❌ Verify password reset code error:", error);
    
    // Provide more specific error messages
    if (error.name === 'MongoServerSelectionError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please check your MongoDB connection."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error verifying reset code"
    });
  }
};

// RESET PASSWORD (for patients) - Now uses code instead of token
export const resetPatientPassword = async (req, res) => {
  try {
    const { email, code, password } = req.body;

    if (!email || !code || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, verification code, and password are required"
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if mongoose is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("❌ Database not connected. ReadyState:", mongoose.connection.readyState);
      return res.status(503).json({
        success: false,
        message: "Database connection unavailable. Please try again later."
      });
    }

    let patient;
    try {
      patient = await Patient.findOne({
        email,
        resetPasswordToken: code,
        resetPasswordExpiresAt: { $gt: Date.now() }
      });
    } catch (dbError) {
      console.error("❌ Database query error:", dbError);
      
      // Check if it's a connection error
      if (dbError.name === 'MongoServerSelectionError' || 
          dbError.message.includes('ENOTFOUND') ||
          dbError.message.includes('connection')) {
        return res.status(503).json({
          success: false,
          message: "Database connection error. Please check your MongoDB connection and try again."
        });
      }
      
      // Re-throw other errors
      throw dbError;
    }

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    // Update password
    const hashedPassword = await bcryptjs.hash(password, 12);
    patient.password = hashedPassword;
    patient.resetPasswordToken = undefined;
    patient.resetPasswordExpiresAt = undefined;
    
    try {
      await patient.save();
    } catch (saveError) {
      console.error("❌ Error saving new password:", saveError);
      return res.status(500).json({
        success: false,
        message: "Error resetting password"
      });
    }

    // Send success email
    try {
      await sendResetSuccessEmail(patient.email);
    } catch (emailError) {
      console.error("❌ Error sending reset success email:", emailError);
      // Don't fail the request if email fails
    }

    console.log("✅ Patient password reset successfully:", patient._id);

    res.status(200).json({
      success: true,
      message: "Password reset successful"
    });
  } catch (error) {
    console.error("❌ Reset password error:", error);
    
    // Provide more specific error messages
    if (error.name === 'MongoServerSelectionError') {
      return res.status(503).json({
        success: false,
        message: "Database connection error. Please check your MongoDB connection."
      });
    }
    
    res.status(500).json({
      success: false,
      message: "Error resetting password"
    });
  }
};

// UNIVERSAL LOGOUT (works for both user types)
export const universalLogout = async (req, res) => {
  try {
    res.clearCookie("patient_token");
    res.clearCookie("ambulance_employer_token");
    console.log("👋 User logged out");
    
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("❌ Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
};