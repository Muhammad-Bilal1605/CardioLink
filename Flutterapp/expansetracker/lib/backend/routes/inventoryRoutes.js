import express from 'express';
import {
  getPharmacyInventory,
  getInventoryItem,
  addToInventory,
  updateInventory,
  addStock,
  deductStock,
  deleteInventoryItem,
  getLowStockItems,
  getOutOfStockItems,
  getExpiringSoonItems,
  checkAvailability,
  getInventoryStats
} from '../controllers/inventoryController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Inventory management
router.get('/pharmacy/:pharmacyId', getPharmacyInventory);
router.get('/pharmacy/:pharmacyId/stats', getInventoryStats);
router.get('/pharmacy/:pharmacyId/low-stock', getLowStockItems);
router.get('/pharmacy/:pharmacyId/out-of-stock', getOutOfStockItems);
router.get('/pharmacy/:pharmacyId/expiring-soon', getExpiringSoonItems);
router.get('/pharmacy/:pharmacyId/product/:productId/check', checkAvailability);
router.get('/:id', getInventoryItem);
router.post('/', addToInventory);
router.put('/:id', updateInventory);
router.patch('/:id/add-stock', addStock);
router.patch('/:id/deduct-stock', deductStock);
router.delete('/:id', deleteInventoryItem);

export default router;

