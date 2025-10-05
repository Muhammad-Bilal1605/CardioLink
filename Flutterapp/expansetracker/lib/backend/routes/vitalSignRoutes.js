import express from 'express';
import {
  createVitalSign,
  getPatientVitalSigns,
  getVitalSign,
  updateVitalSign,
  deleteVitalSign
} from '../controllers/vitalSignController.js';

const router = express.Router();

// Vital sign routes
router.post('/', createVitalSign);
router.get('/patient/:patientId', getPatientVitalSigns);
router.get('/:id', getVitalSign);
router.put('/:id', updateVitalSign);
router.delete('/:id', deleteVitalSign);

export default router; 