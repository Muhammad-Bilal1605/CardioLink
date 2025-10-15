import Procedure from '../models/Procedure.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

// Multer configuration with simplified error handling
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Simple multer setup that accepts common file types
const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit to allow PDFs/videos if needed
}).fields([
  { name: 'documents', maxCount: 10 },
  { name: 'images', maxCount: 10 }
]);

// Export the upload middleware
export const uploadFiles = upload;

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

    // Create arrays for documents and images urls (Cloudinary)
      let documents = [];
      let images = [];

      // Upload document files to Cloudinary (raw resource_type)
      if (req.files && req.files.documents) {
        const uploads = await Promise.all(
          req.files.documents.map(async (file) => {
            try {
              const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: 'cardiolink/procedures/documents'
              });
              return result.secure_url;
            } finally {
              try { fs.unlinkSync(file.path); } catch (_) {}
            }
          })
        );
        documents = uploads.filter(Boolean);
      }
      
      // Upload image files to Cloudinary
      if (req.files && req.files.images) {
        const uploads = await Promise.all(
          req.files.images.map(async (file) => {
            try {
              const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: 'cardiolink/procedures/images'
              });
              return result.secure_url;
            } finally {
              try { fs.unlinkSync(file.path); } catch (_) {}
            }
          })
        );
        images = uploads.filter(Boolean);
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

      // Enforce front-desk ownership: front-desk can only update what they uploaded within their hospital
      const currentUser = await User.findById(req.userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (currentUser.role === 'hospital-front-desk') {
        const sameHospital = String(existingProcedure.hospitalId) === String(currentUser.hospitalId);
        const isUploader = String(existingProcedure.uploadedBy) === String(currentUser._id);
        if (!sameHospital || !isUploader) {
          return res.status(403).json({ success: false, message: 'Front desk can only update their own uploads' });
        }
      }
      
      // Build update data from text fields
      const updateData = { ...req.body };
      
      // Process new files if any (upload to Cloudinary and append)
      if (req.files) {
        // For documents
        if (req.files.documents && req.files.documents.length > 0) {
          const newDocuments = await Promise.all(
            req.files.documents.map(async (file) => {
              try {
                const result = await cloudinary.uploader.upload(file.path, {
                  resource_type: 'auto',
                  folder: 'cardiolink/procedures/documents'
                });
                return result.secure_url;
              } finally {
                try { fs.unlinkSync(file.path); } catch (_) {}
              }
            })
          );
          const existingDocs = existingProcedure.documents || [];
          updateData.documents = [...existingDocs, ...newDocuments.filter(Boolean)];
        }
        
        // For images
        if (req.files.images && req.files.images.length > 0) {
          const newImages = await Promise.all(
            req.files.images.map(async (file) => {
              try {
                const result = await cloudinary.uploader.upload(file.path, {
                  resource_type: 'auto',
                  folder: 'cardiolink/procedures/images'
                });
                return result.secure_url;
              } finally {
                try { fs.unlinkSync(file.path); } catch (_) {}
              }
            })
          );
          const existingImages = existingProcedure.images || [];
          updateData.images = [...existingImages, ...newImages.filter(Boolean)];
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

// List procedures for the authenticated user's hospital
export const getHospitalProcedures = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.hospitalId) return res.status(403).json({ success: false, message: 'User not associated with a hospital' });
    const procedures = await Procedure.find({ hospitalId: user.hospitalId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: procedures });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a procedure
export const deleteProcedure = async (req, res) => {
  try {
    const procedure = await Procedure.findById(req.params.id);
    if (!procedure) {
      return res.status(404).json({ success: false, message: 'Procedure not found' });
    }

    // Attempt to delete all Cloudinary assets referenced
    const urls = [
      ...(procedure.documents || []),
      ...(procedure.images || [])
    ];
    for (const url of urls) {
      const publicId = extractCloudinaryPublicId(url || '');
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (e1) {
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (e2) {}
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }); } catch (e3) {}
        }
      }
    }

    await Procedure.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};