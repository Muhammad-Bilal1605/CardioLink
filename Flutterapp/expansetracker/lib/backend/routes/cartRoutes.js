import express from 'express';
import {
  addItemToCart,
  getCart,
  updateCartItemQuantity,
  removeItemFromCart,
  clearCart
} from '../controllers/cartController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.use(verifyToken);

router.get('/pharmacy/:pharmacyId', getCart);
router.post('/pharmacy/:pharmacyId/items', addItemToCart);
router.patch('/pharmacy/:pharmacyId/items/:productId', updateCartItemQuantity);
router.delete('/pharmacy/:pharmacyId/items/:productId', removeItemFromCart);
router.delete('/pharmacy/:pharmacyId', clearCart);

export default router;

