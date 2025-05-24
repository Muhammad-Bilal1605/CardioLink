import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  createImaging,
  getPatientImaging,
  getImagingById,
  updateImaging,
  deleteImaging,
  searchImaging
} from '../controllers/imagingController.js';

const router = express.Router();

// Dedicated route for serving imaging files
router.get('/file/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', filename);
    
    console.log('=== Imaging File Request ===');
    console.log('Requested filename (decoded):', filename);
    console.log('Looking for file at:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('✓ File found, serving...');
      const stats = fs.statSync(filePath);
      console.log('File size:', stats.size, 'bytes');
      
      // Set appropriate headers
      res.setHeader('Content-Type', 'image/jpeg'); // Default to JPEG, could be improved to detect actual type
      res.setHeader('Content-Length', stats.size);
      
      // Send the file
      res.sendFile(filePath);
    } else {
      console.log('✗ File not found');
      
      // List directory contents for debugging
      const uploadsDir = path.join(__dirname, 'uploads');
      if (fs.existsSync(uploadsDir)) {
        console.log('Available files in uploads directory:');
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          const filePath = path.join(uploadsDir, file);
          const stats = fs.statSync(filePath);
          console.log(`  ${stats.isFile() ? '[FILE]' : '[DIR]'} ${file} (${stats.size} bytes)`);
        });
      }
      
      res.status(404).json({ error: 'File not found' });
    }
    console.log('=== End Imaging File Request ===');
  } catch (error) {
    console.error('Error serving imaging file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Imaging routes
router.post('/', createImaging);
router.get('/patient/:patientId', getPatientImaging);
router.get('/search', searchImaging);
router.get('/:id', getImagingById);
router.put('/:id', updateImaging);
router.delete('/:id', deleteImaging);

export default router; 