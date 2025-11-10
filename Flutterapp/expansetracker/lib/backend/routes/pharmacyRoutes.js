import express from 'express';
import {
  createPharmacy,
  getPharmacies,
  getPharmacyById,
  updatePharmacy,
  deletePharmacy,
  updatePharmacyStatus,
  searchPharmaciesByCity,
  findNearbyPharmacies,
  uploadPharmacyFiles
} from '../controllers/pharmacyController.js';

const router = express.Router();

// Pharmacy routes
router.post('/', uploadPharmacyFiles, createPharmacy);
router.get('/', getPharmacies);
router.get('/nearby', findNearbyPharmacies);
router.get('/:id', getPharmacyById);
router.put('/:id', uploadPharmacyFiles, updatePharmacy);
router.delete('/:id', deletePharmacy);

// Status management routes
router.patch('/:id/status', updatePharmacyStatus);
router.put('/:id/status', updatePharmacyStatus);

// Search routes
router.get('/search/city/:city', searchPharmaciesByCity);

export default router;

