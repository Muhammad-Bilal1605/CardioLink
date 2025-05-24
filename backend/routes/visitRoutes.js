import express from 'express';
import {
  createVisit,
  getPatientVisits,
  getVisit,
  updateVisit,
  deleteVisit,
  uploadFiles
} from '../controllers/visitController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Apply verifyToken middleware to all routes
router.use(verifyToken);

// Create a new visit - apply the upload middleware first
router.post('/', uploadFiles, createVisit);

// Get all visits for a patient
router.get('/patient/:patientId', getPatientVisits);

// Get a single visit
router.get('/:id', getVisit);

// Update a visit - apply the upload middleware first
router.put('/:id', uploadFiles, updateVisit);

// Delete a visit
router.delete('/:id', deleteVisit);

export default router;

