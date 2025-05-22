import LabResult from '../models/LabResult.js';
import Patient from '../models/User.js';
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
}).single('document');

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
    const labResult = await LabResult.findById(req.params.id);
    
    if (!labResult) {
      return res.status(404).json({
        success: false,
        error: 'Lab result not found'
      });
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
      // Check if patient exists
      const patient = await Patient.findById(req.body.patientId);
      if (!patient) {
        return res.status(404).json({
          success: false,
          error: 'Patient not found'
        });
      }

      // Parse the results array from the request body
      const labResultData = {
        ...req.body,
        results: JSON.parse(req.body.results),
        reportUrl: req.file ? `/uploads/${req.file.filename}` : undefined
      };

      const labResult = await LabResult.create(labResultData);
      
      res.status(201).json({
        success: true,
        data: labResult
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  });
};

// Update lab result
export const updateLabResult = async (req, res) => {
  try {
    const labResult = await LabResult.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    if (!labResult) {
      return res.status(404).json({
        success: false,
        error: 'Lab result not found'
      });
    }

    res.status(200).json({
      success: true,
      data: labResult
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete lab result
export const deleteLabResult = async (req, res) => {
  try {
    const labResult = await LabResult.findByIdAndDelete(req.params.id);
    
    if (!labResult) {
      return res.status(404).json({
        success: false,
        error: 'Lab result not found'
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