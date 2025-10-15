import express from 'express';
import path from 'path';
import fs from 'fs';
import LabResult from '../models/LabResult.js';
import {
  createLabResult,
  getPatientLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult,
  searchLabResults,
  getHospitalLabResults
} from '../controllers/labResultController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Dedicated route for serving lab result files (PDFs, documents)
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', filename);

    console.log('=== Lab File Request ===');
    console.log('Requested filename (decoded):', filename);

    // Try DB for Cloudinary URL and redirect
    try {
      const doc = await LabResult.findOne({ reportUrl: { $regex: `${filename}$`, $options: 'i' } }).lean();
      if (doc && doc.reportUrl && doc.reportUrl.startsWith('http')) {
        console.log('↪ Redirecting to Cloudinary URL:', doc.reportUrl);
        return res.redirect(302, doc.reportUrl);
      }
    } catch (e) {
      console.log('DB lookup for Cloudinary URL failed:', e.message);
    }

    // Fallback to legacy local file
    console.log('Looking for local file at:', filePath);
    if (fs.existsSync(filePath)) {
      console.log('✓ Local file found, serving...');
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Length', stats.size);
      return res.sendFile(filePath);
    }

    console.log('✗ File not found locally or in DB');
    res.status(404).json({ error: 'File not found' });
    console.log('=== End Lab File Request ===');
  } catch (error) {
    console.error('Error serving lab file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lab result routes
router.post('/', createLabResult);
router.get('/hospital', getHospitalLabResults);
router.get('/patient/:patientId', getPatientLabResults);
router.get('/search', searchLabResults);
router.get('/:id', getLabResultById);
router.put('/:id', updateLabResult);
router.delete('/:id', deleteLabResult);

export default router; 