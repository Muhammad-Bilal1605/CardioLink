import Imaging from '../models/Imaging.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

// Configure multer for file upload (temporary local storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Allow common images, pdf, and other files; Cloudinary will validate
const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic',
      'application/pdf',
      'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    // Fallback: allow if extension suggests common types
    if (file.originalname.match(/\.(jpg|jpeg|png|gif|webp|heic|pdf|mp4|mov|avi)$/i)) return cb(null, true);
    return cb(new Error('Unsupported file type'), false);
  }
}).single('image');

// Helper: extract Cloudinary public_id from a secure URL
const extractCloudinaryPublicId = (secureUrl) => {
  try {
    // Example: https://res.cloudinary.com/<cloud>/image/upload/v1699999999/folder/name.ext
    const uploadIndex = secureUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let tail = secureUrl.substring(uploadIndex + '/upload/'.length);
    // Remove version segment if present (e.g., v123456789/)
    if (tail.startsWith('v')) {
      const firstSlash = tail.indexOf('/');
      if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
    }
    // Remove extension
    const lastDot = tail.lastIndexOf('.');
    if (lastDot !== -1) tail = tail.substring(0, lastDot);
    return tail; // this is public_id (may include folders)
  } catch (_) {
    return null;
  }
};

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
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const imaging = await Imaging.findById(req.params.id)
      .populate('patientId', 'name')
      .populate('hospitalId', 'name');
    
    if (!imaging) {
      return res.status(404).json({
        success: false,
        error: 'Imaging record not found'
      });
    }

    // Enforce same-hospital access
    if (user.hospitalId && imaging.hospitalId && imaging.hospitalId._id) {
      if (imaging.hospitalId._id.toString() !== user.hospitalId.toString()) {
        return res.status(403).json({ success: false, error: 'You are not authorized to view this imaging record' });
      }
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

// Get all imaging records for the authenticated user's hospital
export const getHospitalImagings = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.hospitalId) {
      return res.status(403).json({ success: false, error: 'User must be associated with a hospital' });
    }

    const imagings = await Imaging.find({ hospitalId: user.hospitalId }).sort({ date: -1 });
      
    // Populate names for UI
    await Imaging.populate(imagings, [
      { path: 'patientId', select: 'name' },
      { path: 'hospitalId', select: 'name' }
    ]);

    return res.status(200).json({ success: true, data: imagings });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
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

      // If a file was uploaded, send to Cloudinary
      let secureUrl = req.body.imageUrl || '';
      if (req.file && req.file.path) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'cardiolink/imaging'
        });
        secureUrl = uploaded.secure_url;
        // Clean up temp file
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }

      // Create imaging record with Cloudinary URL and auto-populated fields
      const imagingData = {
        ...req.body,
        uploadedBy: user._id,
        hospitalId: user.hospitalId,
        imageUrl: secureUrl
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
      // Ensure user exists and is scoped to a hospital
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      if (!user.hospitalId) {
        return res.status(403).json({ success: false, error: 'User must be associated with a hospital to update imaging records' });
      }
      if (!['radiologist', 'doctor', 'hospital-admin'].includes(user.role)) {
        return res.status(403).json({ success: false, error: 'Only radiologists, doctors, or hospital admins can update imaging records' });
      }

      // Fetch imaging and verify same-hospital ownership before updating
      const existing = await Imaging.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Imaging record not found' });
      }
      if (existing.hospitalId.toString() !== user.hospitalId.toString()) {
        return res.status(403).json({ success: false, error: 'You are not authorized to update this imaging record' });
      }

      const updateData = {
        ...req.body
      };

      // If a new file is uploaded, upload to Cloudinary and schedule old asset deletion
      if (req.file && req.file.path) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'cardiolink/imaging'
        });
        updateData.imageUrl = uploaded.secure_url;
        try { fs.unlinkSync(req.file.path); } catch (_) {}

        // Delete old asset from Cloudinary if previous URL exists
        const oldPublicId = extractCloudinaryPublicId(existing.imageUrl || '');
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
          } catch (e) {
            // Try other resource types as fallback (for non-images)
            try { await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' }); } catch (_) {}
            try { await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }); } catch (_) {}
          }
        }
      }

      const imaging = await Imaging.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

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
    const imaging = await Imaging.findById(req.params.id);
    
    if (!imaging) {
      return res.status(404).json({
        success: false,
        error: 'Imaging record not found'
      });
    }

    // Attempt to delete Cloudinary asset
    const publicId = extractCloudinaryPublicId(imaging.imageUrl || '');
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (e) {
        try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (_) {}
        try { await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }); } catch (_) {}
      }
    }

    await Imaging.findByIdAndDelete(req.params.id);

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