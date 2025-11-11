import express from 'express';
import {
  createOrderFromCart,
  getPharmacyOrders,
  getOrderById,
  updateOrderStatus,
  verifyPrescription,
  addPrescriptionToOrder,
  assignDelivery,
  cancelOrder,
  addInternalNote,
  getPendingOrders,
  getOrdersRequiringPrescriptionVerification,
  getOrderStats,
  uploadPrescription
} from '../controllers/orderController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Order management
router.post('/create', createOrderFromCart);
router.get('/pharmacy/:pharmacyId', getPharmacyOrders);
router.get('/pharmacy/:pharmacyId/pending', getPendingOrders);
router.get('/pharmacy/:pharmacyId/prescription-verification', getOrdersRequiringPrescriptionVerification);
router.get('/pharmacy/:pharmacyId/stats', getOrderStats);
router.get('/:id', getOrderById);
router.patch('/:id/status', updateOrderStatus);
router.patch('/:orderId/prescription/:prescriptionId/verify', verifyPrescription);
router.post('/:orderId/prescription', uploadPrescription, addPrescriptionToOrder);
router.patch('/:id/assign-delivery', assignDelivery);
router.patch('/:id/cancel', cancelOrder);
router.post('/:id/note', addInternalNote);

export default router;

