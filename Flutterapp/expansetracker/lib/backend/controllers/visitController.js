import Visit from '../models/Visit.js';
import Patient from '../models/User.js';
import { User } from '../models/user.model.js';
import Medication from '../models/Medication.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    const filetypes = /jpeg|jpg|png|pdf|doc|docx/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only .png, .jpg, .jpeg, .pdf, .doc, and .docx files are allowed!'));
  }
}).fields([
  { name: 'documents', maxCount: 5 },
  { name: 'images', maxCount: 5 }
]);

// Middleware to handle file uploads
export const uploadFiles = upload;

// Create new visit
export const createVisit = async (req, res) => {
  try {
    console.log('Received request body:', req.body);
    console.log('Received files:', req.files);
    console.log('User ID from token:', req.userId);

    // Get the authenticated user information
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify user has a hospital ID (required for uploading medical records)
    if (!user.hospitalId) {
      return res.status(403).json({
        success: false,
        error: 'User must be associated with a hospital to upload medical records'
      });
    }

    // Extract and validate required fields
    const patientId = req.body.patientId;
    const date = req.body.date;
    const type = req.body.type;
    const provider = req.body.provider;
    const reason = req.body.reason;

    // Log each field for debugging
    console.log('Extracted fields:', {
      patientId,
      date,
      type,
      provider,
      reason,
      uploadedBy: user._id,
      hospitalId: user.hospitalId
    });

    // Validate required fields
    if (!patientId) {
      console.log('Missing required fields:', { patientId, date, type, provider, reason });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, date, type, provider, and reason are required'
      });
    }
    if (!date || !type || !provider || !reason) {
      console.log('Missing required fields:', { patientId, date, type, provider, reason });
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: date, type, provider, and reason are required'
      });
    }

    // Validate date format
    const visitDate = new Date(date);
    if (isNaN(visitDate.getTime())) {
      console.log('Invalid date:', date);
      return res.status(400).json({
        success: false,
        error: 'Invalid date format'
      });
    }

    // Handle file uploads
    const documents = req.files?.documents ? req.files.documents.map(file => file.path) : [];
    const images = req.files?.images ? req.files.images.map(file => file.path) : [];

    // Parse prescribedMedicines if it's a string (from FormData)
    let parsedPrescribedMedicines = [];
    if (req.body.prescribedMedicines) {
      try {
        parsedPrescribedMedicines = typeof req.body.prescribedMedicines === 'string' 
          ? JSON.parse(req.body.prescribedMedicines) 
          : req.body.prescribedMedicines;
        
        // Validate each medication
        parsedPrescribedMedicines = parsedPrescribedMedicines.map(med => ({
          ...med,
          startDate: new Date(med.startDate),
          endDate: med.endDate ? new Date(med.endDate) : undefined
        }));
      } catch (error) {
        console.error('Error parsing prescribedMedicines:', error);
        parsedPrescribedMedicines = [];
      }
    }

    // Create medications in the Medication collection
    const createdMedications = [];
    if (parsedPrescribedMedicines.length > 0) {
      for (const med of parsedPrescribedMedicines) {
        const medication = new Medication({
          patientId,
          name: med.name,
          dosage: med.dosage,
          frequency: med.frequency,
          startDate: med.startDate,
          endDate: med.endDate,
          prescribedBy: med.prescribedBy,
          reason: med.reason,
          status: med.status,
          sideEffects: med.sideEffects,
          notes: med.notes,
          uploadedBy: user._id,  // Auto-populate uploadedBy
          hospitalId: user.hospitalId  // Auto-populate hospitalId
        });
        await medication.save();
        createdMedications.push(medication);
      }
    }

    // Handle associatedLabResults and associatedImaging
    let labResults = [];
    if (req.body.associatedLabResults) {
      // If it's a single value, convert to array
      if (!Array.isArray(req.body.associatedLabResults)) {
        labResults = [req.body.associatedLabResults];
      } else {
        labResults = req.body.associatedLabResults;
      }
    }

    let imaging = [];
    if (req.body.associatedImaging) {
      // If it's a single value, convert to array
      if (!Array.isArray(req.body.associatedImaging)) {
        imaging = [req.body.associatedImaging];
      } else {
        imaging = req.body.associatedImaging;
      }
    }

    const visitData = {
      patientId,
      hospitalId: user.hospitalId,  // Auto-populate from authenticated user
      uploadedBy: user._id,         // Auto-populate from authenticated user
      date: visitDate,
      type,
      provider,
      reason,
      diagnosis: req.body.diagnosis,
      treatment: req.body.treatment,
      followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined,
      status: req.body.status || 'scheduled',
      documents,
      images,
      associatedLabResults: labResults,
      associatedImaging: imaging,
      prescribedMedicines: parsedPrescribedMedicines
    };

    console.log('Creating visit with data:', visitData);

    const visit = new Visit(visitData);
    await visit.save();

    res.status(201).json({
      success: true,
      data: {
        visit,
        medications: createdMedications
      }
    });
  } catch (error) {
    console.error('Detailed error in createVisit:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Update visit
export const updateVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);
    
    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    // Handle file uploads
    const documents = req.files?.documents ? req.files.documents.map(file => file.path) : visit.documents;
    const images = req.files?.images ? req.files.images.map(file => file.path) : visit.images;

    // Parse prescribedMedicines if it's a string (from FormData)
    let parsedPrescribedMedicines = visit.prescribedMedicines;
    if (req.body.prescribedMedicines) {
      try {
        parsedPrescribedMedicines = typeof req.body.prescribedMedicines === 'string' 
          ? JSON.parse(req.body.prescribedMedicines) 
          : req.body.prescribedMedicines;
        
        // Validate each medication
        parsedPrescribedMedicines = parsedPrescribedMedicines.map(med => ({
          ...med,
          startDate: new Date(med.startDate),
          endDate: med.endDate ? new Date(med.endDate) : undefined
        }));
      } catch (error) {
        console.error('Error parsing prescribedMedicines:', error);
      }
    }

    // Update medications in the Medication collection
    if (parsedPrescribedMedicines.length > 0) {
      for (const med of parsedPrescribedMedicines) {
        if (med._id) {
          await Medication.findByIdAndUpdate(med._id, med);
        } else {
          const medication = new Medication({
            patientId: visit.patientId,
            ...med
          });
          await medication.save();
        }
      }
    }

    const updatedVisit = await Visit.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        documents,
        images,
        prescribedMedicines: parsedPrescribedMedicines
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: updatedVisit
    });
  } catch (error) {
    console.error('Error in updateVisit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get all visits for a patient
export const getPatientVisits = async (req, res) => {
  try {
    const visits = await Visit.find({ patientId: req.params.patientId })
      .populate('associatedLabResults')
      .populate('associatedImaging')
      .sort({ date: -1 });

    res.status(200).json({
      success: true,
      data: visits
    });
  } catch (error) {
    console.error('Error in getPatientVisits:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get a single visit
export const getVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id)
      .populate('associatedLabResults')
      .populate('associatedImaging');

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    res.status(200).json({
      success: true,
      data: visit
    });
  } catch (error) {
    console.error('Error in getVisit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Delete a visit
export const deleteVisit = async (req, res) => {
  try {
    const visit = await Visit.findById(req.params.id);

    if (!visit) {
      return res.status(404).json({
        success: false,
        error: 'Visit not found'
      });
    }

    // Delete associated medications
    if (visit.prescribedMedicines && visit.prescribedMedicines.length > 0) {
      for (const med of visit.prescribedMedicines) {
        if (med._id) {
          await Medication.findByIdAndDelete(med._id);
        }
      }
    }

    await visit.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error in deleteVisit:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};