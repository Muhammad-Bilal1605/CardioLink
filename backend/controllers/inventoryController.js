import PharmacyInventory from '../models/PharmacyInventory.js';
import Product from '../models/Product.js';
import Pharmacy from '../models/Pharmacy.js';

// Get inventory for a pharmacy
export const getPharmacyInventory = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { 
      stockStatus, 
      search,
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    let query = { pharmacy: pharmacyId };

    // Stock status filter
    if (stockStatus) {
      query.stockStatus = stockStatus;
    }

    // Search filter
    if (search) {
      const products = await Product.find({
        $text: { $search: search }
      }).select('_id');
      
      query.product = { $in: products.map(p => p._id) };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count
    const total = await PharmacyInventory.countDocuments(query);

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const inventory = await PharmacyInventory.find(query)
      .populate('product')
      .populate('pharmacy', 'pharmacyName')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total: total
      }
    });
  } catch (error) {
    console.error('Error getting pharmacy inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory'
    });
  }
};

// Get single inventory item
export const getInventoryItem = async (req, res) => {
  try {
    const inventory = await PharmacyInventory.findById(req.params.id)
      .populate('product')
      .populate('pharmacy', 'pharmacyName');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error getting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory item'
    });
  }
};

// Add product to inventory
export const addToInventory = async (req, res) => {
  try {
    const inventoryData = req.body;

    // Check if product already exists in pharmacy inventory
    const existingInventory = await PharmacyInventory.findOne({
      pharmacy: inventoryData.pharmacy,
      product: inventoryData.product
    });

    if (existingInventory) {
      return res.status(400).json({
        success: false,
        message: 'Product already exists in inventory. Use update endpoint to modify.'
      });
    }

    const inventory = new PharmacyInventory(inventoryData);
    await inventory.save();

    const populatedInventory = await PharmacyInventory.findById(inventory._id)
      .populate('product')
      .populate('pharmacy', 'pharmacyName');

    res.status(201).json({
      success: true,
      message: 'Product added to inventory successfully',
      data: populatedInventory
    });
  } catch (error) {
    console.error('Error adding to inventory:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add product to inventory'
    });
  }
};

// Update inventory item
export const updateInventory = async (req, res) => {
  try {
    const inventory = await PharmacyInventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('product').populate('pharmacy', 'pharmacyName');

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory updated successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error updating inventory:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to update inventory'
    });
  }
};

// Add stock to inventory
export const addStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, batchInfo } = req.body;

    console.log('Add Stock Request:', { id, quantity, batchInfo });

    const inventory = await PharmacyInventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    // Validate required fields
    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    if (!batchInfo || !batchInfo.batchNumber) {
      return res.status(400).json({
        success: false,
        message: 'Batch number is required'
      });
    }

    if (!batchInfo.expiryDate) {
      return res.status(400).json({
        success: false,
        message: 'Expiry date is required'
      });
    }

    if (!batchInfo.purchasePrice || batchInfo.purchasePrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid purchase price is required'
      });
    }

    await inventory.addStock(quantity, batchInfo);

    const updatedInventory = await PharmacyInventory.findById(id)
      .populate('product')
      .populate('pharmacy', 'pharmacyName');

    res.status(200).json({
      success: true,
      message: 'Stock added successfully',
      data: updatedInventory
    });
  } catch (error) {
    console.error('Error adding stock:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to add stock',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Deduct stock from inventory
export const deductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const inventory = await PharmacyInventory.findById(id);
    
    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await inventory.deductStock(quantity);

    const updatedInventory = await PharmacyInventory.findById(id)
      .populate('product')
      .populate('pharmacy', 'pharmacyName');

    res.status(200).json({
      success: true,
      message: 'Stock deducted successfully',
      data: updatedInventory
    });
  } catch (error) {
    console.error('Error deducting stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to deduct stock'
    });
  }
};

// Delete inventory item
export const deleteInventoryItem = async (req, res) => {
  try {
    const inventory = await PharmacyInventory.findByIdAndUpdate(
      req.params.id,
      { isAvailable: false, availableForSale: false },
      { new: true }
    );

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Inventory item removed successfully',
      data: inventory
    });
  } catch (error) {
    console.error('Error deleting inventory item:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete inventory item'
    });
  }
};

// Get low stock items
export const getLowStockItems = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const inventory = await PharmacyInventory.findLowStock(pharmacyId);

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Error getting low stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve low stock items'
    });
  }
};

// Get out of stock items
export const getOutOfStockItems = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const inventory = await PharmacyInventory.findOutOfStock(pharmacyId);

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Error getting out of stock items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve out of stock items'
    });
  }
};

// Get items expiring soon
export const getExpiringSoonItems = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { days = 90 } = req.query;
    
    const inventory = await PharmacyInventory.findExpiringSoon(pharmacyId, parseInt(days));

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory
    });
  } catch (error) {
    console.error('Error getting expiring items:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve expiring items'
    });
  }
};

// Check product availability
export const checkAvailability = async (req, res) => {
  try {
    const { pharmacyId, productId } = req.params;
    const { quantity = 1 } = req.query;

    const inventory = await PharmacyInventory.checkAvailability(
      pharmacyId,
      productId,
      parseInt(quantity)
    );

    if (!inventory) {
      return res.status(200).json({
        success: true,
        available: false,
        message: 'Product not available in required quantity'
      });
    }

    res.status(200).json({
      success: true,
      available: true,
      data: inventory
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability'
    });
  }
};

// Get inventory statistics
export const getInventoryStats = async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    console.log('Getting inventory stats for pharmacy:', pharmacyId);

    // Use simple count queries instead of aggregation for better reliability
    const totalProducts = await PharmacyInventory.countDocuments({ 
      pharmacy: pharmacyId 
    });

    const inventory = await PharmacyInventory.find({ 
      pharmacy: pharmacyId 
    }).select('stockQuantity pricing stockStatus');

    let totalStock = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let inStockCount = 0;

    inventory.forEach(item => {
      totalStock += item.stockQuantity || 0;
      totalValue += (item.stockQuantity || 0) * (item.pricing?.costPrice || 0);
      
      if (item.stockStatus === 'Low Stock') lowStockCount++;
      else if (item.stockStatus === 'Out of Stock') outOfStockCount++;
      else if (item.stockStatus === 'In Stock') inStockCount++;
    });

    const stats = {
      totalProducts,
      totalStock,
      totalValue: Math.round(totalValue * 100) / 100, // Round to 2 decimal places
      lowStockCount,
      outOfStockCount,
      inStockCount
    };

    console.log('Inventory stats:', stats);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve inventory statistics'
    });
  }
};

