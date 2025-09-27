import Patient from '../models/User.js';
import Imaging from '../models/Imaging.js';
import LabResult from '../models/LabResult.js';

// Check if email already exists
export const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    const existingPatient = await Patient.findOne({ email: email.toLowerCase() });
    
    res.status(200).json({
      success: true,
      exists: !!existingPatient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Search patients
export const searchPatients = async (req, res) => {
  try {
    const { query } = req.query;
    const patients = await Patient.find({
      $or: [
        { firstName: { $regex: query, $options: 'i' } },
        { lastName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ]
    }).select('-__v -password');
    
    res.status(200).json({
      success: true,
      data: patients
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Get patient by ID
export const getPatientById = async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id).select('-__v -password');
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Create new patient
export const createPatient = async (req, res) => {
  try {
    // Check if email already exists
    const existingPatient = await Patient.findOne({ email: req.body.email?.toLowerCase() });
    if (existingPatient) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered'
      });
    }

    // Convert email to lowercase for consistency
    const patientData = {
      ...req.body,
      email: req.body.email?.toLowerCase()
    };

    const patient = await Patient.create(patientData);
    
    // Remove password from response
    const patientResponse = patient.toObject();
    delete patientResponse.password;
    
    res.status(201).json({
      success: true,
      data: patientResponse
    });
  } catch (error) {
    // Handle validation errors more specifically
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        error: `Validation failed: ${validationErrors.join(', ')}`
      });
    }
    
    // Handle duplicate key errors (if email has unique index)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: 'Email is already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Update patient
export const updatePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).select('-__v -password');

    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    res.status(200).json({
      success: true,
      data: patient
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// Delete patient
export const deletePatient = async (req, res) => {
  try {
    const patient = await Patient.findByIdAndDelete(req.params.id);
    
    if (!patient) {
      return res.status(404).json({
        success: false,
        error: 'Patient not found'
      });
    }

    // Delete associated imaging and lab results
    await Imaging.deleteMany({ patientId: req.params.id });
    await LabResult.deleteMany({ patientId: req.params.id });

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

// Get patient's medical records (imaging and lab results)
export const getPatientRecords = async (req, res) => {
  try {
    const patientId = req.params.id;
    
    const [imaging, labResults] = await Promise.all([
      Imaging.find({ patientId }).sort({ date: -1 }),
      LabResult.find({ patientId }).sort({ date: -1 })
    ]);

    res.status(200).json({
      success: true,
      data: {
        imaging,
        labResults
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}; 