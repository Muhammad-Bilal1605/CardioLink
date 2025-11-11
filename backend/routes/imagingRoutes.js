import express from 'express';
import path from 'path';
import fs from 'fs';
import Imaging from '../models/Imaging.js';
import {
  createImaging,
  getPatientImaging,
  getImagingById,
  getHospitalImagings,
  updateImaging,
  deleteImaging,
  searchImaging
} from '../controllers/imagingController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Dedicated route for serving imaging files (public access for file serving)
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', filename);

    console.log('=== Imaging File Request ===');
    console.log('Requested filename (decoded):', filename);

    // First, try to find a Cloudinary URL in DB and redirect
    try {
      const doc = await Imaging.findOne({ imageUrl: { $regex: `${filename}$`, $options: 'i' } }).lean();
      if (doc && doc.imageUrl && doc.imageUrl.startsWith('http')) {
        console.log('↪ Redirecting to Cloudinary URL:', doc.imageUrl);
        return res.redirect(302, doc.imageUrl);
      }
    } catch (e) {
      console.log('DB lookup for Cloudinary URL failed:', e.message);
    }

    // Fallback to serving local file if present (legacy support)
    console.log('Looking for local file at:', filePath);
    if (fs.existsSync(filePath)) {
      console.log('✓ Local file found, serving...');
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Type', 'image/jpeg');
      res.setHeader('Content-Length', stats.size);
      return res.sendFile(filePath);
    }

    console.log('✗ File not found locally or in DB');
    res.status(404).json({ error: 'File not found' });
    console.log('=== End Imaging File Request ===');
  } catch (error) {
    console.error('Error serving imaging file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply verifyToken middleware to all data access routes
router.use(verifyToken);

// Imaging routes
router.post('/', createImaging);
router.get('/hospital', getHospitalImagings);
router.get('/patient/:patientId', getPatientImaging);
router.get('/search', searchImaging);
router.get('/:id', getImagingById);
router.put('/:id', updateImaging);
router.delete('/:id', deleteImaging);

export default router; 