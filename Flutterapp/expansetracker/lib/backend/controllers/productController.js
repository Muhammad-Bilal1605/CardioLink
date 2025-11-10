import Product from '../models/Product.js';
import PharmacyInventory from '../models/PharmacyInventory.js';
import cloudinary from '../config/cloudinary.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for product images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

export const uploadProductImages = upload.fields([
  { name: 'primaryImage', maxCount: 1 },
  { name: 'secondaryImages', maxCount: 5 }
]);

// Create a new product
export const createProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Parse JSON fields if they come as strings from FormData
    const jsonFields = ['composition', 'packaging', 'seo', 'tags'];
    jsonFields.forEach(field => {
      if (productData[field] && typeof productData[field] === 'string') {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, e.message);
        }
      }
    });

    // Handle image uploads to Cloudinary
    if (req.files) {
      // Primary image
      if (req.files.primaryImage && req.files.primaryImage[0]) {
        const file = req.files.primaryImage[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/products'
          });
          if (!productData.images) productData.images = {};
          productData.images.primary = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Secondary images
      if (req.files.secondaryImages && req.files.secondaryImages.length > 0) {
        const uploadPromises = req.files.secondaryImages.map(async (file) => {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              resource_type: 'auto',
              folder: 'cardiolink/products'
            });
            return result.secure_url;
          } finally {
            try { fs.unlinkSync(file.path); } catch (_) {}
          }
        });
        
        const secondaryUrls = await Promise.all(uploadPromises);
        if (!productData.images) productData.images = {};
        productData.images.secondary = secondaryUrls;
      }
    }

    const product = new Product(productData);
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create product'
    });
  }
};

// Get all products (with filters and search)
export const getProducts = async (req, res) => {
  try {
    const { 
      search, 
      category, 
      requiresPrescription,
      manufacturer,
      minPrice,
      maxPrice,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Prescription filter
    if (requiresPrescription !== undefined) {
      query.requiresPrescription = requiresPrescription === 'true';
    }

    // Manufacturer filter
    if (manufacturer) {
      query.manufacturer = new RegExp(manufacturer, 'i');
    }

    // Price range filter
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.mrp = {};
      if (minPrice !== undefined) query.mrp.$gte = parseFloat(minPrice);
      if (maxPrice !== undefined) query.mrp.$lte = parseFloat(maxPrice);
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await Product.countDocuments(query);

    // Build query with sorting
    let sortOptions = {};
    if (search) {
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
    }

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total
      }
    });
  } catch (error) {
    console.error('Error getting products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve products'
    });
  }
};

// Get product by ID
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Increment view count
    await product.incrementViewCount();

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve product'
    });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const productData = req.body;

    // Parse JSON fields
    const jsonFields = ['composition', 'packaging', 'seo', 'tags'];
    jsonFields.forEach(field => {
      if (productData[field] && typeof productData[field] === 'string') {
        try {
          productData[field] = JSON.parse(productData[field]);
        } catch (e) {
          console.log(`Failed to parse ${field}:`, e.message);
        }
      }
    });

    // Handle image uploads
    if (req.files) {
      // Primary image
      if (req.files.primaryImage && req.files.primaryImage[0]) {
        const file = req.files.primaryImage[0];
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            resource_type: 'auto',
            folder: 'cardiolink/products'
          });
          if (!productData.images) productData.images = {};
          productData.images.primary = result.secure_url;
        } finally {
          try { fs.unlinkSync(file.path); } catch (_) {}
        }
      }

      // Secondary images
      if (req.files.secondaryImages && req.files.secondaryImages.length > 0) {
        const uploadPromises = req.files.secondaryImages.map(async (file) => {
          try {
            const result = await cloudinary.uploader.upload(file.path, {
              resource_type: 'auto',
              folder: 'cardiolink/products'
            });
            return result.secure_url;
          } finally {
            try { fs.unlinkSync(file.path); } catch (_) {}
          }
        });
        
        const secondaryUrls = await Promise.all(uploadPromises);
        if (!productData.images) productData.images = {};
        productData.images.secondary = secondaryUrls;
      }
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      productData,
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update product'
    });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Delete all inventory entries for this product
    const inventoryDeleteResult = await PharmacyInventory.deleteMany({
      product: req.params.id
    });

    console.log(`Deleted ${inventoryDeleteResult.deletedCount} inventory entries for product ${product.productName}`);

    // Mark product as inactive and discontinued
    product.isActive = false;
    product.isDiscontinued = true;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Product deleted successfully. Removed ${inventoryDeleteResult.deletedCount} inventory entries.`,
      data: {
        product,
        deletedInventoryCount: inventoryDeleteResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product'
    });
  }
};

// Get featured products
export const getFeaturedProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.getFeatured(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error getting featured products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve featured products'
    });
  }
};

// Get trending products
export const getTrendingProducts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await Product.getTrending(limit);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error getting trending products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve trending products'
    });
  }
};

// Search products
export const searchProducts = async (req, res) => {
  try {
    const { query, ...filters } = req.query;
    const products = await Product.searchProducts(query, filters);

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search products'
    });
  }
};

