// unified.auth.controller.js
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { Patient } from "../models/patient.model.js";
import { AmbulanceEmployer } from "../models/ambulanceEmployer.model.js";

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

    // Create new patient
    const newPatient = new Patient({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth: new Date(dateOfBirth),
      bloodType,
      allergies,
      emergencyContact,
      medicalHistory,
      currentMedications,
      isVerified: true,
      lastLogin: new Date()
    });

    await newPatient.save();

    console.log("✅ Patient created successfully:", newPatient._id);

    // Generate token and set cookie
    const token = generatePatientToken(newPatient._id);
    setPatientCookie(res, token);

    res.status(201).json({
      success: true,
      message: "Patient account created successfully",
      userType: "patient",
      token: token,
      user: {
        id: newPatient._id,
        name: newPatient.name,
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

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Check if patient exists
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    // Check if account is active
    if (!patient.isActive) {
      return res.status(400).json({
        success: false,
        message: "Account has been deactivated. Please contact support."
      });
    }

    // Validate password
    const isPasswordValid = await bcryptjs.compare(password, patient.password);
    if (!isPasswordValid) {
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
        name: patient.name,
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