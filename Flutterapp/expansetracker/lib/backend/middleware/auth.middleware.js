//========================================
// 1. UPDATED: Backend/middleware/auth.middleware.js
//========================================
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Patient } from '../models/patient.model.js';
import { AmbulanceEmployer } from '../models/AmbulanceEmployer.js';
import AppError from '../utils/appError.js';

export const protect = async (req, res, next) => {
  try {
    let token;

    console.log('\n========== AUTH MIDDLEWARE ==========');
    console.log('📨 Request to:', req.originalUrl);
    console.log('🔐 Auth header:', req.headers.authorization ? 'present' : 'missing');

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
      console.log('✓ Token extracted from Authorization header');
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
      console.log('✓ Token extracted from cookie');
    }

    // Check if token exists
    if (!token) {
      console.error('❌ No token found in headers or cookies');
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route - no token provided',
      });
    }

    try {
      // Verify token
      console.log('🔍 Verifying token with JWT_SECRET...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      console.log('✅ Token verified');
      console.log('📋 Decoded token:', {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType,
      });

      // CRITICAL: Ensure userId is a string
      const userId = decoded.userId.toString();

      // Check if user exists in any of the models
      let user;
      let userType = 'unknown';

      // Try Patient model first (most common for appointments)
      console.log('🔍 Checking Patient model...');
      user = await Patient.findById(userId).select('-password');
      if (user) {
        userType = 'patient';
        console.log('✅ Found in Patient model');
      }

      // If not found, check User model
      if (!user) {
        console.log('🔍 Checking User model...');
        user = await User.findById(userId).select('-password');
        if (user) {
          userType = user.role || 'user';
          console.log('✅ Found in User model, role:', userType);
        }
      }

      // If still not found, check AmbulanceEmployer model
      if (!user) {
        console.log('🔍 Checking AmbulanceEmployer model...');
        user = await AmbulanceEmployer.findById(userId).select('-password');
        if (user) {
          userType = 'ambulance_employer';
          console.log('✅ Found in AmbulanceEmployer model');
        }
      }

      if (!user) {
        console.error('❌ User not found in any model');
        console.error('   Searched for userId:', userId);
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      // Add user to request object - ENSURE _id IS A STRING
      req.user = user;
      req.userId = user._id.toString(); // Always a string
      req.userType = userType;

      console.log('✅ Auth middleware SUCCESS');
      console.log('   req.userId:', req.userId);
      console.log('   req.userType:', req.userType);
      console.log('=====================================\n');

      next();

    } catch (error) {
      console.error('❌ Token verification failed:', error.message);
      
      // Specific error handling
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token format',
          error: 'Token is malformed or corrupted'
        });
      }
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          error: 'Please login again'
        });
      }

      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed',
        error: error.message
      });
    }

  } catch (error) {
    console.error('❌ Authentication error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`User role ${req.user.role} is not authorized to access this route`, 403)
      );
    }
    next();
  };
};
