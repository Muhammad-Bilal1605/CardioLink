import Patient from '../models/User.js';
import Imaging from '../models/Imaging.js';
import LabResult from '../models/LabResult.js';

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
    const patient = await Patient.create(req.body);
    res.status(201).json({
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