
//verifyToken.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import Patient from "../models/User.js"; // Patient model
import { AmbulanceEmployer } from "../models/ambulanceEmployer.model.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '') || req.cookies.token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided."
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let user = null;
    
    // Handle different user types based on token payload
    if (decoded.patientId) {
      // Patient token
      user = await Patient.findById(decoded.patientId).select('-password');
      req.userType = 'patient';
    } else if (decoded.employerId) {
      // Ambulance employer token
      user = await AmbulanceEmployer.findById(decoded.employerId).select('-password');
      req.userType = 'ambulance_employer';
    } else if (decoded.userId) {
      // Regular user token (for admin, doctor, etc.)
      user = await User.findById(decoded.userId).select('-password');
      req.userType = user?.role || 'user';
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid token. User not found."
      });
    }

    req.user = user;
    req.userId = user._id; // Also set userId for compatibility
    next();
  } catch (error) {
    console.error("Token verification error:", error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: "Invalid token."
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: "Token expired."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Token verification failed."
    });
  }
};
