// ambulanceEmployerAuth.middleware.js
import jwt from "jsonwebtoken";
import { AmbulanceEmployer } from "../models/ambulanceEmployer.model.js";

// Middleware to verify ambulance employer authentication
export const verifyAmbulanceEmployerAuth = async (req, res, next) => {
  try {
    const token = req.cookies.ambulance_employer_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No authentication token provided."
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find employer in database
    const employer = await AmbulanceEmployer.findById(decoded.employerId).select("-password");

    if (!employer) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Ambulance employer not found."
      });
    }

    // Check if employer account is active
    if (!employer.isActive) {
      return res.status(401).json({
        success: false,
        message: "Access denied. Account has been deactivated."
      });
    }

    // Add employer info to request object
    req.employer = employer;
    req.employerId = employer._id;

    console.log(`✅ Ambulance employer authenticated: ${employer.name} (${employer._id})`);
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

    console.error("❌ Ambulance employer authentication error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication."
    });
  }
};

// Optional middleware to check if ambulance employer is verified
export const requireAmbulanceEmployerVerification = (req, res, next) => {
  if (!req.employer) {
    return res.status(401).json({
      success: false,
      message: "Authentication required."
    });
  }

  if (!req.employer.isVerified) {
    return res.status(403).json({
      success: false,
      message: "Email verification required. Please verify your email to access this feature."
    });
  }

  next();
};

// Middleware to optionally authenticate ambulance employer (doesn't block if no token)
export const optionalAmbulanceEmployerAuth = async (req, res, next) => {
  try {
    const token = req.cookies.ambulance_employer_token;

    if (!token) {
      req.employer = null;
      req.employerId = null;
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const employer = await AmbulanceEmployer.findById(decoded.employerId).select("-password");

    if (employer && employer.isActive) {
      req.employer = employer;
      req.employerId = employer._id;
      console.log(`✅ Optional ambulance employer auth: ${employer.name} (${employer._id})`);
    } else {
      req.employer = null;
      req.employerId = null;
    }

    next();

  } catch (error) {
    // If there's an error with optional auth, just proceed without employer info
    req.employer = null;
    req.employerId = null;
    next();
  }
};

export default {
  verifyAmbulanceEmployerAuth,
  requireAmbulanceEmployerVerification,
  optionalAmbulanceEmployerAuth
};