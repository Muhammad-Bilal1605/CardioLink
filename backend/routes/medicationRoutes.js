import express from 'express';
import {
  createMedication,
  getPatientMedications,
  getMedication,
  updateMedication,
  deleteMedication
} from '../controllers/medicationController.js';

const router = express.Router();

// Medication routes
router.post('/', createMedication);
router.get('/patient/:patientId', getPatientMedications);
router.get('/:id', getMedication);
router.put('/:id', updateMedication);
router.delete('/:id', deleteMedication);

export default router; 