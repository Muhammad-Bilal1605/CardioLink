import Pharmacy from '../models/Pharmacy.js';
import bcryptjs from 'bcryptjs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';

// Create a new pharmacy (registration)
export const createPharmacy = async (req, res) => {
  try {
    const pharmacyData = req.body;

    // Parse JSON strings from FormData
    const jsonFields = [
      'address',
      'coordinates',
      'administrativeContact',
      'pharmacistInCharge',
      'deliveryOptions',
      'bankDetails',
      'documents',
      'images',
      'servicesOffered',
      'operatingHours'
    ];

    jsonFields.forEach(field => {
      if (pharmacyData[field] && typeof pharmacyData[field] === 'string') {
        try {
          pharmacyData[field] = JSON.parse(pharmacyData[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, e.message);
        }
      }
    });

    // Hash the administrative contact password before saving
    if (pharmacyData.administrativeContact && pharmacyData.administrativeContact.password) {
      const hashedPassword = await bcryptjs.hash(pharmacyData.administrativeContact.password, 10);
      pharmacyData.administrativeContact.password = hashedPassword;
    }

    // Handle file uploads - upload to Cloudinary
    if (req.files) {
      // Administrative Contact ID Proof
      if (req.files.adminIdProof && req.files.adminIdProof[0]) {
        if (!pharmacyData.administrativeContact) pharmacyData.administrativeContact = {};
        if (!pharmacyData.administrativeContact.idProof) pharmacyData.administrativeContact.idProof = {};
        
        const file = req.files.adminIdProof[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/admin-proof'
          });
          pharmacyData.administrativeContact.idProof.documentUrl = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Documents
      if (!pharmacyData.documents) pharmacyData.documents = {};

      // Pharmacy Registration Certificate
      if (req.files.pharmacyRegistrationCertificate && req.files.pharmacyRegistrationCertificate[0]) {
        const file = req.files.pharmacyRegistrationCertificate[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/documents'
          });
          if (!pharmacyData.documents.pharmacyRegistrationCertificate) pharmacyData.documents.pharmacyRegistrationCertificate = {};
          pharmacyData.documents.pharmacyRegistrationCertificate.url = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Drug License
      if (req.files.drugLicense && req.files.drugLicense[0]) {
        const file = req.files.drugLicense[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/documents'
          });
          if (!pharmacyData.documents.drugLicense) pharmacyData.documents.drugLicense = {};
          pharmacyData.documents.drugLicense.url = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Pharmacist License
      if (req.files.pharmacistLicense && req.files.pharmacistLicense[0]) {
        const file = req.files.pharmacistLicense[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/documents'
          });
          if (!pharmacyData.documents.pharmacistLicense) pharmacyData.documents.pharmacistLicense = {};
          pharmacyData.documents.pharmacistLicense.url = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Proof of Ownership
      if (req.files.proofOfOwnership && req.files.proofOfOwnership[0]) {
        const file = req.files.proofOfOwnership[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/documents'
          });
          if (!pharmacyData.documents.proofOfOwnership) pharmacyData.documents.proofOfOwnership = {};
          pharmacyData.documents.proofOfOwnership.url = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Tax Registration
      if (req.files.taxRegistration && req.files.taxRegistration[0]) {
        const file = req.files.taxRegistration[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/documents'
          });
          if (!pharmacyData.documents.taxRegistration) pharmacyData.documents.taxRegistration = {};
          pharmacyData.documents.taxRegistration.url = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Store Images
      if (req.files.storeFront && req.files.storeFront[0]) {
        const file = req.files.storeFront[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/images'
          });
          if (!pharmacyData.images) pharmacyData.images = {};
          pharmacyData.images.storeFront = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      if (req.files.logo && req.files.logo[0]) {
        const file = req.files.logo[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/pharmacies/images'
          });
          if (!pharmacyData.images) pharmacyData.images = {};
          pharmacyData.images.logo = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Interior images (multiple)
      if (req.files.interior && req.files.interior.length > 0) {
        const uploadPromises = req.files.interior.map(async (file) => {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              resource_type: 'auto',
              folder: 'cardiolink/pharmacies/images'
            });
            return result.secure_url;
          } finally {
            try { fs.unlinkSync(file.path); } catch (_) {}
          }
        });
        
        const interiorUrls = await Promise.all(uploadPromises);
        if (!pharmacyData.images) pharmacyData.images = {};
        pharmacyData.images.interior = interiorUrls;
      }
    }

    const pharmacy = new Pharmacy(pharmacyData);
    await pharmacy.save();

    res.status(201).json({
      success: true,
      message: 'Pharmacy registration submitted successfully. Awaiting admin approval.',
      data: {
        ...pharmacy._doc,
        administrativeContact: {
          ...pharmacy.administrativeContact,
          password: undefined
        }
      }
    });
  } catch (error) {
    console.error('Error creating pharmacy:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to register pharmacy',
      errors: error.errors
    });
  }
};

// Get all pharmacies (with optional filters)
export const getPharmacies = async (req, res) => {
  try {
    const { status, city, isActive, search, page = 1, limit = 12 } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) query.status = status;
    
    // Filter by city
    if (city) query['address.city'] = new RegExp(city, 'i');
    
    // Filter by active status
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Search functionality - search in pharmacy name or drug license number
    if (search) {
      query.$or = [
        { pharmacyName: new RegExp(search, 'i') },
        { drugLicenseNumber: new RegExp(search, 'i') },
        { registrationNumber: new RegExp(search, 'i') }
      ];
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const total = await Pharmacy.countDocuments(query);

    // Get pharmacies with pagination
    const pharmacies = await Pharmacy.find(query)
      .select('-administrativeContact.password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total
      }
    });
  } catch (error) {
    console.error('Error getting pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pharmacies'
    });
  }
};

// Get pharmacy by ID
export const getPharmacyById = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findById(req.params.id)
      .select('-administrativeContact.password');

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.status(200).json({
      success: true,
      data: pharmacy
    });
  } catch (error) {
    console.error('Error getting pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve pharmacy'
    });
  }
};

// Update pharmacy
export const updatePharmacy = async (req, res) => {
  try {
    const pharmacyData = req.body;

    // Parse JSON strings from FormData
    const jsonFields = [
      'address',
      'coordinates',
      'administrativeContact',
      'pharmacistInCharge',
      'deliveryOptions',
      'bankDetails',
      'documents',
      'images',
      'servicesOffered',
      'operatingHours'
    ];

    jsonFields.forEach(field => {
      if (pharmacyData[field] && typeof pharmacyData[field] === 'string') {
        try {
          pharmacyData[field] = JSON.parse(pharmacyData[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, e.message);
        }
      }
    });

    // If password is being updated, hash it
    if (pharmacyData.administrativeContact && pharmacyData.administrativeContact.password) {
      const hashedPassword = await bcryptjs.hash(pharmacyData.administrativeContact.password, 10);
      pharmacyData.administrativeContact.password = hashedPassword;
    }

    // Handle file uploads
    if (req.files) {
      // Similar file handling as in create
      if (req.files.adminIdProof && req.files.adminIdProof[0]) {
        if (!pharmacyData.administrativeContact) pharmacyData.administrativeContact = {};
        if (!pharmacyData.administrativeContact.idProof) pharmacyData.administrativeContact.idProof = {};
        pharmacyData.administrativeContact.idProof.documentUrl = req.files.adminIdProof[0].path || `/uploads/${req.files.adminIdProof[0].filename}`;
      }

      if (!pharmacyData.documents) pharmacyData.documents = {};

      if (req.files.pharmacyRegistrationCertificate && req.files.pharmacyRegistrationCertificate[0]) {
        if (!pharmacyData.documents.pharmacyRegistrationCertificate) pharmacyData.documents.pharmacyRegistrationCertificate = {};
        pharmacyData.documents.pharmacyRegistrationCertificate.url = req.files.pharmacyRegistrationCertificate[0].path || `/uploads/${req.files.pharmacyRegistrationCertificate[0].filename}`;
      }

      if (req.files.drugLicense && req.files.drugLicense[0]) {
        if (!pharmacyData.documents.drugLicense) pharmacyData.documents.drugLicense = {};
        pharmacyData.documents.drugLicense.url = req.files.drugLicense[0].path || `/uploads/${req.files.drugLicense[0].filename}`;
      }

      if (req.files.pharmacistLicense && req.files.pharmacistLicense[0]) {
        if (!pharmacyData.documents.pharmacistLicense) pharmacyData.documents.pharmacistLicense = {};
        pharmacyData.documents.pharmacistLicense.url = req.files.pharmacistLicense[0].path || `/uploads/${req.files.pharmacistLicense[0].filename}`;
      }

      if (req.files.proofOfOwnership && req.files.proofOfOwnership[0]) {
        if (!pharmacyData.documents.proofOfOwnership) pharmacyData.documents.proofOfOwnership = {};
        pharmacyData.documents.proofOfOwnership.url = req.files.proofOfOwnership[0].path || `/uploads/${req.files.proofOfOwnership[0].filename}`;
      }

      if (req.files.taxRegistration && req.files.taxRegistration[0]) {
        if (!pharmacyData.documents.taxRegistration) pharmacyData.documents.taxRegistration = {};
        pharmacyData.documents.taxRegistration.url = req.files.taxRegistration[0].path || `/uploads/${req.files.taxRegistration[0].filename}`;
      }
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      pharmacyData,
      { new: true, runValidators: true }
    ).select('-administrativeContact.password');

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pharmacy updated successfully',
      data: pharmacy
    });
  } catch (error) {
    console.error('Error updating pharmacy:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update pharmacy'
    });
  }
};

// Delete pharmacy
export const deletePharmacy = async (req, res) => {
  try {
    const pharmacy = await Pharmacy.findByIdAndDelete(req.params.id);

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Pharmacy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting pharmacy:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete pharmacy'
    });
  }
};

// Update pharmacy status (Approve/Reject/Suspend)
export const updatePharmacyStatus = async (req, res) => {
  try {
    const { status, rejectionReason, note, approvedBy } = req.body;

    const updateData = {
      status,
      rejectionReason: status === 'Rejected' ? rejectionReason : undefined
    };

    if (status === 'Approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = approvedBy;
      updateData.verificationStatus = 'Fully Verified';
    }

    if (note) {
      const pharmacy = await Pharmacy.findById(req.params.id);
      if (pharmacy) {
        pharmacy.notes.push({
          note,
          addedBy: approvedBy,
          addedAt: new Date()
        });
        await pharmacy.save();
      }
    }

    const pharmacy = await Pharmacy.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-administrativeContact.password');

    if (!pharmacy) {
      return res.status(404).json({
        success: false,
        message: 'Pharmacy not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `Pharmacy ${status.toLowerCase()} successfully`,
      data: pharmacy
    });
  } catch (error) {
    console.error('Error updating pharmacy status:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update pharmacy status'
    });
  }
};

// Search pharmacies by city
export const searchPharmaciesByCity = async (req, res) => {
  try {
    const { city } = req.params;
    const pharmacies = await Pharmacy.findByCity(city);

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error searching pharmacies by city:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search pharmacies'
    });
  }
};

// Find nearby pharmacies
export const findNearbyPharmacies = async (req, res) => {
  try {
    const { longitude, latitude, maxDistance } = req.query;

    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }

    const pharmacies = await Pharmacy.findNearby(
      parseFloat(longitude),
      parseFloat(latitude),
      maxDistance ? parseInt(maxDistance) : 5000
    );

    res.status(200).json({
      success: true,
      count: pharmacies.length,
      data: pharmacies
    });
  } catch (error) {
    console.error('Error finding nearby pharmacies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to find nearby pharmacies'
    });
  }
};

// Multer configuration for pharmacy file uploads

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for pharmacy document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/pharmacies');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      try {
        fs.mkdirSync(uploadPath, { recursive: true });
        console.log('Created pharmacies directory:', uploadPath);
      } catch (error) {
        console.error('Error creating pharmacies directory:', error);
        return cb(error);
      }
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const sanitizedFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + sanitizedFilename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only .png, .jpg, .jpeg and .pdf files are allowed!'));
    }
  }
});

// Export the upload middleware with all pharmacy document fields
export const uploadPharmacyFiles = upload.fields([
  { name: 'adminIdProof', maxCount: 1 },
  { name: 'pharmacyRegistrationCertificate', maxCount: 1 },
  { name: 'drugLicense', maxCount: 1 },
  { name: 'pharmacistLicense', maxCount: 1 },
  { name: 'proofOfOwnership', maxCount: 1 },
  { name: 'taxRegistration', maxCount: 1 },
  { name: 'storeFront', maxCount: 1 },
  { name: 'logo', maxCount: 1 },
  { name: 'interior', maxCount: 5 }
]);

