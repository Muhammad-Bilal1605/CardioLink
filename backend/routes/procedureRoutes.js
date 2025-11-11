import express from 'express';
import path from 'path';
import fs from 'fs';
import Procedure from '../models/Procedure.js';
import {
  createProcedure,
  getPatientProcedures,
  getProcedureById,
  updateProcedure,
  deleteProcedure,
  searchProcedures,
  uploadFiles,
  getHospitalProcedures
} from '../controllers/procedureController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Dedicated route for serving procedure files (documents, images)
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', filename);

    console.log('=== Procedure File Request ===');
    console.log('Requested filename (decoded):', filename);

    // Try to find a Cloudinary URL in DB and redirect
    try {
      const doc = await Procedure.findOne({
        $or: [
          { documents: { $elemMatch: { $regex: `${filename}$`, $options: 'i' } } },
          { images: { $elemMatch: { $regex: `${filename}$`, $options: 'i' } } }
        ]
      }).lean();
      const allUrls = [
        ...((doc && doc.documents) || []),
        ...((doc && doc.images) || [])
      ];
      const match = allUrls.find(u => typeof u === 'string' && u.toLowerCase().endsWith(filename.toLowerCase()));
      if (match && match.startsWith('http')) {
        console.log('↪ Redirecting to Cloudinary URL:', match);
        return res.redirect(302, match);
      }
    } catch (e) {
      console.log('DB lookup for Cloudinary URL failed:', e.message);
    }

    // Fallback to serving local file if present (legacy support)
    console.log('Looking for local file at:', filePath);
    if (fs.existsSync(filePath)) {
      console.log('✓ Local file found, serving...');
      const stats = fs.statSync(filePath);
      res.setHeader('Content-Length', stats.size);
      return res.sendFile(filePath);
    }

    console.log('✗ File not found locally or in DB');
    res.status(404).json({ error: 'File not found' });
    console.log('=== End Procedure File Request ===');
  } catch (error) {
    console.error('Error serving procedure file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Procedure routes
router.post('/', uploadFiles, createProcedure);
router.get('/hospital', getHospitalProcedures);
router.get('/patient/:patientId', getPatientProcedures);
router.get('/search', searchProcedures);
router.get('/:id', getProcedureById);
router.put('/:id', uploadFiles, updateProcedure);
router.delete('/:id', deleteProcedure);

export default router; 