//C:\Users\PMLS\Desktop\CardioLink\CardioLink\Flutterapp\Expansetracker____\lib\backend\controllers\patient.auth.controller.js
import bcryptjs from "bcryptjs";
import { getPatientModel } from "../models/patient.model.js";
import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";

export const patientSignup = async (req, res) => {
  const { email, password, name, phoneNumber, gender, age, dateOfBirth, bloodType, allergies, emergencyContact } = req.body;

  try {
    // Validate required fields
    if (!email || !password || !name || !phoneNumber || !gender || !age || !dateOfBirth || !bloodType || !emergencyContact) {
      return res.status(400).json({ 
        success: false, 
        message: "All required fields must be provided" 
      });
    }

    // Get Patient model
    const Patient = await getPatientModel();

    // Check if patient already exists
    const existingPatient = await Patient.findOne({ email });
    if (existingPatient) {
      return res.status(400).json({ 
        success: false, 
        message: "Patient with this email already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 12);

    // Create new patient
    const patient = new Patient({
      email,
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth: new Date(dateOfBirth),
      bloodType,
      allergies: allergies || [],
      emergencyContact,
      isVerified: true, // Auto-verify for simplicity
      lastLogin: new Date()
    });

    await patient.save();

    // Generate token and set cookie
    generateTokenAndSetCookie(res, patient._id);

    console.log(`✅ New patient registered: ${patient.name} (${patient.email})`);

    res.status(201).json({
      success: true,
      message: "Patient registered successfully",
      user: {
        id: patient._id,
        email: patient.email,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        age: patient.age,
        bloodType: patient.bloodType,
        isVerified: patient.isVerified
      }
    });

  } catch (error) {
    console.error("❌ Patient signup error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error during registration" 
    });
  }
};

export const patientLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: "Email and password are required" 
      });
    }

    // Get Patient model
    const Patient = await getPatientModel();

    // Find patient by email
    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Check password
    const isPasswordValid = await bcryptjs.compare(password, patient.password);
    if (!isPasswordValid) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid email or password" 
      });
    }

    // Update last login
    patient.lastLogin = new Date();
    await patient.save();

    // Generate token and set cookie
    const token = generateTokenAndSetCookie(res, patient._id);

    console.log(`✅ Patient logged in: ${patient.name} (${patient.email})`);

    res.status(200).json({
      success: true,
      message: "Login successful",
      token: token,
      patient: {
        id: patient._id,
        email: patient.email,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        age: patient.age,
        bloodType: patient.bloodType,
        isVerified: patient.isVerified,
        lastLogin: patient.lastLogin
      }
    });

  } catch (error) {
    console.error("❌ Patient login error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error during login" 
    });
  }
};

export const patientLogout = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ success: true, message: "Logged out successfully" });
};
