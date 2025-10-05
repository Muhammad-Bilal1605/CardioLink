//C:\Users\PMLS\Desktop\CardioLink\CardioLink\Flutterapp\Expansetracker____\lib\backend\middleware\patientAuth.middleware.js
import jwt from "jsonwebtoken";
import { connectPatientDB } from "../db/patientDB.js";

// Initialize Patient model
let Patient;
const initializePatientModel = async () => {
  try {
    const patientConnection = await connectPatientDB();
    
    // Get existing Patient model or create it if it doesn't exist
    try {
      Patient = patientConnection.model("Patient");
    } catch (error) {
      // If model doesn't exist, create it with the schema
      const patientSchema = new patientConnection.base.Schema({
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
          trim: true
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
          required: true,
          enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        },
        allergies: [{
          type: String,
          trim: true
        }],
        emergencyContact: {
          type: String,
          required: true,
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
          }
        }],
        currentMedications: [{
          name: String,
          dosage: String,
          frequency: String,
          prescribedDate: Date
        }],
        isActive: {
          type: Boolean,
          default: true
        }
      }, {
        timestamps: true
      });

      patientSchema.index({ email: 1 });
      patientSchema.index({ phoneNumber: 1 });

      Patient = patientConnection.model("Patient", patientSchema);
    }
    
    console.log("✅ Patient model initialized for middleware");
    
  } catch (error) {
    console.error("❌ Failed to initialize Patient model in middleware:", error);
    throw error;
  }
};

// Initialize the model when the module is loaded - but only after dotenv is configured
// We'll delay this initialization to avoid the environment variable issue
let initializationPromise = null;

const ensurePatientModelInitialized = async () => {
  if (!initializationPromise) {
    initializationPromise = initializePatientModel();
  }
  return initializationPromise;
};

// Middleware to verify patient authentication
export const verifyPatientAuth = async (req, res, next) => {
  try {
    await ensurePatientModelInitialized();
    const token = req.cookies.patient_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided."
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find patient in database
    const patient = await Patient.findById(decoded.patientId).select("-password");

    if (!patient) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Patient not found."
      });
    }

    // Check if patient account is active
    if (!patient.isActive) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Account has been deactivated."
      });
    }

    // Add patient info to request object
    req.patient = patient;
    req.patientId = patient._id;

    console.log(`✅ Patient authenticated: ${patient.name} (${patient._id})`);
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Access denied. Invalid authentication token."
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Access denied. Authentication token has expired."
      });
    }

    console.error("❌ Patient authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication."
    });
  }
};

// Optional middleware to check if patient is verified
export const requirePatientVerification = (req, res, next) => {
  if (!req.patient) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (!req.patient.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required. Please verify your email to access this feature."
    });
  }

  next();
};

// Middleware to optionally authenticate patient (doesn't block if no token)
export const optionalPatientAuth = async (req, res, next) => {
  try {
    const token = req.cookies.patient_token;

    if (!token) {
      req.patient = null;
      req.patientId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(decoded.patientId).select("-password");

    if (patient && patient.isActive) {
      req.patient = patient;
      req.patientId = patient._id;
      console.log(`✅ Optional patient auth: ${patient.name} (${patient._id})`);
    } else {
      req.patient = null;
      req.patientId = null;
    }

    next();

  } catch (error) {
    // If there's an error with optional auth, just proceed without patient info
    req.patient = null;
    req.patientId = null;
    next();
  }
};

export default {
  verifyPatientAuth,
  requirePatientVerification,
  optionalPatientAuth
};