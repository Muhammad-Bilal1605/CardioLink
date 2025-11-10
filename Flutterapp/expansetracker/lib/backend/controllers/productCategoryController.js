import ProductCategory from '../models/ProductCategory.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for category images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/categories');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'category-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

export const uploadCategoryImage = upload.single('image');

// Create category
export const createCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    // Parse JSON fields
    if (categoryData.seo && typeof categoryData.seo === 'string') {
      try {
        categoryData.seo = JSON.parse(categoryData.seo);
      } catch (e) {
        console.log('Failed to parse seo:', e.message);
      }
    }

    // Handle image upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'cardiolink/categories'
        });
        categoryData.image = result.secure_url;
      } finally {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
    }

    const category = new ProductCategory(categoryData);
    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create category'
    });
  }
};

// Get all categories
export const getCategories = async (req, res) => {
  try {
    const { 
      parentCategory, 
      isActive,
      isFeatured,
      page = 1, 
      limit = 50 
    } = req.query;

    let query = {};

    if (parentCategory !== undefined) {
      query.parentCategory = parentCategory === 'null' ? null : parentCategory;
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (isFeatured !== undefined) {
      query.isFeatured = isFeatured === 'true';
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await ProductCategory.countDocuments(query);

    const categories = await ProductCategory.find(query)
      .populate('parentCategory', 'categoryName slug')
      .sort({ displayOrder: 1, categoryName: 1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total
      }
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve categories'
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await ProductCategory.findById(req.params.id)
      .populate('parentCategory', 'categoryName slug')
      .populate('subcategories');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error getting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category'
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const categoryData = req.body;

    // Parse JSON fields
    if (categoryData.seo && typeof categoryData.seo === 'string') {
      try {
        categoryData.seo = JSON.parse(categoryData.seo);
      } catch (e) {
        console.log('Failed to parse seo:', e.message);
      }
    }

    // Handle image upload
    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path, {
          resource_type: 'auto',
          folder: 'cardiolink/categories'
        });
        categoryData.image = result.secure_url;
      } finally {
        try { fs.unlinkSync(req.file.path); } catch (_) {}
      }
    }

    const category = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      categoryData,
      { new: true, runValidators: true }
    ).populate('parentCategory', 'categoryName slug');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update category'
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const category = await ProductCategory.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
      data: category
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category'
    });
  }
};

// Get category tree
export const getCategoryTree = async (req, res) => {
  try {
    const categories = await ProductCategory.getCategoryTree();

    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting category tree:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve category tree'
    });
  }
};

// Get featured categories
export const getFeaturedCategories = async (req, res) => {
  try {
    const categories = await ProductCategory.getFeatured();

    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error('Error getting featured categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured categories'
    });
  }
};

