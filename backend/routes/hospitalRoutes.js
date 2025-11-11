import express from 'express';
import path from 'path';
import fs from 'fs';
import Hospital from '../models/Hospital.js';
import {
  createHospital,
  getHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  updateHospitalStatus,
  searchHospitalsBySpecialty,
  searchHospitalsByCity,
  uploadHospitalFiles
} from '../controllers/hospitalController.js';

const router = express.Router();

// Test endpoint to check file existence
router.get('/test-files/:hospitalId', async (req, res) => {
  try {
    const Hospital = (await import('../models/Hospital.js')).default;
    const hospital = await Hospital.findById(req.params.hospitalId);
    
    if (!hospital) {
      return res.status(404).json({ success: false, message: 'Hospital not found' });
    }

    const __dirname = path.resolve();
    const results = {};

    // Check each document
    if (hospital.documents) {
      for (const [docType, docInfo] of Object.entries(hospital.documents)) {
        if (docInfo && docInfo.url) {
          const filePath = path.join(__dirname, 'backend/uploads', docInfo.url.replace('/uploads/', ''));
          results[docType] = {
            url: docInfo.url,
            filePath: filePath,
            exists: fs.existsSync(filePath),
            size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
          };
        }
      }
    }

    // Check admin ID proof
    if (hospital.administrativeContact?.idProof?.documentUrl) {
      const filePath = path.join(__dirname, 'backend/uploads', hospital.administrativeContact.idProof.documentUrl.replace('/uploads/', ''));
      results.adminIdProof = {
        url: hospital.administrativeContact.idProof.documentUrl,
        filePath: filePath,
        exists: fs.existsSync(filePath),
        size: fs.existsSync(filePath) ? fs.statSync(filePath).size : 0
      };
    }

    res.json({
      success: true,
      hospitalName: hospital.hospitalName,
      fileCheck: results
    });
  } catch (error) {
    console.error('Error checking files:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Test endpoint to directly serve a file - redirect to Cloudinary if available
router.get('/download-file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'backend/uploads/hospitals', filename);
    
    console.log('Direct download attempt for:', filename);
    console.log('Looking for file at:', filePath);

    // Try DB for Cloudinary URL and redirect
    try {
      const doc = await Hospital.findOne({
        $or: [
          { 'documents.hospitalRegistrationCertificate.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.healthDepartmentLicense.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.proofOfOwnership.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.practitionersList.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.labCertification.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.ambulanceRegistration.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.taxRegistration.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.dataPrivacyPolicy.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'documents.accreditationCertificates.url': { $regex: `${filename}$`, $options: 'i' } },
          { 'administrativeContact.idProof.documentUrl': { $regex: `${filename}$`, $options: 'i' } }
        ]
      }).lean();
      
      if (doc) {
        // Check all possible URL locations
        const allUrls = [];
        
        // Check documents
        if (doc.documents) {
          Object.values(doc.documents).forEach(docItem => {
            if (Array.isArray(docItem)) {
              docItem.forEach(item => {
                if (item.url) allUrls.push(item.url);
              });
            } else if (docItem && docItem.url) {
              allUrls.push(docItem.url);
            }
          });
        }
        
        // Check admin ID proof
        if (doc.administrativeContact?.idProof?.documentUrl) {
          allUrls.push(doc.administrativeContact.idProof.documentUrl);
        }
        
        const match = allUrls.find(u => typeof u === 'string' && u.toLowerCase().endsWith(filename.toLowerCase()));
        if (match && match.startsWith('http')) {
          console.log('↪ Redirecting to Cloudinary URL:', match);
          return res.redirect(302, match);
        }
      }
    } catch (e) {
      console.log('DB lookup for Cloudinary URL failed:', e.message);
    }
    
    // Fallback to legacy local file
    if (fs.existsSync(filePath)) {
      console.log('✓ File found, sending...');
      res.sendFile(filePath);
    } else {
      console.log('✗ File not found');
      res.status(404).json({ error: 'File not found' });
    }
  } catch (error) {
    console.error('Error serving file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Hospital routes
router.post('/', uploadHospitalFiles, createHospital);
router.get('/', getHospitals);
router.get('/:id', getHospitalById);
router.put('/:id', uploadHospitalFiles, updateHospital);
router.delete('/:id', deleteHospital);

// Status management routes
router.patch('/:id/status', updateHospitalStatus);
router.put('/:id/status', updateHospitalStatus);

// Search routes
router.get('/search/specialty/:specialty', searchHospitalsBySpecialty);
router.get('/search/city/:city', searchHospitalsByCity);

export default router; 