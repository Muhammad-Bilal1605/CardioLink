import mongoose from 'mongoose';

const productCategorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true,
    maxLength: [100, 'Category name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    maxLength: [500, 'Description cannot exceed 500 characters']
  },
  parentCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductCategory',
    default: null
  },
  icon: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    trim: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  
  // SEO fields
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
  productCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
productCategorySchema.index({ categoryName: 1 });
productCategorySchema.index({ slug: 1 });
productCategorySchema.index({ parentCategory: 1 });
productCategorySchema.index({ isActive: 1 });
productCategorySchema.index({ displayOrder: 1 });
productCategorySchema.index({ isFeatured: -1, displayOrder: 1 });

// Virtual for subcategories
productCategorySchema.virtual('subcategories', {
  ref: 'ProductCategory',
  localField: '_id',
  foreignField: 'parentCategory'
});

// Virtual for full category path
productCategorySchema.virtual('fullPath').get(function() {
  return this.slug;
});

// Pre-save middleware to generate slug
productCategorySchema.pre('save', function(next) {
  if (this.isModified('categoryName')) {
    this.slug = this.categoryName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Static method to get category tree
productCategorySchema.statics.getCategoryTree = async function() {
  const categories = await this.find({ isActive: true })
    .sort({ displayOrder: 1 })
    .populate('subcategories');
  
  return categories.filter(cat => !cat.parentCategory);
};

// Static method to get featured categories
productCategorySchema.statics.getFeatured = function() {
  return this.find({ isFeatured: true, isActive: true })
    .sort({ displayOrder: 1 })
    .limit(10);
};

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema);

export default ProductCategory;

