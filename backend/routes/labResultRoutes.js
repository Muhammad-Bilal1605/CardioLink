import express from 'express';
import {
  createLabResult,
  getPatientLabResults,
  getLabResultById,
  updateLabResult,
  deleteLabResult
} from '../controllers/labResultController.js';

const router = express.Router();

// Lab result routes
router.post('/', createLabResult);
router.get('/patient/:patientId', getPatientLabResults);
router.get('/:id', getLabResultById);
router.put('/:id', updateLabResult);
router.delete('/:id', deleteLabResult);

export default router; 