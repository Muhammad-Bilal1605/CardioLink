import express from 'express';
import {
  createImaging,
  getPatientImaging,
  getImagingById,
  updateImaging,
  deleteImaging,
  searchImaging
} from '../controllers/imagingController.js';

const router = express.Router();

// Imaging routes
router.post('/', createImaging);
router.get('/patient/:patientId', getPatientImaging);
router.get('/search', searchImaging);
router.get('/:id', getImagingById);
router.put('/:id', updateImaging);
router.delete('/:id', deleteImaging);

export default router; 