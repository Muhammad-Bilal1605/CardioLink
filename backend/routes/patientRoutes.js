import express from 'express';
import {
  searchPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientRecords,
  checkEmailExists
} from '../controllers/patientController.js';

const router = express.Router();

// Patient routes
router.get('/check-email', checkEmailExists);
router.get('/search', searchPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);
router.get('/:id/records', getPatientRecords);

export default router; 