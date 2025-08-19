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

// Get all patients with pagination and filtering
export const getAllPatients = async (req, res) => {
  try {
    console.log('Fetching all patients...');
    
    // Get pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Get filter parameters
    const { search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // Build query
    const query = { isActive: { $ne: false } };
    
    // Add search filter if provided
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }

    // Get sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute queries in parallel
    const [patients, total] = await Promise.all([
      Patient.find(query)
        .select('-__v -password')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Patient.countDocuments(query)
    ]);

    // Calculate pagination metadata
    const pages = Math.ceil(total / limit);
    const hasNext = page < pages;
    const hasPrev = page > 1;

    // Format response
    const response = {
      success: true,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNext,
        hasPrev
      },
      data: patients
    };

    console.log(`Successfully fetched ${patients.length} of ${total} patients`);
    return res.status(200).json(response);
    
  } catch (error) {
    console.error('Error in getAllPatients:', {
      message: error.message,
      stack: error.stack,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch patients',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};