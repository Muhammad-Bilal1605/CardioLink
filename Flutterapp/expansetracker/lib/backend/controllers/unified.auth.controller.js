//Backend/controllers/unified.auth.controller.js - COMPLETE IMPLEMENTATION
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Patient } from '../models/patient.model.js';
import { AmbulanceEmployer } from '../models/ambulanceEmployer.model.js';

// ===============================================
// HELPER FUNCTIONS
// ===============================================

// Generate JWT Token
const generateToken = (userId, userType, email) => {
  return jwt.sign(
    {
      userId: userId.toString(),
      userType,
      email
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Hash Password
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Compare Password
const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// ===============================================
// PATIENT SIGNUP
// ===============================================
export const patientSignup = async (req, res) => {
  try {
    console.log('\n========== PATIENT SIGNUP ==========');
    console.log('📝 Signup request received');
    console.log('📊 Body:', JSON.stringify(req.body, null, 2));

    const {
      email,
      password,
      confirmPassword,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth,
      bloodType,
      allergies,
      emergencyContact
    } = req.body;

    // ============ VALIDATION ============
    if (!email || !password || !confirmPassword) {
      console.error('❌ Missing email, password, or confirmPassword');
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and confirmPassword'
      });
    }

    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (!name || !phoneNumber || !gender || !age) {
      console.error('❌ Missing required fields: name, phoneNumber, gender, age');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, phoneNumber, gender, age'
      });
    }

    // Check if patient already exists
    console.log('🔍 Checking if patient already exists...');
    let existingPatient = await Patient.findOne({ email: email.toLowerCase() });
    
    if (existingPatient) {
      console.error('❌ Patient already exists with email:', email);
      return res.status(409).json({
        success: false,
        message: 'Patient already exists with this email'
      });
    }

    // Check phone number uniqueness
    const existingPhone = await Patient.findOne({ phoneNumber });
    if (existingPhone) {
      console.error('❌ Phone number already registered:', phoneNumber);
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // ============ HASH PASSWORD ============
    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(password);

    // ============ CREATE PATIENT ============
    console.log('💾 Creating patient document...');
    const newPatient = new Patient({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      phoneNumber,
      gender,
      age,
      dateOfBirth: new Date(dateOfBirth),
      bloodType: bloodType || null,
      allergies: allergies || [],
      emergencyContact: emergencyContact || '',
      isVerified: false,
      isActive: true,
      lastLogin: new Date()
    });

    await newPatient.save();
    console.log('✅ Patient created successfully:', newPatient._id);

    // ============ GENERATE TOKEN ============
    console.log('🔑 Generating JWT token...');
    const token = generateToken(newPatient._id, 'patient', newPatient.email);

    // ============ RESPONSE ============
    console.log('✅ PATIENT SIGNUP SUCCESS');
    console.log('====================================\n');

    return res.status(201).json({
      success: true,
      message: 'Patient registered successfully',
      user: {
        id: newPatient._id.toString(),
        email: newPatient.email,
        name: newPatient.name,
        phoneNumber: newPatient.phoneNumber,
        gender: newPatient.gender,
        age: newPatient.age,
        userType: 'patient'
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('❌ PATIENT SIGNUP ERROR:', error.message);
    console.error('❌ Error details:', error);

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error registering patient',
      error: error.message
    });
  }
};

// ===============================================
// PATIENT LOGIN
// ===============================================
export const patientLogin = async (req, res) => {
  try {
    console.log('\n========== PATIENT LOGIN ==========');
    console.log('📝 Login request received');
    console.log('📧 Email:', req.body.email);

    const { email, password } = req.body;

    // ============ VALIDATION ============
    if (!email || !password) {
      console.error('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // ============ FIND PATIENT ============
    console.log('🔍 Searching for patient...');
    const patient = await Patient.findOne({ email: email.toLowerCase() });

    if (!patient) {
      console.error('❌ Patient not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ============ VERIFY PASSWORD ============
    console.log('🔐 Verifying password...');
    const isPasswordCorrect = await comparePassword(password, patient.password);

    if (!isPasswordCorrect) {
      console.error('❌ Incorrect password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ============ UPDATE LAST LOGIN ============
    console.log('⏰ Updating last login...');
    patient.lastLogin = new Date();
    await patient.save();

    // ============ GENERATE TOKEN ============
    console.log('🔑 Generating JWT token...');
    const token = generateToken(patient._id, 'patient', patient.email);

    // ============ RESPONSE ============
    console.log('✅ PATIENT LOGIN SUCCESS');
    console.log('   User ID:', patient._id.toString());
    console.log('   Email:', patient.email);
    console.log('====================================\n');

    return res.status(200).json({
      success: true,
      message: 'Patient logged in successfully',
      user: {
        id: patient._id.toString(),
        email: patient.email,
        name: patient.name,
        phoneNumber: patient.phoneNumber,
        gender: patient.gender,
        age: patient.age,
        userType: 'patient'
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('❌ PATIENT LOGIN ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// ===============================================
// AMBULANCE EMPLOYER SIGNUP
// ===============================================
export const ambulanceEmployerSignup = async (req, res) => {
  try {
    console.log('\n========== AMBULANCE EMPLOYER SIGNUP ==========');
    console.log('📝 Signup request received');
    console.log('📊 Body:', JSON.stringify(req.body, null, 2));

    const {
      email,
      password,
      confirmPassword,
      name,
      gender,
      phoneNumber,
      address,
      licenseNumber,
      vehicleType
    } = req.body;

    // ============ VALIDATION ============
    if (!email || !password || !confirmPassword) {
      console.error('❌ Missing email, password, or confirmPassword');
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and confirmPassword'
      });
    }

    if (password !== confirmPassword) {
      console.error('❌ Passwords do not match');
      return res.status(400).json({
        success: false,
        message: 'Passwords do not match'
      });
    }

    if (!name || !gender) {
      console.error('❌ Missing required fields: name, gender');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: name, gender'
      });
    }

    // Check if employer already exists
    console.log('🔍 Checking if employer already exists...');
    const existingEmployer = await AmbulanceEmployer.findOne({ 
      email: email.toLowerCase() 
    });
    
    if (existingEmployer) {
      console.error('❌ Employer already exists with email:', email);
      return res.status(409).json({
        success: false,
        message: 'Ambulance Employer already exists with this email'
      });
    }

    // ============ HASH PASSWORD ============
    console.log('🔐 Hashing password...');
    const hashedPassword = await hashPassword(password);

    // ============ CREATE EMPLOYER ============
    console.log('💾 Creating employer document...');
    const newEmployer = new AmbulanceEmployer({
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      gender,
      phoneNumber: phoneNumber || '',
      address: address || '',
      licenseNumber: licenseNumber || '',
      vehicleType: vehicleType || '',
      isVerified: false,
      isActive: true,
      lastLogin: new Date()
    });

    await newEmployer.save();
    console.log('✅ Employer created successfully:', newEmployer._id);

    // ============ GENERATE TOKEN ============
    console.log('🔑 Generating JWT token...');
    const token = generateToken(newEmployer._id, 'ambulance_employer', newEmployer.email);

    // ============ RESPONSE ============
    console.log('✅ AMBULANCE EMPLOYER SIGNUP SUCCESS');
    console.log('====================================\n');

    return res.status(201).json({
      success: true,
      message: 'Ambulance Employer registered successfully',
      user: {
        id: newEmployer._id.toString(),
        email: newEmployer.email,
        name: newEmployer.name,
        gender: newEmployer.gender,
        userType: 'ambulance_employer'
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('❌ AMBULANCE EMPLOYER SIGNUP ERROR:', error.message);

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: messages
      });
    }

    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(409).json({
        success: false,
        message: `${field} already exists`
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Error registering ambulance employer',
      error: error.message
    });
  }
};

// ===============================================
// AMBULANCE EMPLOYER LOGIN
// ===============================================
export const ambulanceEmployerLogin = async (req, res) => {
  try {
    console.log('\n========== AMBULANCE EMPLOYER LOGIN ==========');
    console.log('📝 Login request received');
    console.log('📧 Email:', req.body.email);

    const { email, password } = req.body;

    // ============ VALIDATION ============
    if (!email || !password) {
      console.error('❌ Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // ============ FIND EMPLOYER ============
    console.log('🔍 Searching for employer...');
    const employer = await AmbulanceEmployer.findOne({ 
      email: email.toLowerCase() 
    });

    if (!employer) {
      console.error('❌ Employer not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ============ VERIFY PASSWORD ============
    console.log('🔐 Verifying password...');
    const isPasswordCorrect = await comparePassword(password, employer.password);

    if (!isPasswordCorrect) {
      console.error('❌ Incorrect password');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // ============ UPDATE LAST LOGIN ============
    console.log('⏰ Updating last login...');
    employer.lastLogin = new Date();
    await employer.save();

    // ============ GENERATE TOKEN ============
    console.log('🔑 Generating JWT token...');
    const token = generateToken(employer._id, 'ambulance_employer', employer.email);

    // ============ RESPONSE ============
    console.log('✅ AMBULANCE EMPLOYER LOGIN SUCCESS');
    console.log('   User ID:', employer._id.toString());
    console.log('   Email:', employer.email);
    console.log('====================================\n');

    return res.status(200).json({
      success: true,
      message: 'Ambulance Employer logged in successfully',
      user: {
        id: employer._id.toString(),
        email: employer.email,
        name: employer.name,
        gender: employer.gender,
        userType: 'ambulance_employer'
      },
      token,
      expiresIn: '7d'
    });

  } catch (error) {
    console.error('❌ AMBULANCE EMPLOYER LOGIN ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// ===============================================
// UNIVERSAL LOGOUT
// ===============================================
export const universalLogout = async (req, res) => {
  try {
    console.log('\n========== LOGOUT ==========');
    console.log('👤 User logging out');

    // Token is typically cleared on client side, but we can verify it here
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided'
      });
    }

    console.log('✅ LOGOUT SUCCESS');
    console.log('=========================\n');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('❌ LOGOUT ERROR:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: error.message
    });
  }
};