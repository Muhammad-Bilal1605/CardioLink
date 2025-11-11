import express from 'express';
import path from 'path';
import fs from 'fs';
import Visit from '../models/Visit.js';
import {
  createVisit,
  getPatientVisits,
  getVisit,
  updateVisit,
  deleteVisit,
  uploadFiles
} from '../controllers/visitController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Dedicated route for serving visit files (documents, images)
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', filename);

    console.log('=== Visit File Request ===');
    console.log('Requested filename (decoded):', filename);

    // Try DB for Cloudinary URL and redirect
    try {
      const doc = await Visit.findOne({
        $or: [
          { documents: { $elemMatch: { $regex: `${filename}$`, $options: 'i' } } },
          { images: { $elemMatch: { $regex: `${filename}$`, $options: 'i' } } }
        ]
      }).lean();
      
      const allUrls = [
        ...(doc?.documents || []),
        ...(doc?.images || [])
      ];
      
      const match = allUrls.find(u => typeof u === 'string' && u.toLowerCase().endsWith(filename.toLowerCase()));
      if (match && match.startsWith('http')) {
        console.log('↪ Redirecting to Cloudinary URL:', match);
        return res.redirect(302, match);
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
    console.log('=== End Visit File Request ===');
  } catch (error) {
    console.error('Error serving visit file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Create a new visit - apply the upload middleware first
router.post('/', uploadFiles, createVisit);

// Get all visits for a patient
router.get('/patient/:patientId', getPatientVisits);

// Get a single visit
router.get('/:id', getVisit);

// Update a visit - apply the upload middleware first
router.put('/:id', uploadFiles, updateVisit);

// Delete a visit
router.delete('/:id', deleteVisit);

export default router;

