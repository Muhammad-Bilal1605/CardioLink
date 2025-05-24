import Hospital from '../models/Hospital.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for hospital document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/hospitals');
    console.log('Multer destination - uploadPath:', uploadPath);
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Created hospitals directory:', uploadPath);
      } catch (error) {
        console.error('Error creating hospitals directory:', error);
        return cb(error);
      }
    } else {
      console.log('Hospitals directory already exists:', uploadPath);
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp and original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${file.fieldname}-${uniqueSuffix}${ext}`;
    console.log('Multer filename - generated:', filename, 'for field:', file.fieldname);
    cb(null, filename);
  }
});

const fileFilter = (req, file, cb) => {
  console.log('File filter - checking file:', file.originalname, 'mimetype:', file.mimetype);
  // Allow only specific file types
  const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    console.log('File filter - ACCEPTED:', file.originalname);
    return cb(null, true);
  } else {
    console.log('File filter - REJECTED:', file.originalname);
    cb(new Error('Only .jpeg, .jpg, .png, .pdf, .doc and .docx files are allowed!'));
  }
};

// Configure multer with file size limit
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: fileFilter
}).fields([
  { name: 'hospitalRegistrationCertificate', maxCount: 1 },
  { name: 'healthDepartmentLicense', maxCount: 1 },
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'practitionersList', maxCount: 1 },
  { name: 'labCertification', maxCount: 1 },
  { name: 'ambulanceRegistration', maxCount: 1 },
  { name: 'accreditationCertificates', maxCount: 5 },
  { name: 'taxRegistration', maxCount: 1 },
  { name: 'dataPrivacyPolicy', maxCount: 1 },
  { name: 'adminIdProof', maxCount: 1 }
]);

// Middleware to handle file uploads
export const uploadHospitalFiles = upload;

// Helper function to parse dot notation from FormData into nested objects
const parseDotNotation = (obj) => {
  const result = {};
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      if (key.includes('.')) {
        const keys = key.split('.');
        let current = result;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = obj[key];
      } else {
        result[key] = obj[key];
      }
    }
  }
  
  return result;
};

// Create a new hospital
export const createHospital = async (req, res) => {
  try {
    console.log('=== Creating Hospital ===');
    console.log('Request files:', req.files);
    console.log('Request body keys:', Object.keys(req.body));
    
    // Parse dot notation from FormData into nested objects
    const hospitalData = parseDotNotation(req.body);
    
    // Handle uploaded files
    if (req.files) {
      console.log('Processing uploaded files...');
      const documents = {};
      
      // Process each uploaded document
      Object.keys(req.files).forEach(fieldName => {
        const files = req.files[fieldName];
        console.log(`Processing field: ${fieldName}, files:`, files.map(f => ({ 
          filename: f.filename, 
          originalname: f.originalname, 
          path: f.path,
          size: f.size 
        })));
        
        if (fieldName === 'accreditationCertificates') {
          // Handle multiple accreditation certificates
          documents.accreditationCertificates = files.map(file => {
            console.log('Saving accreditation certificate URL:', `/uploads/hospitals/${file.filename}`);
            return {
              type: req.body.accreditationType || 'Other',
              url: `/uploads/hospitals/${file.filename}`,
              certificateNumber: req.body.accreditationNumber || '',
              issuedBy: req.body.accreditationIssuedBy || '',
              expiryDate: req.body.accreditationExpiryDate || null,
              uploadDate: new Date()
            };
          });
        } else if (fieldName === 'adminIdProof') {
          // Handle admin ID proof - ensure nested structure exists
          if (!hospitalData.administrativeContact) {
            hospitalData.administrativeContact = {};
          }
          if (!hospitalData.administrativeContact.idProof) {
            hospitalData.administrativeContact.idProof = {};
          }
          const documentUrl = `/uploads/hospitals/${files[0].filename}`;
          console.log('Saving admin ID proof URL:', documentUrl);
          hospitalData.administrativeContact.idProof.documentUrl = documentUrl;
        } else {
          // Handle other single documents
          const file = files[0];
          const documentUrl = `/uploads/hospitals/${file.filename}`;
          console.log(`Saving ${fieldName} URL:`, documentUrl);
          console.log('File path on disk:', file.path);
          
          // Verify file exists on disk
          if (fs.existsSync(file.path)) {
            console.log('✓ File exists on disk:', file.path);
          } else {
            console.error('✗ File NOT found on disk:', file.path);
          }
          
          documents[fieldName] = {
            url: documentUrl,
            uploadDate: new Date()
          };
          
          // Add additional fields based on document type
          if (fieldName === 'healthDepartmentLicense') {
            documents[fieldName].licenseNumber = req.body.healthLicenseNumber || '';
            documents[fieldName].expiryDate = req.body.healthLicenseExpiryDate || null;
          } else if (fieldName === 'proofOfOwnership') {
            documents[fieldName].documentType = req.body.ownershipDocumentType || 'Other';
          } else if (fieldName === 'ambulanceRegistration') {
            documents[fieldName].registrationNumber = req.body.ambulanceRegNumber || '';
            documents[fieldName].numberOfAmbulances = parseInt(req.body.numberOfAmbulances) || 0;
          } else if (fieldName === 'taxRegistration') {
            documents[fieldName].taxNumber = req.body.taxNumber || '';
          }
        }
      });
      
      console.log('Final documents object:', JSON.stringify(documents, null, 2));
      hospitalData.documents = { ...hospitalData.documents, ...documents };
    } else {
      console.log('No files uploaded');
    }

    const hospital = new Hospital(hospitalData);
    await hospital.save();
    
    console.log('Hospital saved successfully with ID:', hospital._id);
    
    res.status(201).json({
      success: true,
      message: 'Hospital created successfully',
      data: hospital
    });
  } catch (error) {
    console.error('Error creating hospital:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating hospital'
    });
  }
};

// Get all hospitals with pagination and filters
export const getHospitals = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.hospitalType) {
      filter.hospitalType = req.query.hospitalType;
    }
    
    if (req.query.city) {
      filter['address.city'] = new RegExp(req.query.city, 'i');
    }
    
    if (req.query.state) {
      filter['address.state'] = new RegExp(req.query.state, 'i');
    }
    
    if (req.query.specialty) {
      filter.specialtiesOffered = req.query.specialty;
    }
    
    if (req.query.search) {
      filter.$or = [
        { hospitalName: new RegExp(req.query.search, 'i') },
        { registrationNumber: new RegExp(req.query.search, 'i') }
      ];
    }
    
    const hospitals = await Hospital.find(filter)
      .select('-documents') // Exclude documents in list view
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Hospital.countDocuments(filter);
    
    res.json({
      success: true,
      data: hospitals,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hospitals'
    });
  }
};

// Get hospital by ID
export const getHospitalById = async (req, res) => {
  try {
    const hospital = await Hospital.findById(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }

    // Debug logging
    console.log('Hospital found:', hospital.hospitalName);
    console.log('Documents object:', hospital.documents);
    console.log('Admin contact:', hospital.administrativeContact);
    
    res.json({
      success: true,
      data: hospital
    });
  } catch (error) {
    console.error('Error fetching hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hospital'
    });
  }
};

// Update hospital
export const updateHospital = async (req, res) => {
  try {
    const hospitalId = req.params.id;
    // Parse dot notation from FormData into nested objects
    const updateData = parseDotNotation(req.body);
    
    // Handle uploaded files if any
    if (req.files) {
      const documents = {};
      
      Object.keys(req.files).forEach(fieldName => {
        const files = req.files[fieldName];
        
        if (fieldName === 'accreditationCertificates') {
          documents.accreditationCertificates = files.map(file => ({
            type: req.body.accreditationType || 'Other',
            url: `/uploads/hospitals/${file.filename}`,
            certificateNumber: req.body.accreditationNumber || '',
            issuedBy: req.body.accreditationIssuedBy || '',
            expiryDate: req.body.accreditationExpiryDate || null,
            uploadDate: new Date()
          }));
        } else if (fieldName === 'adminIdProof') {
          // Handle admin ID proof - ensure nested structure exists
          if (!updateData.administrativeContact) {
            updateData.administrativeContact = {};
          }
          if (!updateData.administrativeContact.idProof) {
            updateData.administrativeContact.idProof = {};
          }
          updateData.administrativeContact.idProof.documentUrl = `/uploads/hospitals/${files[0].filename}`;
        } else {
          const file = files[0];
          documents[fieldName] = {
            url: `/uploads/hospitals/${file.filename}`,
            uploadDate: new Date()
          };
        }
      });
      
      updateData.documents = { ...updateData.documents, ...documents };
    }
    
    const hospital = await Hospital.findByIdAndUpdate(
      hospitalId,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hospital updated successfully',
      data: hospital
    });
  } catch (error) {
    console.error('Error updating hospital:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating hospital'
    });
  }
};

// Delete hospital
export const deleteHospital = async (req, res) => {
  try {
    const hospital = await Hospital.findByIdAndDelete(req.params.id);
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Hospital deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting hospital:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting hospital'
    });
  }
};

// Update hospital status (approve/reject)
export const updateHospitalStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason, notes } = req.body;
    
    const updateData = {
      status,
      ...(status === 'Approved' && { approvedAt: new Date(), approvedBy: req.user?.id }),
      ...(status === 'Rejected' && { rejectionReason }),
      ...(notes && { $push: { notes: { note: notes, addedBy: req.user?.id } } })
    };
    
    const hospital = await Hospital.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hospital not found'
      });
    }
    
    res.json({
      success: true,
      message: `Hospital ${status.toLowerCase()} successfully`,
      data: hospital
    });
  } catch (error) {
    console.error('Error updating hospital status:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating hospital status'
    });
  }
};

// Search hospitals by specialty
export const searchHospitalsBySpecialty = async (req, res) => {
  try {
    const { specialty } = req.params;
    const hospitals = await Hospital.findBySpecialty(specialty);
    
    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    console.error('Error searching hospitals by specialty:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching hospitals by specialty'
    });
  }
};

// Search hospitals by city
export const searchHospitalsByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const hospitals = await Hospital.findByCity(city);
    
    res.json({
      success: true,
      data: hospitals
    });
  } catch (error) {
    console.error('Error searching hospitals by city:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching hospitals by city'
    });
  }
}; 