import express from 'express';
import {
  createOrUpdateAutomaticPrescription,
  getAutomaticPrescription,
  getAvailablePharmacies,
  deleteAutomaticPrescription
} from '../controllers/automaticPrescriptionController.js';

const router = express.Router();

// Automatic prescription routes
router.post('/', createOrUpdateAutomaticPrescription);
router.get('/patient/:patientId', getAutomaticPrescription);
router.get('/pharmacies', getAvailablePharmacies);
router.delete('/patient/:patientId', deleteAutomaticPrescription);

export default router;

