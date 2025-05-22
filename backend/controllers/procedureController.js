import Procedure from '../models/Procedure.js';
import Patient from '../models/User.js';
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

// Create new procedure
export const createProcedure = async (req, res) => {
  // Handle file upload
  upload(req, res, async function(err) {
    if (err) {
      console.error('Upload error:', err);
      return res.status(400).json({ 
        success: false, 
        error: err.message 
      });
    }

    try {
      console.log('Request body:', req.body);
      console.log('Files received:', req.files);
      
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

      // Create procedure object
      const procedureData = {
        patientId,
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

      console.log("Creating procedure with data:", JSON.stringify(procedureData, null, 2));

      // Save the procedure
      const procedure = new Procedure(procedureData);
      await procedure.save();
      
      return res.status(201).json({ 
        success: true, 
        message: 'Procedure created successfully',
        procedure 
      });
    } catch (error) {
      console.error('Procedure creation error:', error);
      return res.status(400).json({ 
        success: false, 
        error: error.message 
      });
    }
  });
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

// Get a single procedure
export const getProcedure = async (req, res) => {
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

// Update a procedure
export const updateProcedure = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        error: err.message 
      });
    }

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
  });
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