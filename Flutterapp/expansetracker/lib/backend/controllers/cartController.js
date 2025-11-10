import mongoose from 'mongoose';
import Cart from '../models/Cart.js';
import PharmacyInventory from '../models/PharmacyInventory.js';
import Product from '../models/Product.js';

const roundToTwo = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

const populateCart = async (cart) => {
  if (!cart) return null;

  return cart.populate([
    {
      path: 'pharmacy',
      select: 'pharmacyName address images phoneNumber contactEmail'
    },
    {
      path: 'items.product',
      select: 'productName brandName genericName manufacturer dosageForm packaging strength images mrp requiresPrescription'
    },
    {
      path: 'items.inventoryItem',
      select: 'stockQuantity stockStatus isAvailable pricing finalPrice batches'
    }
  ]);
};

const updateCartTotals = (cart) => {
  if (!cart) return;

  let itemsTotal = 0;
  let totalDiscount = 0;

  cart.items = cart.items.filter(item => item.quantity > 0);

  cart.items.forEach((item) => {
    const price = Number(item.price || 0);
    const discount = Number(item.discountAmount || 0);
    const quantity = Number(item.quantity || 0);
    item.subtotal = roundToTwo((price * quantity) - discount);
    itemsTotal += price * quantity;
    totalDiscount += discount;
  });

  cart.itemsTotal = roundToTwo(itemsTotal);
  cart.totalDiscount = roundToTwo(totalDiscount);
  cart.deliveryCharges = cart.items.length > 0 ? 50 : 0;
  cart.taxAmount = roundToTwo(cart.itemsTotal * 0.05);
  cart.totalAmount = roundToTwo(cart.itemsTotal - cart.totalDiscount + cart.deliveryCharges + cart.taxAmount);
  cart.requiresPrescription = cart.items.some(item => item.prescriptionRequired);
  cart.lastActivityAt = new Date();
};

const sanitizeProduct = (product) => {
  if (!product) return null;
  return {
    id: product._id?.toString() ?? null,
    productName: product.productName,
    brandName: product.brandName,
    genericName: product.genericName,
    manufacturer: product.manufacturer,
    dosageForm: product.dosageForm,
    packaging: product.packaging,
    strength: product.strength,
    images: product.images,
    mrp: product.mrp,
    requiresPrescription: product.requiresPrescription ?? false,
  };
};

const sanitizeInventory = (inventoryItem) => {
  if (!inventoryItem) return null;
  return {
    id: inventoryItem._id?.toString() ?? null,
    stockQuantity: inventoryItem.stockQuantity ?? 0,
    stockStatus: inventoryItem.stockStatus,
    isAvailable: inventoryItem.isAvailable,
    sellingPrice: inventoryItem.pricing?.sellingPrice ?? null,
    mrp: inventoryItem.pricing?.mrp ?? null,
    finalPrice: inventoryItem.finalPrice ?? null,
  };
};

const formatCartResponse = (cart) => {
  if (!cart) {
    return {
      id: null,
      pharmacyId: null,
      pharmacy: null,
      items: [],
      itemCount: 0,
      itemsTotal: 0,
      totalDiscount: 0,
      deliveryCharges: 0,
      taxAmount: 0,
      totalAmount: 0,
      requiresPrescription: false,
      appliedCoupon: null,
      updatedAt: null,
    };
  }

  const cartObj = cart.toObject({ virtuals: true });
  const items = (cartObj.items || []).map((item) => {
    const inventory = item.inventoryItem || item.inventory;
    const availableQuantity = inventory?.stockQuantity ?? 0;

    const productDoc = item.product;
    const inventoryDoc = item.inventoryItem || item.inventory;
    const productPlain = productDoc?.toObject ? productDoc.toObject() : (productDoc || {});
    const inventoryPlain = inventoryDoc?.toObject ? inventoryDoc.toObject() : (inventoryDoc || {});

    return {
      productId: item.product?._id?.toString() ?? item.product?.toString(),
      inventoryItemId: inventory?._id?.toString() ?? inventory?.toString(),
      quantity: item.quantity,
      price: item.price,
      discountAmount: item.discountAmount ?? 0,
      subtotal: item.subtotal ?? 0,
      prescriptionRequired: item.prescriptionRequired ?? false,
      prescriptionUploaded: item.prescriptionUploaded ?? false,
      product: sanitizeProduct(productPlain),
      inventory: sanitizeInventory(inventoryPlain),
      availableQuantity: availableQuantity < 0 ? 0 : availableQuantity,
    };
  });

  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return {
    id: cartObj._id?.toString(),
    pharmacyId: cartObj.pharmacy?._id?.toString() ?? cartObj.pharmacy?.toString(),
    pharmacy: cartObj.pharmacy ? {
      id: cartObj.pharmacy._id?.toString(),
      pharmacyName: cartObj.pharmacy.pharmacyName,
      address: cartObj.pharmacy.address,
      images: cartObj.pharmacy.images,
      phoneNumber: cartObj.pharmacy.phoneNumber,
      contactEmail: cartObj.pharmacy.contactEmail,
    } : null,
    items,
    itemCount,
    itemsTotal: cartObj.itemsTotal ?? 0,
    totalDiscount: cartObj.totalDiscount ?? 0,
    deliveryCharges: cartObj.deliveryCharges ?? 0,
    taxAmount: cartObj.taxAmount ?? 0,
    totalAmount: cartObj.totalAmount ?? 0,
    requiresPrescription: cartObj.requiresPrescription ?? false,
    appliedCoupon: cartObj.appliedCoupon ?? null,
    updatedAt: cartObj.updatedAt,
  };
};

export const getCart = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pharmacy ID'
      });
    }

    // Atomic upsert to avoid duplicate key races on (user, pharmacy)
    let cart = await Cart.findOneAndUpdate(
      { user: req.userId, pharmacy: pharmacyId },
      { 
        $setOnInsert: { user: req.userId, pharmacy: pharmacyId },
        $set: { status: 'Active' }
      },
      { new: true, upsert: true }
    );
    cart = await populateCart(cart);

    return res.json({
      success: true,
      data: formatCartResponse(cart)
    });
  } catch (error) {
    // Handle duplicate key race by retrying a simple find path
    if (error?.code === 11000) {
      try {
        const { pharmacyId } = req.params;
        const cart = await Cart.findOne({ user: req.userId, pharmacy: pharmacyId, status: 'Active' });
        const populated = await populateCart(cart);
        return res.json({
          success: true,
          data: formatCartResponse(populated)
        });
      } catch (e) {
        console.error('Cart duplicate retry failed:', e);
      }
    }
    console.error('Error getting cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load cart'
    });
  }
};

export const addItemToCart = async (req, res) => {
  try {
    const { pharmacyId } = req.params;
    const { productId, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pharmacyId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pharmacy or product ID'
      });
    }

    const parsedQuantity = Number(quantity) || 1;
    if (parsedQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const [inventory, product] = await Promise.all([
      PharmacyInventory.findOne({ pharmacy: pharmacyId, product: productId, isAvailable: true }),
      Product.findById(productId).select('requiresPrescription')
    ]);

    if (!inventory || !product) {
      return res.status(404).json({
        success: false,
        message: 'Product not available in inventory'
      });
    }

    if (inventory.stockQuantity <= 0) {
      return res.status(409).json({
        success: false,
        message: 'Product is currently out of stock'
      });
    }

    let cart = await Cart.getOrCreateCart(req.userId, pharmacyId);
    const existingItem = cart.items.find(item => item.product.toString() === productId.toString());
    const newQuantity = (existingItem?.quantity || 0) + parsedQuantity;

    if (newQuantity > inventory.stockQuantity) {
      return res.status(409).json({
        success: false,
        message: `Only ${inventory.stockQuantity} unit(s) available in stock`
      });
    }

    const price =
      inventory.pricing?.sellingPrice ??
      inventory.pricing?.mrp ??
      inventory.finalPrice ??
      product.mrp ??
      0;

    if (existingItem) {
      existingItem.quantity = newQuantity;
      existingItem.price = price;
      existingItem.inventoryItem = inventory._id;
      existingItem.prescriptionRequired = product.requiresPrescription ?? false;
    } else {
      cart.items.push({
        product: productId,
        inventoryItem: inventory._id,
        quantity: parsedQuantity,
        price,
        discountAmount: 0,
        subtotal: roundToTwo(price * parsedQuantity),
        prescriptionRequired: product.requiresPrescription ?? false,
        prescriptionUploaded: false
      });
    }

    updateCartTotals(cart);
    cart = await cart.save();
    cart = await populateCart(cart);

    return res.json({
      success: true,
      message: 'Item added to cart',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add item to cart'
    });
  }
};

export const updateCartItemQuantity = async (req, res) => {
  try {
    const { pharmacyId, productId } = req.params;
    const { quantity } = req.body;

    if (!mongoose.Types.ObjectId.isValid(pharmacyId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pharmacy or product ID'
      });
    }

    const parsedQuantity = Number(quantity);
    if (isNaN(parsedQuantity) || parsedQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be zero or greater'
      });
    }

    // Ensure cart exists even if created through reorder/upsert flow
    let cart = await Cart.findOneAndUpdate(
      { user: req.userId, pharmacy: pharmacyId },
      { $setOnInsert: { user: req.userId, pharmacy: pharmacyId } },
      { new: true, upsert: true }
    );

    // Match by product OR inventory item id (reorder may store inventoryItem ref)
    let item = cart.items.find(ci => ci.product?.toString() === productId.toString());
    if (!item) item = cart.items.find(ci => ci.inventoryItem?.toString() === productId.toString());
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    if (parsedQuantity === 0) {
      cart.items = cart.items.filter(ci =>
        ci.product?.toString() !== productId.toString() &&
        ci.inventoryItem?.toString() !== productId.toString()
      );
    } else {
      // Resolve product id for inventory lookup from the item itself
      const resolvedProductId = item.product?.toString() || productId.toString();
      const inventory = await PharmacyInventory.findOne({
        pharmacy: pharmacyId,
        product: resolvedProductId,
        isAvailable: true
      });

      if (!inventory) {
        return res.status(404).json({
          success: false,
          message: 'Product not available in inventory'
        });
      }

      if (parsedQuantity > inventory.stockQuantity) {
        return res.status(409).json({
          success: false,
          message: `Only ${inventory.stockQuantity} unit(s) available in stock`
        });
      }

      item.quantity = parsedQuantity;
      item.price =
        inventory.pricing?.sellingPrice ??
        inventory.pricing?.mrp ??
        inventory.finalPrice ??
        item.price;
      item.inventoryItem = inventory._id;
      item.subtotal = roundToTwo((item.price * item.quantity) - (item.discountAmount || 0));
    }

    updateCartTotals(cart);
    cart = await cart.save();
    cart = await populateCart(cart);

    return res.json({
      success: true,
      message: 'Cart updated successfully',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update cart item'
    });
  }
};

export const removeItemFromCart = async (req, res) => {
  try {
    const { pharmacyId, productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pharmacyId) || !mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pharmacy or product ID'
      });
    }

    // Ensure cart exists even if created through reorder/upsert flow
    let cart = await Cart.findOneAndUpdate(
      { user: req.userId, pharmacy: pharmacyId },
      { $setOnInsert: { user: req.userId, pharmacy: pharmacyId } },
      { new: true, upsert: true }
    );

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(ci =>
      ci.product?.toString() !== productId.toString() &&
      ci.inventoryItem?.toString() !== productId.toString()
    );

    if (cart.items.length === initialLength) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    updateCartTotals(cart);
    cart = await cart.save();
    cart = await populateCart(cart);

    return res.json({
      success: true,
      message: 'Item removed from cart',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to remove item from cart'
    });
  }
};

export const clearCart = async (req, res) => {
  try {
    const { pharmacyId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pharmacyId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pharmacy ID'
      });
    }

    let cart = await Cart.findOne({ user: req.userId, pharmacy: pharmacyId, status: 'Active' });
    if (!cart) {
      // Nothing to clear, return empty cart
      cart = await Cart.getOrCreateCart(req.userId, pharmacyId);
      cart = await populateCart(cart);
      return res.json({
        success: true,
        message: 'Cart already empty',
        data: formatCartResponse(cart)
      });
    }

    cart.items = [];
    cart.appliedCoupon = undefined;
    cart.prescriptions = [];
    cart.deliveryCharges = 0;
    cart.taxAmount = 0;
    updateCartTotals(cart);

    cart = await cart.save();
    cart = await populateCart(cart);

    return res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: formatCartResponse(cart)
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to clear cart'
    });
  }
};

