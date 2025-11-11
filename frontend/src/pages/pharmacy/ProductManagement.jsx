import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  X,
  Upload,
  AlertCircle
} from 'lucide-react';

const ProductManagement = () => {
  const { user } = useAuthStore();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  // Category options as enum
  const categories = [
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
  ];
  
  const [formData, setFormData] = useState({
    productName: '',
    genericName: '',
    brandName: '',
    manufacturer: '',
    category: '',
    composition: { activeIngredients: [{ name: '', strength: '', unit: 'mg' }] },
    dosageForm: 'Tablet',
    strength: '',
    packaging: { packSize: '', unit: 'Tablet(s)' },
    requiresPrescription: false,
    prescriptionType: 'OTC',
    description: '',
    uses: '',
    sideEffects: '',
    warnings: '',
    precautions: '',
    dosageInstructions: '',
    storageInstructions: 'Store in a cool, dry place away from direct sunlight',
    mrp: '',
    tags: [],
    therapeuticClass: '',
    interactions: '',
    contraindications: ''
  });

  const [images, setImages] = useState({ primary: null, secondary: [] });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, categoryFilter, pagination.current]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { category: categoryFilter })
      });

      const response = await axios.get(`http://localhost:5000/api/products?${params}`, {
        withCredentials: true
      });

      if (response.data.success) {
        setProducts(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNestedInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...formData.composition.activeIngredients];
    newIngredients[index][field] = value;
    setFormData(prev => ({
      ...prev,
      composition: { ...prev.composition, activeIngredients: newIngredients }
    }));
  };

  const addIngredient = () => {
    setFormData(prev => ({
      ...prev,
      composition: {
        ...prev.composition,
        activeIngredients: [...prev.composition.activeIngredients, { name: '', strength: '', unit: 'mg' }]
      }
    }));
  };

  const removeIngredient = (index) => {
    setFormData(prev => ({
      ...prev,
      composition: {
        ...prev.composition,
        activeIngredients: prev.composition.activeIngredients.filter((_, i) => i !== index)
      }
    }));
  };

  const handleImageChange = (e, type) => {
    const files = e.target.files;
    if (type === 'primary') {
      setImages(prev => ({ ...prev, primary: files[0] }));
    } else {
      setImages(prev => ({ ...prev, secondary: Array.from(files) }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.productName) newErrors.productName = 'Product name is required';
    if (!formData.manufacturer) newErrors.manufacturer = 'Manufacturer is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.dosageForm) newErrors.dosageForm = 'Dosage form is required';
    if (!formData.strength) newErrors.strength = 'Strength is required';
    if (!formData.packaging.packSize) newErrors.packSize = 'Pack size is required';
    if (!formData.mrp) newErrors.mrp = 'MRP is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const formDataToSend = new FormData();
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && !Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else if (Array.isArray(formData[key])) {
          formDataToSend.append(key, JSON.stringify(formData[key]));
        } else {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add images
      if (images.primary) {
        formDataToSend.append('primaryImage', images.primary);
      }
      images.secondary.forEach(img => {
        formDataToSend.append('secondaryImages', img);
      });

      let response;
      if (editingProduct) {
        response = await axios.put(
          `http://localhost:5000/api/products/${editingProduct._id}`,
          formDataToSend,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      } else {
        response = await axios.post(
          'http://localhost:5000/api/products',
          formDataToSend,
          { 
            withCredentials: true,
            headers: { 'Content-Type': 'multipart/form-data' }
          }
        );
      }

      if (response.data.success) {
        setShowModal(false);
        resetForm();
        fetchProducts();
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Failed to save product');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      productName: product.productName || '',
      genericName: product.genericName || '',
      brandName: product.brandName || '',
      manufacturer: product.manufacturer || '',
      category: product.category || '',
      composition: product.composition || { activeIngredients: [{ name: '', strength: '', unit: 'mg' }] },
      dosageForm: product.dosageForm || 'Tablet',
      strength: product.strength || '',
      packaging: product.packaging || { packSize: '', unit: 'Tablet(s)' },
      requiresPrescription: product.requiresPrescription || false,
      prescriptionType: product.prescriptionType || 'OTC',
      description: product.description || '',
      uses: product.uses || '',
      sideEffects: product.sideEffects || '',
      warnings: product.warnings || '',
      precautions: product.precautions || '',
      dosageInstructions: product.dosageInstructions || '',
      storageInstructions: product.storageInstructions || 'Store in a cool, dry place away from direct sunlight',
      mrp: product.mrp || '',
      tags: product.tags || [],
      therapeuticClass: product.therapeuticClass || '',
      interactions: product.interactions || '',
      contraindications: product.contraindications || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    try {
      const response = await axios.delete(`http://localhost:5000/api/products/${id}`, {
        withCredentials: true
      });

      if (response.data.success) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    }
  };

  const resetForm = () => {
    setFormData({
      productName: '',
      genericName: '',
      brandName: '',
      manufacturer: '',
      category: '',
      composition: { activeIngredients: [{ name: '', strength: '', unit: 'mg' }] },
      dosageForm: 'Tablet',
      strength: '',
      packaging: { packSize: '', unit: 'Tablet(s)' },
      requiresPrescription: false,
      prescriptionType: 'OTC',
      description: '',
      uses: '',
      sideEffects: '',
      warnings: '',
      precautions: '',
      dosageInstructions: '',
      storageInstructions: 'Store in a cool, dry place away from direct sunlight',
      mrp: '',
      tags: [],
      therapeuticClass: '',
      interactions: '',
      contraindications: ''
    });
    setImages({ primary: null, secondary: [] });
    setEditingProduct(null);
    setErrors({});
  };

  const ProductCard = ({ product }) => (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
      <div className="p-4">
        {/* Product Image */}
        <div className="w-full h-40 bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
          {product.images?.primary ? (
            <img 
              src={product.images.primary} 
              alt={product.productName}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-16 h-16 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 truncate">{product.productName}</h3>
          {product.brandName && (
            <p className="text-sm text-gray-600">Brand: {product.brandName}</p>
          )}
          <p className="text-sm text-gray-600">
            {product.strength} | {product.packaging.packSize} {product.packaging.unit}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-purple-600">Rs. {product.mrp}</span>
            {product.requiresPrescription && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                Rx
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 mt-4">
          <button
            onClick={() => handleEdit(product)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            <Edit className="w-4 h-4 mr-1" />
            Edit
          </button>
          <button
            onClick={() => handleDelete(product._id)}
            className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
          <p className="text-gray-600">Manage your pharmacy products</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
              <div className="w-full h-40 bg-gray-300 rounded-lg mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Add your first product to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
              disabled={pagination.current === 1}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            
            {[...Array(pagination.pages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => setPagination(prev => ({ ...prev, current: index + 1 }))}
                className={`px-3 py-2 border text-sm font-medium rounded-md ${
                  pagination.current === index + 1
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
              disabled={pagination.current === pagination.pages}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between z-10">
              <h3 className="text-xl font-bold text-gray-900">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h3>
              <button
                onClick={() => { setShowModal(false); resetForm(); }}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Information */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.productName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.productName && (
                      <p className="text-red-500 text-xs mt-1">{errors.productName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Brand Name
                    </label>
                    <input
                      type="text"
                      name="brandName"
                      value={formData.brandName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer *
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.manufacturer ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.manufacturer && (
                      <p className="text-red-500 text-xs mt-1">{errors.manufacturer}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.category ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Category</option>
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="text-red-500 text-xs mt-1">{errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Dosage Form *
                    </label>
                    <select
                      name="dosageForm"
                      value={formData.dosageForm}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {['Tablet', 'Capsule', 'Syrup', 'Suspension', 'Injection', 'Drops', 'Cream', 'Ointment', 'Gel', 'Lotion', 'Spray', 'Inhaler', 'Powder', 'Sachet', 'Other'].map(form => (
                        <option key={form} value={form}>{form}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Composition */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Composition</h4>
                <div className="space-y-3">
                  {formData.composition.activeIngredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="Ingredient name"
                        value={ingredient.name}
                        onChange={(e) => handleIngredientChange(index, 'name', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <input
                        type="text"
                        placeholder="Strength"
                        value={ingredient.strength}
                        onChange={(e) => handleIngredientChange(index, 'strength', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                      <select
                        value={ingredient.unit}
                        onChange={(e) => handleIngredientChange(index, 'unit', e.target.value)}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {['mg', 'g', 'mcg', 'ml', 'IU', '%', 'other'].map(unit => (
                          <option key={unit} value={unit}>{unit}</option>
                        ))}
                      </select>
                      {formData.composition.activeIngredients.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeIngredient(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addIngredient}
                    className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                  >
                    + Add Another Ingredient
                  </button>
                </div>
              </div>

              {/* Packaging & Pricing */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Packaging & Pricing</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Strength *
                    </label>
                    <input
                      type="text"
                      name="strength"
                      value={formData.strength}
                      onChange={handleInputChange}
                      placeholder="e.g., 500mg"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.strength ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pack Size *
                    </label>
                    <input
                      type="text"
                      value={formData.packaging.packSize}
                      onChange={(e) => handleNestedInputChange('packaging.packSize', e.target.value)}
                      placeholder="e.g., 10"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.packSize ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pack Unit
                    </label>
                    <select
                      value={formData.packaging.unit}
                      onChange={(e) => handleNestedInputChange('packaging.unit', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      {['Tablet(s)', 'Capsule(s)', 'ml', 'g', 'Piece(s)', 'Unit(s)', 'Strip(s)', 'Bottle(s)', 'Vial(s)', 'Tube(s)', 'Other'].map(unit => (
                        <option key={unit} value={unit}>{unit}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      MRP (PKR) *
                    </label>
                    <input
                      type="number"
                      name="mrp"
                      value={formData.mrp}
                      onChange={handleInputChange}
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        errors.mrp ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="requiresPrescription"
                        checked={formData.requiresPrescription}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Requires Prescription
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, 'primary')}
                        className="hidden"
                        id="primaryImage"
                      />
                      <label htmlFor="primaryImage" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {images.primary ? images.primary.name : 'Click to upload primary image'}
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Images
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-purple-500 transition-colors cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => handleImageChange(e, 'secondary')}
                        className="hidden"
                        id="secondaryImages"
                      />
                      <label htmlFor="secondaryImages" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {images.secondary.length > 0 
                            ? `${images.secondary.length} files selected` 
                            : 'Click to upload additional images'}
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description Fields */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Uses
                    </label>
                    <textarea
                      name="uses"
                      value={formData.uses}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Side Effects
                    </label>
                    <textarea
                      name="sideEffects"
                      value={formData.sideEffects}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;

