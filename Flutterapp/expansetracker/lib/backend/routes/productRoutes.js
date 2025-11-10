import express from 'express';
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getFeaturedProducts,
  getTrendingProducts,
  searchProducts,
  uploadProductImages
} from '../controllers/productController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Public routes
router.get('/', getProducts);
router.get('/featured', getFeaturedProducts);
router.get('/trending', getTrendingProducts);
router.get('/search', searchProducts);
router.get('/:id', getProductById);

// Protected routes (require authentication)
router.post('/', verifyToken, uploadProductImages, createProduct);
router.put('/:id', verifyToken, uploadProductImages, updateProduct);
router.delete('/:id', verifyToken, deleteProduct);

export default router;

