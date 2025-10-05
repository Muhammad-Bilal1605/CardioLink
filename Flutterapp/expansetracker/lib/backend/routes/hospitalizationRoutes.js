import express from 'express';
import {
  createHospitalization,
  getPatientHospitalizations,
  getHospitalization,
  updateHospitalization,
  deleteHospitalization
} from '../controllers/hospitalizationController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Hospitalization routes
router.post('/', createHospitalization);
router.get('/patient/:patientId', getPatientHospitalizations);
router.get('/:id', getHospitalization);
router.put('/:id', updateHospitalization);
router.delete('/:id', deleteHospitalization);

export default router; 