import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  // Basic Hospital Information
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true,
    maxLength: [200, 'Hospital name cannot exceed 200 characters']
  },
  hospitalType: {
    type: String,
    required: [true, 'Hospital type is required'],
    enum: ['Government', 'Private', 'Clinic', 'Specialty', 'Teaching', 'Research', 'Military', 'Other'],
    default: 'Private'
  },
  registrationNumber: {
    type: String,
    required: [true, 'Registration number is required'],
    unique: true,
    trim: true,
    maxLength: [50, 'Registration number cannot exceed 50 characters']
  },
  yearEstablished: {
    type: Number,
    required: [true, 'Year established is required'],
    min: [1800, 'Year established must be after 1800'],
    max: [new Date().getFullYear(), 'Year established cannot be in the future']
  },
  numberOfBeds: {
    type: Number,
    required: [true, 'Number of beds is required'],
    min: [1, 'Number of beds must be at least 1']
  },
  specialtiesOffered: [{
    type: String,
    trim: true,
    enum: [
      'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Pediatrics',
      'Gynecology', 'Dermatology', 'Psychiatry', 'Radiology', 'Pathology',
      'Anesthesiology', 'Emergency Medicine', 'Internal Medicine', 'Surgery',
      'Urology', 'Ophthalmology', 'ENT', 'Gastroenterology', 'Nephrology',
      'Pulmonology', 'Endocrinology', 'Rheumatology', 'Hematology', 'Other'
    ]
  }],
  ownershipType: {
    type: String,
    required: [true, 'Ownership type is required'],
    enum: ['Proprietorship', 'Partnership', 'Corporation', 'Non-Profit', 'Government', 'Trust', 'Other'],
    default: 'Proprietorship'
  },

  // Contact & Location Information
  address: {
    street: {
      type: String,
      required: [true, 'Street address is required'],
      trim: true,
      maxLength: [200, 'Street address cannot exceed 200 characters']
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
    latitude: {
      type: Number,
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    }
  },
  phoneNumber: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  emailAddress: {
    type: String,
    required: [true, 'Email address is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email address']
  },
  emergencyContactNumber: {
    type: String,
    required: [true, 'Emergency contact number is required'],
    trim: true
  },
  websiteUrl: {
    type: String,
    trim: true,
    match: [/^https?:\/\/.+/, 'Please provide a valid website URL']
  },

  // Administrative Contact Person
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
    hospitalRegistrationCertificate: {
      url: {
        type: String,
        required: [true, 'Hospital registration certificate is required'],
        trim: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    healthDepartmentLicense: {
      url: {
        type: String,
        required: [true, 'Health department license is required'],
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
    practitionersList: {
      url: {
        type: String,
        required: [true, 'List of practicing doctors is required'],
        trim: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    labCertification: {
      url: String,
      certificationNumber: String,
      expiryDate: Date,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    ambulanceRegistration: {
      url: String,
      registrationNumber: String,
      numberOfAmbulances: {
        type: Number,
        min: [0, 'Number of ambulances cannot be negative']
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
    },
    accreditationCertificates: [{
      type: {
        type: String,
        enum: ['ISO', 'NABH', 'JCIA', 'Other']
      },
      url: String,
      certificateNumber: String,
      issuedBy: String,
      expiryDate: Date,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }],
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
    dataPrivacyPolicy: {
      url: {
        type: String,
        required: [true, 'Data privacy & patient record policy is required'],
        trim: true
      },
      uploadDate: {
        type: Date,
        default: Date.now
      }
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
hospitalSchema.index({ hospitalName: 1 });
hospitalSchema.index({ registrationNumber: 1 });
hospitalSchema.index({ hospitalType: 1 });
hospitalSchema.index({ 'address.city': 1 });
hospitalSchema.index({ 'address.state': 1 });
hospitalSchema.index({ status: 1 });
hospitalSchema.index({ verificationStatus: 1 });
hospitalSchema.index({ createdAt: -1 });

// Virtual for full address
hospitalSchema.virtual('fullAddress').get(function() {
  return `${this.address.street}, ${this.address.city}, ${this.address.state} ${this.address.postalCode}, ${this.address.country}`;
});

// Virtual for checking if documents are complete
hospitalSchema.virtual('documentsComplete').get(function() {
  const requiredDocs = [
    'hospitalRegistrationCertificate',
    'healthDepartmentLicense',
    'proofOfOwnership',
    'practitionersList',
    'taxRegistration',
    'dataPrivacyPolicy'
  ];
  
  return requiredDocs.every(doc => this.documents[doc] && this.documents[doc].url);
});

// Pre-save middleware
hospitalSchema.pre('save', function(next) {
  // Auto-update verification status based on documents
  if (this.documentsComplete) {
    this.verificationStatus = 'Partially Verified';
  }
  next();
});

// Instance method to check if hospital is operational
hospitalSchema.methods.isOperational = function() {
  return this.status === 'Approved' && this.isActive && this.verificationStatus === 'Fully Verified';
};

// Static method to find hospitals by specialty
hospitalSchema.statics.findBySpecialty = function(specialty) {
  return this.find({ specialtiesOffered: specialty, status: 'Approved', isActive: true });
};

// Static method to find hospitals in a city
hospitalSchema.statics.findByCity = function(city) {
  return this.find({ 'address.city': new RegExp(city, 'i'), status: 'Approved', isActive: true });
};

const Hospital = mongoose.model('Hospital', hospitalSchema);

export default Hospital;