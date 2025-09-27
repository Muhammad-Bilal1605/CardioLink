import express from 'express';
import { 
  sendMessage, 
  getConversation, 
  getRecentConversations, 
  markAsRead, 
  deleteMessage, 
  uploadMedia 
} from '../controllers/message.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { verifyPatientAuth } from '../middleware/patientAuth.middleware.js';
import upload from '../utils/multer.js';

const router = express.Router();

// Create a combined auth middleware that handles both patient and general auth
const combinedAuth = async (req, res, next) => {
  try {
    // Get token from Authorization header or cookies
    let token = null;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies.token) {
      token = req.cookies.token;
    } else if (req.cookies.patient_token) {
      token = req.cookies.patient_token;
    }
    
    if (!token) {
      const AppError = (await import('../utils/appError.js')).default;
      return next(new AppError('Not authorized to access this route', 401));
    }
    
    // Verify the token
    const jwt = await import('jsonwebtoken');
    const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a patient token (has userId field)
    if (decoded.userId) {
      // Import Patient model and find patient
      const { connectPatientDB } = await import('../db/patientDB.js');
      const patientConnection = await connectPatientDB();
      const Patient = patientConnection.model('Patient');
      
      const patient = await Patient.findById(decoded.userId).select('-password');
      
      if (!patient || !patient.isActive) {
        const AppError = (await import('../utils/appError.js')).default;
        return next(new AppError('Patient not found or inactive', 401));
      }
      
      // Add patient info to request
      req.user = patient;
      req.userId = patient._id;
      req.userType = 'patient';
      
      console.log(`✅ Patient authenticated: ${patient.name} (${patient._id})`);
      return next();
    } else {
      // Fall back to general auth for doctors
      return protect(req, res, next);
    }
    
  } catch (error) {
    console.error('❌ Auth error:', error);
    const AppError = (await import('../utils/appError.js')).default;
    return next(new AppError('Invalid token', 401));
  }
};

// Use combined auth for all routes
router.use(combinedAuth);

// Message routes
router.post('/', sendMessage);
router.get('/conversation/:roomId', getConversation);
router.get('/conversations', getRecentConversations);
router.patch('/read', markAsRead);
router.delete('/:id', deleteMessage);

// File upload route
router.post(
  '/upload-media',
  upload.single('file'),
  uploadMedia
);

export default router;
