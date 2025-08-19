import express from 'express';
import {
  searchPatients,
  getPatientById,
  createPatient,
  updatePatient,
  deletePatient,
  getPatientRecords,
  checkEmailExists,
  getAllPatients
} from '../controllers/patientController.js';

const router = express.Router();

// Log all requests to patient routes
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Patient routes
router.get('/', getAllPatients); // Get all patients with pagination
router.get('/check-email', checkEmailExists);
router.get('/search', searchPatients);
router.get('/:id', getPatientById);
router.post('/', createPatient);
router.put('/:id', updatePatient);
router.delete('/:id', deletePatient);
router.get('/:id/records', getPatientRecords);

export default router;