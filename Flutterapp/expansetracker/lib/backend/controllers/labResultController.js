import LabResult from '../models/LabResult.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

// Configure multer for file uploads
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
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
  }
}).single('document');

// Helper: extract Cloudinary public_id from a secure URL
const extractCloudinaryPublicId = (secureUrl) => {
  try {
    const uploadIndex = secureUrl.indexOf('/upload/');
    if (uploadIndex === -1) return null;
    let tail = secureUrl.substring(uploadIndex + '/upload/'.length);
    if (tail.startsWith('v')) {
      const firstSlash = tail.indexOf('/');
      if (firstSlash !== -1) tail = tail.substring(firstSlash + 1);
    }
    const lastDot = tail.lastIndexOf('.');
    if (lastDot !== -1) tail = tail.substring(0, lastDot);
    return tail;
  } catch (_) {
    return null;
  }
};

// Get all lab results for a patient
export const getPatientLabResults = async (req, res) => {
  try {
    const labResults = await LabResult.find({ patientId: req.params.patientId })
      .sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: labResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get single lab result
export const getLabResultById = async (req, res) => {
  try {
    console.log('🔍 Lab result request for ID:', req.params.id);
    console.log('🔍 User ID from token:', req.userId);
    console.log('🔍 User object:', req.user);
    
    // Try to find user in both User and Patient models
    let user = await User.findById(req.userId);
    if (!user) {
      // If not found in User model, try Patient model
      const Patient = (await import('../models/User.js')).default;
      user = await Patient.findById(req.userId);
    }
    
    if (!user) {
      console.log('❌ User not found for ID:', req.userId);
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    console.log('✅ User found:', user.email || user.firstName + ' ' + user.lastName);

    const labResult = await LabResult.findById(req.params.id)
      .populate('patientId', 'name')
      .populate('hospitalId', 'name');
    
    console.log('🔍 Lab result found:', labResult ? 'Yes' : 'No');
    if (labResult) {
      console.log('🔍 Lab result ID:', labResult._id);
      console.log('🔍 Lab result patient:', labResult.patientId);
      console.log('🔍 Lab result hospital:', labResult.hospitalId);
    }
    
    if (!labResult) {
      console.log('❌ Lab result not found for ID:', req.params.id);
      return res.status(404).json({
        success: false,
        error: 'Lab result not found'
      });
    }

    // Enforce same-hospital access (only for regular users, not patients)
    if (user.hospitalId && labResult.hospitalId && labResult.hospitalId._id) {
      if (labResult.hospitalId._id.toString() !== user.hospitalId.toString()) {
        return res.status(403).json({ success: false, error: 'You are not authorized to view this lab result' });
      }
    }
    
    // For patients, check if they are the patient associated with this lab result
    if (user.firstName && user.lastName) { // This is a patient
      if (labResult.patientId && labResult.patientId._id.toString() !== user._id.toString()) {
        return res.status(403).json({ success: false, error: 'You are not authorized to view this lab result' });
      }
    }

    res.status(200).json({
      success: true,
      data: labResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all lab results for the authenticated user's hospital
export const getHospitalLabResults = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (!user.hospitalId) {
      return res.status(403).json({ success: false, error: 'User must be associated with a hospital' });
    }

    const labResults = await LabResult.find({ hospitalId: user.hospitalId }).sort({ date: -1 });
    await LabResult.populate(labResults, [
      { path: 'patientId', select: 'name' },
      { path: 'hospitalId', select: 'name' }
    ]);

    return res.status(200).json({ success: true, data: labResults });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// Create new lab result
export const createLabResult = async (req, res) => {
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
          error: 'User must be associated with a hospital to upload lab results'
        });
      }

      // Verify user role (typically lab technologists should upload lab results)
      if (!['lab-technologist', 'doctor', 'hospital-admin'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Only lab technologists, doctors, or hospital admins can upload lab results'
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

      // Upload file to Cloudinary if provided
      let reportUrl = undefined;
      if (req.file && req.file.path) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'cardiolink/labs'
        });
        reportUrl = uploaded.secure_url;
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }

      // Parse the results array from the request body
      let parsedResults = [];
      try {
        parsedResults = typeof req.body.results === 'string' ? JSON.parse(req.body.results) : (req.body.results || []);
      } catch (_) {
        parsedResults = [];
      }

      const labResultData = {
        ...req.body,
        uploadedBy: user._id,
        hospitalId: user.hospitalId,
        results: parsedResults,
        reportUrl
      };

      console.log('Creating lab result with data:', {
        patientId: labResultData.patientId,
        uploadedBy: labResultData.uploadedBy,
        hospitalId: labResultData.hospitalId,
        testName: labResultData.testName,
        userRole: user.role
      });

      const labResult = await LabResult.create(labResultData);
      
      res.status(201).json({
        success: true,
        data: labResult
      });
    } catch (error) {
      console.error('Error creating lab result:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });
};

// Update lab result
export const updateLabResult = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      if (!user.hospitalId) {
        return res.status(403).json({ success: false, error: 'User must be associated with a hospital to update lab results' });
      }
      if (!['lab-technologist', 'doctor', 'hospital-admin'].includes(user.role)) {
        return res.status(403).json({ success: false, error: 'Only lab technologists, doctors, or hospital admins can update lab results' });
      }

      const existing = await LabResult.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, error: 'Lab result not found' });
      }
      if (existing.hospitalId.toString() !== user.hospitalId.toString()) {
        return res.status(403).json({ success: false, error: 'You are not authorized to update this lab result' });
      }

      const updateData = { ...req.body };

      // If a new file is uploaded, push to Cloudinary and delete old asset
      if (req.file && req.file.path) {
        const uploaded = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'cardiolink/labs'
        });
        updateData.reportUrl = uploaded.secure_url;
        try { fs.unlinkSync(req.file.path); } catch (_) {}

        const oldPublicId = extractCloudinaryPublicId(existing.reportUrl || '');
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
          } catch (e) {
            try { await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' }); } catch (_) {}
            try { await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }); } catch (_) {}
          }
        }
      }

      const labResult = await LabResult.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      res.status(200).json({ success: true, data: labResult });
    } catch (error) {
      res.status(400).json({ success: false, error: error.message });
    }
  });
};

// Delete lab result
export const deleteLabResult = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const existing = await LabResult.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Lab result not found' });
    }
    if (existing.hospitalId.toString() !== user.hospitalId?.toString()) {
      return res.status(403).json({ success: false, error: 'You are not authorized to delete this lab result' });
    }

    // Attempt to delete Cloudinary asset first
    const publicId = extractCloudinaryPublicId(existing.reportUrl || '');
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
      } catch (e) {
        try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (_) {}
        try { await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }); } catch (_) {}
      }
    }

    await LabResult.findByIdAndDelete(req.params.id);

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

// Search lab results
export const searchLabResults = async (req, res) => {
  try {
    const { query, patientId } = req.query;
    
    const searchQuery = {
      patientId,
      $or: [
        { testName: { $regex: query, $options: 'i' } },
        { testType: { $regex: query, $options: 'i' } },
        { 'results.parameter': { $regex: query, $options: 'i' } }
      ]
    };

    const labResults = await LabResult.find(searchQuery).sort({ date: -1 });
    
    res.status(200).json({
      success: true,
      data: labResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 