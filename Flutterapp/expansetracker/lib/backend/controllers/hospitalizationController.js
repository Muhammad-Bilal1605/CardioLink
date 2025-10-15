import Hospitalization from '../models/Hospitalization.js';
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
}).fields([
  { name: 'dischargeReport', maxCount: 1 },
  { name: 'additionalDocuments', maxCount: 5 }
]);

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

// Create new hospitalization
export const createHospitalization = async (req, res) => {
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
          error: 'User must be associated with a hospital to upload hospitalization records'
        });
      }

      // Verify user role (doctors, hospital admins, or front desk can upload hospitalizations)
      if (!['doctor', 'hospital-admin', 'hospital-front-desk'].includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Only doctors, hospital admins, or front desk staff can upload hospitalization records'
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

      // Upload files to Cloudinary
      let dischargeReportUrl = undefined;
      let additionalDocuments = [];

      if (req.files?.dischargeReport?.[0]) {
        const file = req.files.dischargeReport[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/hospitalizations/discharge'
          });
          dischargeReportUrl = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      if (req.files?.additionalDocuments) {
        const docUploads = await Promise.all(
          req.files.additionalDocuments.map(async (file) => {
            try {
              const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: 'cardiolink/hospitalizations/documents'
              });
              return {
                name: file.originalname,
                url: result.secure_url,
                type: file.mimetype,
                uploadedAt: new Date()
              };
            } finally {
              try { fs.unlinkSync(file.path); } catch (_) {}
            }
          })
        );
        additionalDocuments = docUploads.filter(Boolean);
      }

      // Parse arrays from request body
      const hospitalizationData = {
        ...req.body,
        uploadedBy: user._id,
        hospitalId: user.hospitalId,
        proceduresDone: JSON.parse(req.body.proceduresDone),
        associatedLabResults: req.body.associatedLabResults ? JSON.parse(req.body.associatedLabResults) : [],
        associatedImaging: req.body.associatedImaging ? JSON.parse(req.body.associatedImaging) : [],
        associatedProcedures: req.body.associatedProcedures ? JSON.parse(req.body.associatedProcedures) : [],
        dischargeReportUrl,
        additionalDocuments
      };

      console.log('Creating hospitalization record with data:', {
        patientId: hospitalizationData.patientId,
        uploadedBy: hospitalizationData.uploadedBy,
        hospitalId: hospitalizationData.hospitalId,
        hospital: hospitalizationData.hospital,
        userRole: user.role
      });

      const hospitalization = await Hospitalization.create(hospitalizationData);
      
      res.status(201).json({
        success: true,
        data: hospitalization
      });
    } catch (error) {
      console.error('Error creating hospitalization record:', error);
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });
};

// Get all hospitalizations for a patient
export const getPatientHospitalizations = async (req, res) => {
  try {
    const hospitalizations = await Hospitalization.find({ patientId: req.params.patientId })
      .sort({ date: -1 });
    res.status(200).json({ success: true, data: hospitalizations });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Get a single hospitalization
export const getHospitalization = async (req, res) => {
  try {
    const hospitalization = await Hospitalization.findById(req.params.id);
    if (!hospitalization) {
      return res.status(404).json({ success: false, message: 'Hospitalization not found' });
    }
    res.status(200).json({ success: true, data: hospitalization });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Update a hospitalization
export const updateHospitalization = async (req, res) => {
  upload(req, res, async function(err) {
    if (err) {
      return res.status(400).json({ success: false, error: err.message });
    }

    try {
      // Fetch existing to enforce ownership
      const existing = await Hospitalization.findById(req.params.id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Hospitalization not found' });
      }

      const currentUser = await User.findById(req.userId);
      if (!currentUser) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      if (currentUser.role === 'hospital-front-desk') {
        const sameHospital = String(existing.hospitalId) === String(currentUser.hospitalId);
        const isUploader = String(existing.uploadedBy) === String(currentUser._id);
        if (!sameHospital || !isUploader) {
          return res.status(403).json({ success: false, message: 'Front desk can only update their own uploads' });
        }
      }

      const updateData = { ...req.body };

      // Handle new file uploads to Cloudinary
      if (req.files?.dischargeReport?.[0]) {
        const file = req.files.dischargeReport[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/hospitalizations/discharge'
          });
          updateData.dischargeReportUrl = result.secure_url;
          try { fs.unlinkSync(file.path); } catch (_) {}

          // Delete old discharge report from Cloudinary
          const oldPublicId = extractCloudinaryPublicId(existing.dischargeReportUrl || '');
          if (oldPublicId) {
            try {
              await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'image' });
            } catch (e) {
              try { await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'video' }); } catch (_) {}
              try { await cloudinary.uploader.destroy(oldPublicId, { resource_type: 'raw' }); } catch (_) {}
            }
          }
        } catch (uploadError) {
          console.error('Error uploading discharge report:', uploadError);
        }
      }

      if (req.files?.additionalDocuments && req.files.additionalDocuments.length > 0) {
        const newDocUploads = await Promise.all(
          req.files.additionalDocuments.map(async (file) => {
            try {
              const result = await cloudinary.uploader.upload(file.path, {
                resource_type: 'auto',
                folder: 'cardiolink/hospitalizations/documents'
              });
              return {
                name: file.originalname,
                url: result.secure_url,
                type: file.mimetype,
                uploadedAt: new Date()
              };
            } finally {
              try { fs.unlinkSync(file.path); } catch (_) {}
            }
          })
        );
        const existingDocs = existing.additionalDocuments || [];
        updateData.additionalDocuments = [...existingDocs, ...newDocUploads.filter(Boolean)];
      }

      const hospitalization = await Hospitalization.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!hospitalization) {
        return res.status(404).json({ success: false, message: 'Hospitalization not found' });
      }

      res.status(200).json({ success: true, data: hospitalization });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  });
};

// List hospitalizations for the authenticated user's hospital
export const getHospitalHospitalizations = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.hospitalId) return res.status(403).json({ success: false, message: 'User not associated with a hospital' });
    const items = await Hospitalization.find({ hospitalId: user.hospitalId }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete a hospitalization
export const deleteHospitalization = async (req, res) => {
  try {
    const hospitalization = await Hospitalization.findById(req.params.id);
    if (!hospitalization) {
      return res.status(404).json({ success: false, message: 'Hospitalization not found' });
    }

    // Delete Cloudinary assets
    const urls = [
      hospitalization.dischargeReportUrl,
      ...(hospitalization.additionalDocuments || []).map(doc => doc.url)
    ].filter(Boolean);

    for (const url of urls) {
      const publicId = extractCloudinaryPublicId(url);
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
        } catch (e1) {
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }); } catch (e2) {}
          try { await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' }); } catch (e3) {}
        }
      }
    }

    await Hospitalization.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 