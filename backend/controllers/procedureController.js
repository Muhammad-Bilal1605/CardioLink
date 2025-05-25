import Procedure from '../models/Procedure.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';

// Multer configuration with simplified error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Simple multer setup that accepts any file type for testing
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).fields([
  { name: 'documents', maxCount: 10 },
  { name: 'images', maxCount: 10 }
]);

// Export the upload middleware
export const uploadFiles = upload;

// Create new procedure
export const createProcedure = async (req, res) => {
  try {
    console.log('Request body:', req.body);
    console.log('Files received:', req.files);
    console.log('User ID from token:', req.userId);

    // Get the authenticated user information
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify user has a hospital ID and appropriate role
    if (!user.hospitalId) {
      return res.status(403).json({
        success: false, 
        error: 'User must be associated with a hospital to upload procedure records'
      });
    }

    // Verify user role (doctors, hospital admins, or front desk can upload procedures)
    if (!['doctor', 'hospital-admin', 'hospital-front-desk'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Only doctors, hospital admins, or front desk staff can upload procedure records'
      });
    }
      
      const {
        patientId,
        procedureName,
        date,
        hospital,
        physician,
        indication,
        findings,
        complications,
        followUpPlan,
        status
      } = req.body;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: 'Patient ID is required'
        });
      }

      // Create arrays for documents and images paths
      let documents = [];
      let images = [];

      // Process document files if any
      if (req.files && req.files.documents) {
        documents = req.files.documents.map(file => 
          `/uploads/${file.filename}`
        );
      }
      
      // Process image files if any
      if (req.files && req.files.images) {
        images = req.files.images.map(file => 
          `/uploads/${file.filename}`
        );
      }

    // Create procedure object with auto-populated fields
      const procedureData = {
        patientId,
      hospitalId: user.hospitalId,  // Auto-populate from authenticated user
      uploadedBy: user._id,         // Auto-populate from authenticated user
        procedureName: procedureName || 'Untitled Procedure',
        date: date || new Date(),
        hospital: hospital || 'Unknown',
        physician: physician || 'Unknown',
        indication: indication || 'Not specified',
        findings: findings || 'Not specified',
        complications: complications || '',
        followUpPlan: followUpPlan || 'None',
        status: status || 'Scheduled'
      };

      // Only add documents and images if there are any
      if (documents.length > 0) {
        procedureData.documents = documents;
      }
      
      if (images.length > 0) {
        procedureData.images = images;
      }

    console.log("Creating procedure with data:", {
      patientId: procedureData.patientId,
      uploadedBy: procedureData.uploadedBy,
      hospitalId: procedureData.hospitalId,
      procedureName: procedureData.procedureName,
      userRole: user.role
    });

      // Save the procedure
      const procedure = new Procedure(procedureData);
      await procedure.save();
      
      return res.status(201).json({ 
        success: true, 
        message: 'Procedure created successfully',
      data: procedure 
      });
    } catch (error) {
      console.error('Procedure creation error:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
};

// Get all procedures for a patient
export const getPatientProcedures = async (req, res) => {
  try {
    const procedures = await Procedure.find({ patientId: req.params.patientId })
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: procedures });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single procedure by ID
export const getProcedureById = async (req, res) => {
  try {
    const procedure = await Procedure.findById(req.params.id);
    if (!procedure) {
      return res.status(404).json({ success: false, message: 'Procedure not found' });
    }
    res.status(200).json({ success: true, data: procedure });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Search procedures
export const searchProcedures = async (req, res) => {
  try {
    const { query, patientId } = req.query;
    
    const searchQuery = {
      patientId,
      $or: [
        { procedureName: { $regex: query, $options: 'i' } },
        { physician: { $regex: query, $options: 'i' } },
        { indication: { $regex: query, $options: 'i' } },
        { findings: { $regex: query, $options: 'i' } }
      ]
    };

    const procedures = await Procedure.find(searchQuery).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: procedures
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update a procedure
export const updateProcedure = async (req, res) => {
    try {
      // Check if procedure exists first
      const existingProcedure = await Procedure.findById(req.params.id);
      if (!existingProcedure) {
        return res.status(404).json({ 
          success: false, 
          message: 'Procedure not found' 
        });
      }
      
      // Build update data from text fields
      const updateData = { ...req.body };
      
      // Process new files if any
      if (req.files) {
        // For documents
        if (req.files.documents && req.files.documents.length > 0) {
          const newDocuments = req.files.documents.map(file => 
            `/uploads/${file.filename}`
          );
          
          // Get existing documents array or empty array
          const existingDocs = existingProcedure.documents || [];
          // Create a new array with both existing and new documents
          updateData.documents = [...existingDocs, ...newDocuments];
        }
        
        // For images
        if (req.files.images && req.files.images.length > 0) {
          const newImages = req.files.images.map(file => 
            `/uploads/${file.filename}`
          );
          
          // Get existing images array or empty array
          const existingImages = existingProcedure.images || [];
          // Create a new array with both existing and new images
          updateData.images = [...existingImages, ...newImages];
        }
      }

      console.log("Updating procedure with data:", JSON.stringify(updateData, null, 2));

      // Update the procedure
      const procedure = await Procedure.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({ 
        success: true, 
        message: 'Procedure updated successfully',
        data: procedure 
      });
    } catch (error) {
      console.error('Error updating procedure:', error);
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
};

// Delete a procedure
export const deleteProcedure = async (req, res) => {
  try {
    const procedure = await Procedure.findByIdAndDelete(req.params.id);
    if (!procedure) {
      return res.status(404).json({ success: false, message: 'Procedure not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};