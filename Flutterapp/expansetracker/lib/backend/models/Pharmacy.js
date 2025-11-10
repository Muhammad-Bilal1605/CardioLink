import mongoose from 'mongoose';

const pharmacySchema = new mongoose.Schema({
  // Basic Pharmacy Information
  pharmacyName: {
    type: String,
    required: [true, 'Pharmacy name is required'],
    trim: true,
    maxLength: [200, 'Pharmacy name cannot exceed 200 characters']
  },
  pharmacyType: {
    type: String,
    required: [true, 'Pharmacy type is required'],
    enum: ['Chain', 'Independent', 'Hospital Pharmacy', 'Online', 'Clinic Pharmacy', 'Other'],
    default: 'Independent'
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    maxLength: [50, 'Registration number cannot exceed 50 characters']
  },
  drugLicenseNumber: {
    type: String,
    required: [true, 'Drug license number is required'],
    unique: true,
    trim: true,
    maxLength: [50, 'Drug license number cannot exceed 50 characters']
  },
  yearEstablished: {
    type: Number,
    required: [true, 'Year established is required'],
    min: [1800, 'Year established must be after 1800'],
    max: [new Date().getFullYear(), 'Year established cannot be in the future']
  },
  ownershipType: {
    type: String,
    required: [true, 'Ownership type is required'],
    enum: ['Proprietorship', 'Partnership', 'Corporation', 'Franchise', 'Other'],
    default: 'Proprietorship'
  },

  // Operating Information
  operatingHours: {
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    },
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '21:00' }
    }
  },
  is24Hours: {
    type: Boolean,
    default: false
  },

  // Services Offered
  servicesOffered: [{
    type: String,
    enum: [
      'Prescription Medicines',
      'OTC Medicines',
      'Home Delivery',
      'Online Ordering',
      'Health Checkup',
      'Blood Pressure Monitoring',
      'Diabetes Care',
      'Vaccination',
      'Medical Equipment',
      'Baby Care Products',
      'Personal Care',
      'Health Supplements',
      'Surgical Items',
      'First Aid',
      'Other'
    ]
  }],

  // Delivery Information
  deliveryOptions: {
    homeDelivery: {
      type: Boolean,
      default: true
    },
    pickupAvailable: {
      type: Boolean,
      default: true
    },
    emergencyDelivery: {
      type: Boolean,
      default: false
    },
    minimumOrderAmount: {
      type: Number,
      default: 0,
      min: [0, 'Minimum order amount cannot be negative']
    },
    deliveryCharges: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charges cannot be negative']
    },
    freeDeliveryAbove: {
      type: Number,
      default: 1000,
      min: [0, 'Free delivery threshold cannot be negative']
    },
    deliveryRadius: {
      type: Number,
      required: [true, 'Delivery radius is required'],
      default: 5,
      min: [0, 'Delivery radius cannot be negative']
    },
    estimatedDeliveryTime: {
      type: String,
      default: '1-2 hours'
    }
  },

  // Contact & Location Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxLength: [200, 'Street address cannot exceed 200 characters']
    },
    area: {
      type: String,
      trim: true,
      maxLength: [100, 'Area name cannot exceed 100 characters']
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxLength: [100, 'City name cannot exceed 100 characters']
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      maxLength: [100, 'State name cannot exceed 100 characters']
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      maxLength: [20, 'Postal code cannot exceed 20 characters']
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      maxLength: [100, 'Country name cannot exceed 100 characters'],
      default: 'Pakistan'
    }
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: [true, 'Coordinates are required for location-based search'],
      validate: {
        validator: function(value) {
          return value.length === 2 && 
                 value[0] >= -180 && value[0] <= 180 && 
                 value[1] >= -90 && value[1] <= 90;
        },
        message: 'Coordinates must be [longitude, latitude] with valid ranges'
      }
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  whatsappNumber: {
    type: String,
    trim: true
  },
  emailAddress: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  websiteUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },

  // Pharmacist Information
  pharmacistInCharge: {
    fullName: {
      type: String,
      required: [true, 'Pharmacist in-charge name is required'],
      trim: true,
      maxLength: [100, 'Full name cannot exceed 100 characters']
    },
    registrationNumber: {
      type: String,
      required: [true, 'Pharmacist registration number is required'],
      trim: true,
      maxLength: [50, 'Registration number cannot exceed 50 characters']
    },
    qualification: {
      type: String,
      required: [true, 'Pharmacist qualification is required'],
      trim: true
    },
    phoneNumber: {
      type: String,
      required: [true, 'Pharmacist phone number is required'],
      trim: true
    },
    emailAddress: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    }
  },

  // Administrative Contact Person (Login Credentials)
  administrativeContact: {
    fullName: {
      type: String,
      required: [true, 'Administrative contact full name is required'],
      trim: true,
      maxLength: [100, 'Full name cannot exceed 100 characters']
    },
    designation: {
      type: String,
      required: [true, 'Administrative contact designation is required'],
      trim: true,
      maxLength: [100, 'Designation cannot exceed 100 characters']
    },
    phoneNumber: {
      type: String,
      required: [true, 'Administrative contact phone number is required'],
      trim: true
    },
    emailAddress: {
      type: String,
      required: [true, 'Administrative contact email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Administrative contact password is required'],
      minlength: [6, 'Password must be at least 6 characters long']
    },
    idProof: {
      documentType: {
        type: String,
        required: [true, 'ID proof document type is required'],
        enum: ['CNIC', 'NIC', 'Passport', 'Other']
      },
      documentNumber: {
        type: String,
        required: [true, 'ID proof document number is required'],
        trim: true,
        maxLength: [50, 'Document number cannot exceed 50 characters']
      },
      documentUrl: {
        type: String,
        required: [true, 'ID proof document upload is required'],
        trim: true
      }
    }
  },

  // Required Documents for Upload
  documents: {
    pharmacyRegistrationCertificate: {
      url: {
        type: String,
        required: [true, 'Pharmacy registration certificate is required'],
        trim: true
      },
      registrationNumber: {
        type: String,
        required: [true, 'Registration number is required'],
        trim: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    drugLicense: {
      url: {
        type: String,
        required: [true, 'Drug license is required'],
        trim: true
      },
      licenseNumber: {
        type: String,
        required: [true, 'License number is required'],
        trim: true
      },
      expiryDate: {
        type: Date,
        required: [true, 'License expiry date is required']
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    pharmacistLicense: {
      url: {
        type: String,
        required: [true, 'Pharmacist license is required'],
        trim: true
      },
      licenseNumber: {
        type: String,
        required: [true, 'Pharmacist license number is required'],
        trim: true
      },
      expiryDate: {
        type: Date,
        required: [true, 'Pharmacist license expiry date is required']
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    proofOfOwnership: {
      url: {
        type: String,
        required: [true, 'Proof of ownership/lease agreement is required'],
        trim: true
      },
      documentType: {
        type: String,
        required: [true, 'Document type is required'],
        enum: ['Ownership Deed', 'Lease Agreement', 'Rental Agreement', 'Other']
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    taxRegistration: {
      url: {
        type: String,
        required: [true, 'Tax registration document is required'],
        trim: true
      },
      taxNumber: {
        type: String,
        required: [true, 'Tax registration number is required'],
        trim: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    bankDetails: {
      accountTitle: {
        type: String,
        required: [true, 'Bank account title is required'],
        trim: true
      },
      accountNumber: {
        type: String,
        required: [true, 'Bank account number is required'],
        trim: true
      },
      bankName: {
        type: String,
        required: [true, 'Bank name is required'],
        trim: true
      },
      branchCode: {
        type: String,
        trim: true
      },
      iban: {
        type: String,
        trim: true
      }
    }
  },

  // Store Images
  images: {
    storeFront: {
      type: String,
      trim: true
    },
    interior: [{
      type: String,
      trim: true
    }],
    logo: {
      type: String,
      trim: true
    }
  },

  // Business Metrics
  metrics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    completedOrders: {
      type: Number,
      default: 0
    },
    cancelledOrders: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5']
    },
    totalReviews: {
      type: Number,
      default: 0
    }
  },

  // System fields
  status: {
    type: String,
    enum: ['Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
    default: 'Pending'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  verificationStatus: {
    type: String,
    enum: ['Unverified', 'Partially Verified', 'Fully Verified'],
    default: 'Unverified'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  rejectionReason: String,
  notes: [{
    note: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
pharmacySchema.index({ pharmacyName: 1 });
pharmacySchema.index({ registrationNumber: 1 });
pharmacySchema.index({ drugLicenseNumber: 1 });
pharmacySchema.index({ pharmacyType: 1 });
pharmacySchema.index({ 'address.city': 1 });
pharmacySchema.index({ 'address.state': 1 });
pharmacySchema.index({ 'address.area': 1 });
pharmacySchema.index({ status: 1 });
pharmacySchema.index({ verificationStatus: 1 });
pharmacySchema.index({ isActive: 1 });
pharmacySchema.index({ coordinates: '2dsphere' }); // Geospatial index for location-based search
pharmacySchema.index({ 'metrics.averageRating': -1 });
pharmacySchema.index({ createdAt: -1 });

// Compound indexes for common queries
pharmacySchema.index({ status: 1, isActive: 1 });
pharmacySchema.index({ 'address.city': 1, status: 1, isActive: 1 });

// Virtual for full address
pharmacySchema.virtual('fullAddress').get(function() {
  const parts = [this.address.street];
  if (this.address.area) parts.push(this.address.area);
  parts.push(this.address.city, `${this.address.state} ${this.address.postalCode}`, this.address.country);
  return parts.join(', ');
});

// Virtual for checking if documents are complete
pharmacySchema.virtual('documentsComplete').get(function() {
  const requiredDocs = [
    'pharmacyRegistrationCertificate',
    'drugLicense',
    'pharmacistLicense',
    'proofOfOwnership',
    'taxRegistration'
  ];
  
  return requiredDocs.every(doc => this.documents[doc] && this.documents[doc].url);
});

// Virtual for checking if pharmacy is currently open
pharmacySchema.virtual('isCurrentlyOpen').get(function() {
  if (this.is24Hours) return true;
  
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDay = days[now.getDay()];
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const daySchedule = this.operatingHours[currentDay];
  if (!daySchedule.isOpen) return false;
  
  const [openHour, openMin] = daySchedule.openTime.split(':').map(Number);
  const [closeHour, closeMin] = daySchedule.closeTime.split(':').map(Number);
  const openTime = openHour * 60 + openMin;
  const closeTime = closeHour * 60 + closeMin;
  
  return currentTime >= openTime && currentTime <= closeTime;
});

// Pre-save middleware
pharmacySchema.pre('save', function(next) {
  // Auto-update verification status based on documents
  if (this.documentsComplete) {
    this.verificationStatus = 'Partially Verified';
  }
  next();
});

// Instance method to check if pharmacy is operational
pharmacySchema.methods.isOperational = function() {
  return this.status === 'Approved' && this.isActive && this.verificationStatus === 'Fully Verified';
};

// Static method to find nearby pharmacies
pharmacySchema.statics.findNearby = function(longitude, latitude, maxDistance = 5000) {
  return this.find({
    coordinates: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [longitude, latitude]
        },
        $maxDistance: maxDistance
      }
    },
    status: 'Approved',
    isActive: true
  });
};

// Static method to find pharmacies by city
pharmacySchema.statics.findByCity = function(city) {
  return this.find({ 
    'address.city': new RegExp(city, 'i'), 
    status: 'Approved', 
    isActive: true 
  });
};

const Pharmacy = mongoose.model('Pharmacy', pharmacySchema);

export default Pharmacy;

