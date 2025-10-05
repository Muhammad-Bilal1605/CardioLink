import express from 'express';
import path from 'path';
import fs from 'fs';
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

// Test endpoint to directly serve a file
router.get('/download-file/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'backend/uploads/hospitals', filename);
    
    console.log('Direct download attempt for:', filename);
    console.log('Looking for file at:', filePath);
    
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