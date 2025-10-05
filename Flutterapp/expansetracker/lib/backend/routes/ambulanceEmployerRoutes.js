// ambulanceEmployerRoutes.js
import express from "express";
import bcryptjs from "bcryptjs";
import jwt from "jsonwebtoken";
import { AmbulanceEmployer } from "../models/ambulanceEmployer.model.js";

const router = express.Router();

// Generate JWT token
const generateToken = (employerId) => {
  return jwt.sign({ employerId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

// TEST ENDPOINT - Check database connection
router.get("/test-db", async (req, res) => {
  try {
    const dbName = AmbulanceEmployer.db.name;
    const collectionName = AmbulanceEmployer.collection.name;
    const employerCount = await AmbulanceEmployer.countDocuments();
    
    console.log(`📊 Database Test - DB: ${dbName}, Collection: ${collectionName}, Count: ${employerCount}`);
    
    res.status(200).json({
      success: true,
      message: "Database connection test successful",
      database: dbName,
      collection: collectionName,
      employerCount: employerCount
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

// AMBULANCE EMPLOYER SIGNUP
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
      companyName,
      licenseNumber,
      serviceArea,
      emergencyContact
    } = req.body;

    console.log("📝 Ambulance employer signup attempt for:", email);
    console.log("📊 Using database:", AmbulanceEmployer.db.name);
    console.log("📊 Using collection:", AmbulanceEmployer.collection.name);

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
      isVerified: true, // Auto-verify for simplicity
      lastLogin: new Date()
    });

    await newEmployer.save();

    console.log("✅ Ambulance employer saved to database:", AmbulanceEmployer.db.name);
    console.log("✅ Ambulance employer saved to collection:", AmbulanceEmployer.collection.name);
    console.log("✅ Ambulance employer ID:", newEmployer._id);

    // Generate JWT
    const token = generateToken(newEmployer._id);

    res.cookie("ambulance_employer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "Ambulance employer account created successfully",
      database: AmbulanceEmployer.db.name,
      collection: AmbulanceEmployer.collection.name,
      employer: {
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
});

// AMBULANCE EMPLOYER LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Ambulance employer login attempt for:", email);
    console.log("📊 Searching in database:", AmbulanceEmployer.db.name);
    console.log("📊 Searching in collection:", AmbulanceEmployer.collection.name);

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
      console.log("❌ Ambulance employer not found in database:", AmbulanceEmployer.db.name);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials"
      });
    }

    console.log("✅ Ambulance employer found in database:", AmbulanceEmployer.db.name);
    console.log("✅ Ambulance employer found in collection:", AmbulanceEmployer.collection.name);

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

    // Generate JWT
    const token = generateToken(employer._id);

    res.cookie("ambulance_employer_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    console.log("✅ Ambulance employer logged in successfully from database:", AmbulanceEmployer.db.name);

    res.status(200).json({
      success: true,
      message: "Logged in successfully",
      database: AmbulanceEmployer.db.name,
      collection: AmbulanceEmployer.collection.name,
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
      },
    });

  } catch (error) {
    console.error("❌ Ambulance employer login error:", error);
    res.status(500).json({
      success: false,
      message: "Error during login"
    });
  }
});

// AMBULANCE EMPLOYER LOGOUT
router.post("/logout", async (req, res) => {
  try {
    res.clearCookie("ambulance_employer_token");
    console.log("👋 Ambulance employer logged out");
    
    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    console.error("❌ Ambulance employer logout error:", error);
    res.status(500).json({
      success: false,
      message: "Error during logout"
    });
  }
});

// CHECK AMBULANCE EMPLOYER AUTH STATUS
router.get("/check-auth", async (req, res) => {
  try {
    const token = req.cookies.ambulance_employer_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employer = await AmbulanceEmployer.findById(decoded.employerId).select("-password");

    if (!employer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Ambulance employer not found"
      });
    }

    if (!employer.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account has been deactivated"
      });
    }

    res.status(200).json({
      success: true,
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
    console.error("❌ Check auth error:", error);
    res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token"
    });
  }
});

// UPDATE AMBULANCE EMPLOYER PROFILE
router.put("/update-profile", async (req, res) => {
  try {
    const token = req.cookies.ambulance_employer_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided"
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employer = await AmbulanceEmployer.findById(decoded.employerId);

    if (!employer) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Ambulance employer not found"
      });
    }

    const {
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

    // Update allowed fields
    if (name) employer.name = name;
    if (phoneNumber) employer.phoneNumber = phoneNumber;
    if (gender) employer.gender = gender;
    if (age) employer.age = age;
    if (dateOfBirth) employer.dateOfBirth = new Date(dateOfBirth);
    if (companyName) employer.companyName = companyName;
    if (licenseNumber) employer.licenseNumber = licenseNumber;
    if (serviceArea) employer.serviceArea = serviceArea;
    if (emergencyContact) employer.emergencyContact = emergencyContact;

    await employer.save();

    console.log("✅ Ambulance employer profile updated:", employer._id);

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
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
        emergencyContact: employer.emergencyContact
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