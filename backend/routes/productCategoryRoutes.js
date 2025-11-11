import express from 'express';
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoryTree,
  getFeaturedCategories,
  uploadCategoryImage
} from '../controllers/productCategoryController.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Public routes
router.get('/', getCategories);
router.get('/tree', getCategoryTree);
router.get('/featured', getFeaturedCategories);
router.get('/:id', getCategoryById);

// Protected routes
router.post('/', verifyToken, uploadCategoryImage, createCategory);
router.put('/:id', verifyToken, uploadCategoryImage, updateCategory);
router.delete('/:id', verifyToken, deleteCategory);

export default router;

