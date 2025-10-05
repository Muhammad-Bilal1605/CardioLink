import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Patient } from '../models/patient.model.js';
import { AmbulanceEmployer } from '../models/AmbulanceEmployer.js';
import AppError from '../utils/appError.js';

// Protect routes - requires authentication
export const protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header or cookie
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    // Check if token exists
    if (!token) {
      return next(new AppError('Not authorized to access this route', 401));
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if user exists in any of the models
      let user = await User.findById(decoded.userId).select('-password');
      
      // If not found in User model, check Patient model
      if (!user) {
        user = await Patient.findById(decoded.userId).select('-password');
      }
      
      // If still not found, check AmbulanceEmployer model
      if (!user) {
        user = await AmbulanceEmployer.findById(decoded.userId).select('-password');
      }
      
      if (!user) {
        return next(new AppError('User not found', 404));
      }

      // Add user to request object
      req.user = user;
      req.userId = user._id;
      next();
    } catch (error) {
      return next(new AppError('Not authorized, token failed', 401));
    }
  } catch (error) {
    return next(new AppError('Authentication error', 500));
  }
};

// Role-based authorization
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
