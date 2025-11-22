import express from 'express';
import {
  getPharmacyAutomaticOrders,
  getAutomaticOrderById,
  updateOrderStatus,
  rejectOrder,
  getPatientAutomaticOrders,
  markOrderAsRead,
  getPharmacyOrderStats
} from '../controllers/automaticPrescriptionOrderController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Pharmacy routes (require authentication)
router.get('/pharmacy/:pharmacyId', verifyToken, getPharmacyAutomaticOrders);
router.get('/pharmacy/:pharmacyId/stats', verifyToken, getPharmacyOrderStats);
router.get('/:orderId', verifyToken, getAutomaticOrderById);
router.put('/:orderId/status', verifyToken, updateOrderStatus);
router.put('/:orderId/reject', verifyToken, rejectOrder);

// Patient routes (optional auth - can work with or without token for mobile app)
router.get('/patient/:patientId', getPatientAutomaticOrders);
router.put('/:orderId/read', verifyToken, markOrderAsRead);

export default router;

