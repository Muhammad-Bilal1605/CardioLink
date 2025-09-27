// Updated patientRoutes.js
import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { Patient } from "../models/patient.model.js";

const router = express.Router();

// Generate JWT token
const generateToken = (patientId) => {
  return jwt.sign({ patientId, userType: 'patient' }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// TEST ENDPOINT - Check database connection
router.get("/test-db", async (req, res) => {
  try {
    const dbName = Patient.db.name;
    const collectionName = Patient.collection.name;
    const patientCount = await Patient.countDocuments();
    
    console.log(`📊 Database Test - DB: ${dbName}, Collection: ${collectionName}, Count: ${patientCount}`);
    
    res.status(200).json({
      success: true,
      message: "Database connection test successful",
      database: dbName,
      collection: collectionName,
      patientCount: patientCount
    });
  } catch (error) {
    console.error("❌ Database test error:", error);
    res.status(500).json({
      success: false,
      message: "Database test failed",
      error: error.message
    });
  }
});

// PATIENT SIGNUP
router.post("/signup", async (req, res) => {
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
    console.log("📊 Using database:", Patient.db.name);
    console.log("📊 Using collection:", Patient.collection.name);

    // Validation
    if (!email || !password || !name || !phoneNumber || !gender || !age || 
        !dateOfBirth) {
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

    console.log("✅ Patient saved to database:", Patient.db.name);
    console.log("✅ Patient saved to collection:", Patient.collection.name);
    console.log("✅ Patient ID:", newPatient._id);

    // Generate JWT
    const token = generateToken(newPatient._id);

    res.cookie("patient_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "Patient account created successfully",
      userType: "patient",
      token: token,
      database: Patient.db.name,
      collection: Patient.collection.name,
      patient: {
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
});

// PATIENT LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Patient login attempt for:", email);
    console.log("📊 Searching in database:", Patient.db.name);
    console.log("📊 Searching in collection:", Patient.collection.name);

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
      console.log("❌ Patient not found in database:", Patient.db.name);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    console.log("✅ Patient found in database:", Patient.db.name);
    console.log("✅ Patient found in collection:", Patient.collection.name);

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

    // Generate JWT
    const token = generateToken(patient._id);

    res.cookie("patient_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log("✅ Patient logged in successfully from database:", Patient.db.name);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      userType: "patient",
      token: token,
      database: Patient.db.name,
      collection: Patient.collection.name,
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
      },
    });

  } catch (error) {
    console.error("❌ Patient login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login"
    });
  }
});

// PATIENT LOGOUT
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("patient_token");
    console.log("👋 Patient logged out");
    
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("❌ Patient logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
});

// CHECK PATIENT AUTH STATUS
router.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies.patient_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.patientId).select("-password");

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Patient not found"
      });
    }

    if (!patient.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    res.status(200).json({
      success: true,
      userType: "patient",
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
    console.error("❌ Check auth error:", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token"
    });
  }
});

// VERIFY EMAIL (Optional - for future use)
router.post("/verify-email", async (req, res) => {
  try {
    const { code } = req.body;

    const patient = await Patient.findOne({
      verificationToken: code,
      verificationTokenExpiresAt: { $gt: Date.now() }
    });

    if (!patient) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification code"
      });
    }

    patient.isVerified = true;
    patient.verificationToken = undefined;
    patient.verificationTokenExpiresAt = undefined;

    await patient.save();

    console.log("✅ Patient email verified:", patient._id);

    res.status(200).json({
      success: true,
      message: "Email verified successfully"
    });

  } catch (error) {
    console.error("❌ Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Error verifying email"
    });
  }
});

// UPDATE PATIENT PROFILE
router.put("/update-profile", async (req, res) => {
  try {
    const token = req.cookies.patient_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.patientId);

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Patient not found"
      });
    }

    const {
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth,
      bloodType,
      allergies,
      emergencyContact,
      medicalHistory,
      currentMedications
    } = req.body;

    // Update allowed fields
    if (name) patient.name = name;
    if (phoneNumber) patient.phoneNumber = phoneNumber;
    if (gender) patient.gender = gender;
    if (age) patient.age = age;
    if (dateOfBirth) patient.dateOfBirth = new Date(dateOfBirth);
    if (bloodType) patient.bloodType = bloodType;
    if (allergies) patient.allergies = allergies;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (medicalHistory) patient.medicalHistory = medicalHistory;
    if (currentMedications) patient.currentMedications = currentMedications;

    await patient.save();

    console.log("✅ Patient profile updated:", patient._id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
        currentMedications: patient.currentMedications
      }
    });

  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Error updating profile"
    });
  }
});

export default router;