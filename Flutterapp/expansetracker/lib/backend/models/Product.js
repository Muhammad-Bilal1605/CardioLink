import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  // Basic Product Information
  productName: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxLength: [300, 'Product name cannot exceed 300 characters']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  genericName: {
    type: String,
    trim: true,
    maxLength: [300, 'Generic name cannot exceed 300 characters']
  },
  brandName: {
    type: String,
    trim: true,
    maxLength: [200, 'Brand name cannot exceed 200 characters']
  },
  manufacturer: {
    type: String,
    required: [true, 'Manufacturer is required'],
    trim: true,
    maxLength: [200, 'Manufacturer name cannot exceed 200 characters']
  },
  
  // Category
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Prescription Medicines',
      'OTC Medicines',
      'Medical Equipment',
      'Surgical Items',
      'Baby Care',
      'Personal Care',
      'Health Supplements',
      'First Aid',
      'Diabetic Care',
      'Wellness Products',
      'Other'
    ]
  },
  
  // Medicine Specific Details
  composition: {
    activeIngredients: [{
      name: {
        type: String,
        trim: true,
        required: true
      },
      strength: {
        type: String,
        trim: true,
        required: true
      },
      unit: {
        type: String,
        enum: ['mg', 'g', 'mcg', 'ml', 'IU', '%', 'other'],
        default: 'mg'
      }
    }],
    inactiveIngredients: {
      type: String,
      trim: true
    }
  },

  dosageForm: {
    type: String,
    required: [true, 'Dosage form is required'],
    enum: [
      'Tablet',
      'Capsule',
      'Syrup',
      'Suspension',
      'Injection',
      'Drops',
      'Cream',
      'Ointment',
      'Gel',
      'Lotion',
      'Spray',
      'Inhaler',
      'Powder',
      'Sachet',
      'Suppository',
      'Patch',
      'Solution',
      'Other'
    ]
  },

  strength: {
    type: String,
    required: [true, 'Strength is required'],
    trim: true
  },

  // Packaging
  packaging: {
    packSize: {
      type: String,
      required: [true, 'Pack size is required'],
      trim: true
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['Tablet(s)', 'Capsule(s)', 'ml', 'g', 'Piece(s)', 'Unit(s)', 'Strip(s)', 'Bottle(s)', 'Vial(s)', 'Tube(s)', 'Other'],
      default: 'Piece(s)'
    }
  },

  // Prescription Requirement
  requiresPrescription: {
    type: Boolean,
    required: [true, 'Prescription requirement must be specified'],
    default: false
  },
  prescriptionType: {
    type: String,
    enum: ['OTC', 'Prescription Only', 'Controlled Substance', 'Schedule H', 'Schedule X'],
    default: 'OTC'
  },

  // Product Description
  description: {
    type: String,
    trim: true,
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  uses: {
    type: String,
    trim: true,
    maxLength: [1000, 'Uses description cannot exceed 1000 characters']
  },
  sideEffects: {
    type: String,
    trim: true,
    maxLength: [1000, 'Side effects description cannot exceed 1000 characters']
  },
  warnings: {
    type: String,
    trim: true,
    maxLength: [1000, 'Warnings cannot exceed 1000 characters']
  },
  precautions: {
    type: String,
    trim: true,
    maxLength: [1000, 'Precautions cannot exceed 1000 characters']
  },
  dosageInstructions: {
    type: String,
    trim: true,
    maxLength: [1000, 'Dosage instructions cannot exceed 1000 characters']
  },
  storageInstructions: {
    type: String,
    trim: true,
    default: 'Store in a cool, dry place away from direct sunlight'
  },

  // Pricing (Base MRP - individual pharmacies can set their own prices)
  mrp: {
    type: Number,
    required: [true, 'MRP is required'],
    min: [0, 'MRP cannot be negative']
  },

  // Images
  images: {
    primary: {
      type: String,
      trim: true
    },
    secondary: [{
      type: String,
      trim: true
    }]
  },

  // Product Tags for Better Search
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],

  // Therapeutic Classification
  therapeuticClass: {
    type: String,
    trim: true
  },

  // Drug Interactions
  interactions: {
    type: String,
    trim: true,
    maxLength: [1000, 'Drug interactions cannot exceed 1000 characters']
  },

  // Contraindications
  contraindications: {
    type: String,
    trim: true,
    maxLength: [1000, 'Contraindications cannot exceed 1000 characters']
  },

  // Product Status
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isDiscontinued: {
    type: Boolean,
    default: false
  },

  // SEO
  seo: {
    metaTitle: {
      type: String,
      trim: true,
      maxLength: [60, 'Meta title cannot exceed 60 characters']
    },
    metaDescription: {
      type: String,
      trim: true,
      maxLength: [160, 'Meta description cannot exceed 160 characters']
    },
    keywords: [{
      type: String,
      trim: true
    }]
  },

  // Metrics
  metrics: {
    totalSales: {
      type: Number,
      default: 0
    },
    viewCount: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    reviewCount: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance and search
productSchema.index({ productName: 1 });
productSchema.index({ slug: 1 });
productSchema.index({ genericName: 1 });
productSchema.index({ brandName: 1 });
productSchema.index({ manufacturer: 1 });
productSchema.index({ category: 1 });
productSchema.index({ requiresPrescription: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: -1 });
productSchema.index({ 'metrics.averageRating': -1 });
productSchema.index({ 'metrics.totalSales': -1 });
productSchema.index({ createdAt: -1 });

// Compound indexes for common queries
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ isActive: 1, isFeatured: -1 });
productSchema.index({ requiresPrescription: 1, isActive: 1 });

// Text index for full-text search (THIS IS KEY FOR FAST SEARCH)
productSchema.index({
  productName: 'text',
  genericName: 'text',
  brandName: 'text',
  manufacturer: 'text',
  'composition.activeIngredients.name': 'text',
  therapeuticClass: 'text',
  tags: 'text',
  uses: 'text'
}, {
  weights: {
    productName: 10,
    genericName: 9,
    brandName: 8,
    'composition.activeIngredients.name': 7,
    manufacturer: 5,
    therapeuticClass: 4,
    tags: 3,
    uses: 2
  },
  name: 'ProductSearchIndex'
});

// Pre-save middleware to generate slug
productSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('productName')) {
    const slugBase = this.productName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // For new documents, generate a temporary slug; it will be updated after save with the _id
    if (this.isNew) {
      this.slug = `${slugBase}-${Date.now()}`;
    } else {
      this.slug = `${slugBase}-${this._id}`;
    }
  }
  next();
});

// Virtual for full product title
productSchema.virtual('fullTitle').get(function() {
  if (this.brandName) {
    return `${this.brandName} ${this.strength} - ${this.packaging.packSize} ${this.packaging.unit}`;
  }
  return `${this.productName} ${this.strength} - ${this.packaging.packSize} ${this.packaging.unit}`;
});

// Virtual for composition string
productSchema.virtual('compositionString').get(function() {
  if (!this.composition.activeIngredients || this.composition.activeIngredients.length === 0) {
    return '';
  }
  return this.composition.activeIngredients
    .map(ing => `${ing.name} ${ing.strength}${ing.unit}`)
    .join(' + ');
});

// Static method for search with filters
productSchema.statics.searchProducts = function(searchQuery, filters = {}) {
  const query = { isActive: true };
  
  // Text search
  if (searchQuery) {
    query.$text = { $search: searchQuery };
  }
  
  // Apply filters
  if (filters.category) {
    query.category = filters.category;
  }
  if (filters.requiresPrescription !== undefined) {
    query.requiresPrescription = filters.requiresPrescription;
  }
  if (filters.manufacturer) {
    query.manufacturer = new RegExp(filters.manufacturer, 'i');
  }
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    query.mrp = {};
    if (filters.minPrice !== undefined) query.mrp.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) query.mrp.$lte = filters.maxPrice;
  }
  
  let queryBuilder = this.find(query).populate('category');
  
  // Add text score for relevance sorting
  if (searchQuery) {
    queryBuilder = queryBuilder.select({ score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } });
  } else {
    queryBuilder = queryBuilder.sort({ 'metrics.totalSales': -1, 'metrics.averageRating': -1 });
  }
  
  return queryBuilder;
};

// Static method to get featured products
productSchema.statics.getFeatured = function(limit = 10) {
  return this.find({ isFeatured: true, isActive: true })
    .populate('category')
    .sort({ 'metrics.averageRating': -1, 'metrics.totalSales': -1 })
    .limit(limit);
};

// Static method to get trending products
productSchema.statics.getTrending = function(limit = 10) {
  return this.find({ isActive: true })
    .populate('category')
    .sort({ 'metrics.totalSales': -1, 'metrics.viewCount': -1 })
    .limit(limit);
};

// Instance method to increment view count
productSchema.methods.incrementViewCount = function() {
  this.metrics.viewCount += 1;
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;

