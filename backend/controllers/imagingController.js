import Imaging from '../models/Imaging.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
}).single('image');

// Get all imaging records for a patient
export const getPatientImaging = async (req, res) => {
  try {
    const imaging = await Imaging.find({ patientId: req.params.patientId })
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: imaging
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single imaging record
export const getImagingById = async (req, res) => {
  try {
    const imaging = await Imaging.findById(req.params.id);
    
    if (!imaging) {
      return res.status(404).json({
        success: false,
        error: 'Imaging record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: imaging
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new imaging record with file upload
export const createImaging = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
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
          error: 'User must be associated with a hospital to upload imaging records'
        });
      }

      // Verify user role (typically radiologists should upload imaging)
      if (!['radiologist', 'doctor', 'hospital-admin'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Only radiologists, doctors, or hospital admins can upload imaging records'
        });
      }

      // Check if patient exists
      const patient = await Patient.findById(req.body.patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Create imaging record with file path and auto-populated fields
      const imagingData = {
        ...req.body,
        uploadedBy: user._id,        // Auto-populate from authenticated user
        hospitalId: user.hospitalId, // Auto-populate from authenticated user
        imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl
      };

      console.log('Creating imaging record with data:', {
        patientId: imagingData.patientId,
        uploadedBy: imagingData.uploadedBy,
        hospitalId: imagingData.hospitalId,
        type: imagingData.type,
        userRole: user.role
      });

      const imaging = await Imaging.create(imagingData);
      
      res.status(201).json({
        success: true,
        data: imaging
      });
    } catch (error) {
      console.error('Error creating imaging record:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });
};

// Update imaging record
export const updateImaging = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }

    try {
      const updateData = {
        ...req.body,
        imageUrl: req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl
      };

      const imaging = await Imaging.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true
        }
      );

      if (!imaging) {
        return res.status(404).json({
          success: false,
          error: 'Imaging record not found'
        });
      }

      res.status(200).json({
        success: true,
        data: imaging
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });
};

// Delete imaging record
export const deleteImaging = async (req, res) => {
  try {
    const imaging = await Imaging.findByIdAndDelete(req.params.id);
    
    if (!imaging) {
      return res.status(404).json({
        success: false,
        error: 'Imaging record not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search imaging records
export const searchImaging = async (req, res) => {
  try {
    const { query, patientId } = req.query;
    
    const searchQuery = {
      patientId,
      $or: [
        { type: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { findings: { $regex: query, $options: 'i' } }
      ]
    };

    const imaging = await Imaging.find(searchQuery).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: imaging
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 