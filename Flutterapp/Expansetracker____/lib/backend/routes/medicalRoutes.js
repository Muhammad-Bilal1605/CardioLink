import express from 'express';
import {
  createMedical,
  getPatientMedicals,
  getMedical,
  updateMedical,
  deleteMedical
} from '../controllers/medicalController.js';

const router = express.Router();

// Medical routes
router.post('/', createMedical);
router.get('/patient/:patientId', getPatientMedicals);
router.get('/:id', getMedical);
router.put('/:id', updateMedical);
router.delete('/:id', deleteMedical);

export default router; 