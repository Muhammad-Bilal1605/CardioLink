import Hospitalization from '../models/Hospitalization.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import multer from 'multer';
import path from 'path';

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

      // Parse arrays from request body
      const hospitalizationData = {
        ...req.body,
        uploadedBy: user._id,        // Auto-populate from authenticated user
        hospitalId: user.hospitalId, // Auto-populate from authenticated user
        proceduresDone: JSON.parse(req.body.proceduresDone),
        associatedLabResults: req.body.associatedLabResults ? JSON.parse(req.body.associatedLabResults) : [],
        associatedImaging: req.body.associatedImaging ? JSON.parse(req.body.associatedImaging) : [],
        associatedProcedures: req.body.associatedProcedures ? JSON.parse(req.body.associatedProcedures) : [],
        dischargeReportUrl: req.files?.dischargeReport?.[0] ? `/uploads/${req.files.dischargeReport[0].filename}` : undefined,
        additionalDocuments: req.files?.additionalDocuments?.map(file => ({
          name: file.originalname,
          url: `/uploads/${file.filename}`,
          type: file.mimetype,
          uploadedAt: new Date()
        })) || []
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
  try {
    const hospitalization = await Hospitalization.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!hospitalization) {
      return res.status(404).json({ success: false, message: 'Hospitalization not found' });
    }

    res.status(200).json({ success: true, data: hospitalization });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// Delete a hospitalization
export const deleteHospitalization = async (req, res) => {
  try {
    const hospitalization = await Hospitalization.findByIdAndDelete(req.params.id);
    if (!hospitalization) {
      return res.status(404).json({ success: false, message: 'Hospitalization not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}; 