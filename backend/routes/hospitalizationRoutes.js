import express from 'express';
import {
  createHospitalization,
  getPatientHospitalizations,
  getHospitalization,
  updateHospitalization,
  deleteHospitalization
} from '../controllers/hospitalizationController.js';

const router = express.Router();

// Hospitalization routes
router.post('/', createHospitalization);
router.get('/patient/:patientId', getPatientHospitalizations);
router.get('/:id', getHospitalization);
router.put('/:id', updateHospitalization);
router.delete('/:id', deleteHospitalization);

export default router; 