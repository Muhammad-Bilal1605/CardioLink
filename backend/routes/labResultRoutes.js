import express from 'express';
import path from 'path';
import fs from 'fs';
import {
  createLabResult,
  getPatientLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult,
  searchLabResults
} from '../controllers/labResultController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Dedicated route for serving lab result files (PDFs, documents)
router.get('/file/:filename', (req, res) => {
  try {
    const filename = decodeURIComponent(req.params.filename);
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', filename);
    
    console.log('=== Lab File Request ===');
    console.log('Requested filename (decoded):', filename);
    console.log('Looking for file at:', filePath);
    
    if (fs.existsSync(filePath)) {
      console.log('✓ File found, serving...');
      const stats = fs.statSync(filePath);
      console.log('File size:', stats.size, 'bytes');
      
      // Determine content type based on file extension
      const ext = path.extname(filename).toLowerCase();
      let contentType = 'application/octet-stream'; // Default
      
      if (ext === '.pdf') {
        contentType = 'application/pdf';
      } else if (['.jpg', '.jpeg'].includes(ext)) {
        contentType = 'image/jpeg';
      } else if (ext === '.png') {
        contentType = 'image/png';
      } else if (ext === '.gif') {
        contentType = 'image/gif';
      } else if (['.doc', '.docx'].includes(ext)) {
        contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      }
      
      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Length', stats.size);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      
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
    console.log('=== End Lab File Request ===');
  } catch (error) {
    console.error('Error serving lab file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Lab result routes
router.post('/', createLabResult);
router.get('/patient/:patientId', getPatientLabResults);
router.get('/search', searchLabResults);
router.get('/:id', getLabResultById);
router.put('/:id', updateLabResult);
router.delete('/:id', deleteLabResult);

export default router; 