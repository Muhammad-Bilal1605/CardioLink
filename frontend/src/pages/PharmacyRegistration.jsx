import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  MapPin, 
  User, 
  FileText, 
  CheckCircle, 
  Upload,
  ArrowLeft,
  ArrowRight,
  Phone,
  Mail,
  AlertCircle,
  Heart,
  Pill
} from 'lucide-react';

const PharmacyRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    // Basic Information
    pharmacyName: '',
    pharmacyType: 'Independent',
    registrationNumber: '',
    drugLicenseNumber: '',
    yearEstablished: '',
    ownershipType: 'Proprietorship',
    
    // Operating Hours
    is24Hours: false,
    
    // Services
    servicesOffered: [],
    
    // Delivery Options
    deliveryOptions: {
      homeDelivery: true,
      pickupAvailable: true,
      emergencyDelivery: false,
      minimumOrderAmount: 0,
      deliveryCharges: 0,
      freeDeliveryAbove: 1000,
      deliveryRadius: 5,
      estimatedDeliveryTime: '1-2 hours'
    },
    
    // Address Information
    address: {
      street: '',
      area: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan'
    },
    coordinates: {
      type: 'Point',
      coordinates: [0, 0] // [longitude, latitude]
    },
    phoneNumber: '',
    whatsappNumber: '',
    emailAddress: '',
    websiteUrl: '',
    
    // Pharmacist In Charge
    pharmacistInCharge: {
      fullName: '',
      registrationNumber: '',
      qualification: '',
      phoneNumber: '',
      emailAddress: ''
    },
    
    // Administrative Contact (Login Credentials)
    administrativeContact: {
      fullName: '',
      designation: '',
      phoneNumber: '',
      emailAddress: '',
      password: '',
      idProof: {
        documentType: 'CNIC',
        documentNumber: '',
        documentUrl: ''
      }
    },
    
    // Document numbers
    pharmacyRegNumber: '',
    drugLicenseExpiryDate: '',
    pharmacistLicenseNumber: '',
    pharmacistLicenseExpiryDate: '',
    ownershipDocumentType: 'Ownership Deed',
    taxNumber: '',
    
    // Bank Details
    bankDetails: {
      accountTitle: '',
      accountNumber: '',
      bankName: '',
      branchCode: '',
      iban: ''
    }
  });

  const [files, setFiles] = useState({
    pharmacyRegistrationCertificate: null,
    drugLicense: null,
    pharmacistLicense: null,
    proofOfOwnership: null,
    taxRegistration: null,
    storeFront: null,
    logo: null,
    adminIdProof: null
  });

  const pharmacyTypes = ['Chain', 'Independent', 'Hospital Pharmacy', 'Online', 'Clinic Pharmacy', 'Other'];
  
  const ownershipTypes = ['Proprietorship', 'Partnership', 'Corporation', 'Franchise', 'Other'];
  
  const servicesList = [
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
    'First Aid'
  ];

  const handleInputChange = (e, section = null) => {
    const { name, value, type, checked } = e.target;
    const inputValue = type === 'checkbox' ? checked : value;

    if (section) {
      // Handle nested paths like 'administrativeContact.idProof'
      if (section.includes('.')) {
        const [parent, child] = section.split('.');
        setFormData(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [name]: inputValue
            }
          }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [section]: {
            ...prev[section],
            [name]: inputValue
          }
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: inputValue
      }));
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleServiceToggle = (service) => {
    setFormData(prev => ({
      ...prev,
      servicesOffered: prev.servicesOffered.includes(service)
        ? prev.servicesOffered.filter(s => s !== service)
        : [...prev.servicesOffered, service]
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: 'File size must be less than 10MB'
        }));
        return;
      }
      
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
      
      // Clear error
      if (errors[fieldName]) {
        setErrors(prev => ({ ...prev, [fieldName]: '' }));
      }
    }
  };

  const handleCoordinatesChange = (type, value) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      coordinates: {
        ...prev.coordinates,
        coordinates: type === 'longitude' 
          ? [numValue, prev.coordinates.coordinates[1]]
          : [prev.coordinates.coordinates[0], numValue]
      }
    }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.pharmacyName) newErrors.pharmacyName = 'Pharmacy name is required';
      if (!formData.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
      if (!formData.drugLicenseNumber) newErrors.drugLicenseNumber = 'Drug license number is required';
      if (!formData.yearEstablished) newErrors.yearEstablished = 'Year established is required';
    } else if (step === 2) {
      if (!formData.address.street) newErrors.street = 'Street address is required';
      if (!formData.address.city) newErrors.city = 'City is required';
      if (!formData.address.state) newErrors.state = 'State is required';
      if (!formData.address.postalCode) newErrors.postalCode = 'Postal code is required';
      if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
      if (!formData.emailAddress) newErrors.emailAddress = 'Email address is required';
    } else if (step === 3) {
      if (!formData.pharmacistInCharge.fullName) newErrors.pharmacistName = 'Pharmacist name is required';
      if (!formData.pharmacistInCharge.registrationNumber) newErrors.pharmacistReg = 'Pharmacist registration number is required';
      if (!formData.pharmacistInCharge.qualification) newErrors.pharmacistQual = 'Pharmacist qualification is required';
      if (!formData.pharmacistInCharge.phoneNumber) newErrors.pharmacistPhone = 'Pharmacist phone number is required';
    } else if (step === 4) {
      if (!formData.administrativeContact.fullName) newErrors.adminName = 'Admin name is required';
      if (!formData.administrativeContact.designation) newErrors.adminDesignation = 'Admin designation is required';
      if (!formData.administrativeContact.emailAddress) newErrors.adminEmail = 'Admin email is required';
      if (!formData.administrativeContact.password) newErrors.adminPassword = 'Password is required';
      if (formData.administrativeContact.password && formData.administrativeContact.password.length < 6) {
        newErrors.adminPassword = 'Password must be at least 6 characters';
      }
      if (!formData.administrativeContact.idProof.documentNumber) newErrors.adminIdNumber = 'ID document number is required';
      if (!formData.bankDetails.accountTitle) newErrors.accountTitle = 'Account title is required';
      if (!formData.bankDetails.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!formData.bankDetails.bankName) newErrors.bankName = 'Bank name is required';
    } else if (step === 5) {
      // Document numbers validation
      if (!formData.pharmacyRegNumber) newErrors.pharmacyRegNumber = 'Registration certificate number is required';
      if (!formData.drugLicenseExpiryDate) newErrors.drugLicenseExpiryDate = 'Drug license expiry date is required';
      if (!formData.pharmacistLicenseNumber) newErrors.pharmacistLicenseNumber = 'Pharmacist license number is required';
      if (!formData.pharmacistLicenseExpiryDate) newErrors.pharmacistLicenseExpiryDate = 'Pharmacist license expiry date is required';
      if (!formData.taxNumber) newErrors.taxNumber = 'Tax registration number is required';
      
      // File uploads validation
      if (!files.pharmacyRegistrationCertificate) newErrors.pharmacyRegistrationCertificate = 'Registration certificate is required';
      if (!files.drugLicense) newErrors.drugLicense = 'Drug license is required';
      if (!files.pharmacistLicense) newErrors.pharmacistLicense = 'Pharmacist license is required';
      if (!files.proofOfOwnership) newErrors.proofOfOwnership = 'Proof of ownership is required';
      if (!files.taxRegistration) newErrors.taxRegistration = 'Tax registration is required';
      if (!files.adminIdProof) newErrors.adminIdProof = 'Admin ID proof is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const submitData = new FormData();

      // Prepare data to match backend schema
      const dataToSubmit = {
        ...formData,
        documents: {
          pharmacyRegistrationCertificate: {
            registrationNumber: formData.pharmacyRegNumber
          },
          drugLicense: {
            licenseNumber: formData.drugLicenseNumber,
            expiryDate: formData.drugLicenseExpiryDate
          },
          pharmacistLicense: {
            licenseNumber: formData.pharmacistLicenseNumber,
            expiryDate: formData.pharmacistLicenseExpiryDate
          },
          proofOfOwnership: {
            documentType: formData.ownershipDocumentType
          },
          taxRegistration: {
            taxNumber: formData.taxNumber
          },
          bankDetails: formData.bankDetails
        }
      };

      // Remove fields from root level since they're now in documents
      delete dataToSubmit.bankDetails;
      delete dataToSubmit.pharmacyRegNumber;
      delete dataToSubmit.drugLicenseExpiryDate;
      delete dataToSubmit.pharmacistLicenseNumber;
      delete dataToSubmit.pharmacistLicenseExpiryDate;
      delete dataToSubmit.ownershipDocumentType;
      delete dataToSubmit.taxNumber;

      // Append JSON data
      Object.keys(dataToSubmit).forEach(key => {
        if (key !== 'documents' && typeof dataToSubmit[key] === 'object') {
          submitData.append(key, JSON.stringify(dataToSubmit[key]));
        } else if (key === 'documents') {
          submitData.append(key, JSON.stringify(dataToSubmit[key]));
        } else {
          submitData.append(key, dataToSubmit[key]);
        }
      });

      // Append files
      Object.keys(files).forEach(key => {
        if (files[key]) {
          submitData.append(key, files[key]);
        }
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/pharmacies`,
        submitData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setMessage('Pharmacy registration submitted successfully! Awaiting admin approval.');
      setTimeout(() => {
        navigate('/pharmacy-login', {
          state: { message: 'Registration submitted successfully. You will be able to login once approved.' }
        });
      }, 3000);

    } catch (error) {
      console.error('Registration error:', error);
      setMessage(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex justify-between mb-8">
      {[1, 2, 3, 4, 5].map((step) => (
        <div key={step} className="flex-1 flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            currentStep >= step ? 'bg-emerald-600 text-white' : 'bg-gray-300 text-gray-600'
          }`}>
            {currentStep > step ? <CheckCircle className="w-6 h-6" /> : step}
          </div>
          {step < 5 && (
            <div className={`flex-1 h-1 mx-2 ${
              currentStep > step ? 'bg-emerald-600' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
        <Building2 className="w-6 h-6 mr-2 text-emerald-600" />
        Basic Pharmacy Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pharmacy Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="pharmacyName"
            value={formData.pharmacyName}
            onChange={(e) => handleInputChange(e)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.pharmacyName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter pharmacy name"
          />
          {errors.pharmacyName && <p className="text-red-500 text-sm mt-1">{errors.pharmacyName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pharmacy Type <span className="text-red-500">*</span>
          </label>
          <select
            name="pharmacyType"
            value={formData.pharmacyType}
            onChange={(e) => handleInputChange(e)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {pharmacyTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={(e) => handleInputChange(e)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter registration number"
          />
          {errors.registrationNumber && <p className="text-red-500 text-sm mt-1">{errors.registrationNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Drug License Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="drugLicenseNumber"
            value={formData.drugLicenseNumber}
            onChange={(e) => handleInputChange(e)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.drugLicenseNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter drug license number"
          />
          {errors.drugLicenseNumber && <p className="text-red-500 text-sm mt-1">{errors.drugLicenseNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Year Established <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="yearEstablished"
            value={formData.yearEstablished}
            onChange={(e) => handleInputChange(e)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.yearEstablished ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., 2020"
            min="1800"
            max={new Date().getFullYear()}
          />
          {errors.yearEstablished && <p className="text-red-500 text-sm mt-1">{errors.yearEstablished}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ownership Type <span className="text-red-500">*</span>
          </label>
          <select
            name="ownershipType"
            value={formData.ownershipType}
            onChange={(e) => handleInputChange(e)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            {ownershipTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="border-t pt-4">
        <label className="flex items-center text-sm font-medium text-gray-700 mb-3">
          <input
            type="checkbox"
            name="is24Hours"
            checked={formData.is24Hours}
            onChange={(e) => handleInputChange(e)}
            className="mr-2 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
          />
          Open 24 Hours
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Services Offered
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {servicesList.map(service => (
            <label key={service} className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={formData.servicesOffered.includes(service)}
                onChange={() => handleServiceToggle(service)}
                className="mr-2 h-4 w-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              {service}
            </label>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
        <MapPin className="w-6 h-6 mr-2 text-emerald-600" />
        Location & Contact Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="street"
            value={formData.address.street}
            onChange={(e) => handleInputChange(e, 'address')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.street ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter street address"
          />
          {errors.street && <p className="text-red-500 text-sm mt-1">{errors.street}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Area/Locality
          </label>
          <input
            type="text"
            name="area"
            value={formData.address.area}
            onChange={(e) => handleInputChange(e, 'address')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter area"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            City <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="city"
            value={formData.address.city}
            onChange={(e) => handleInputChange(e, 'address')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.city ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter city"
          />
          {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            State/Province <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="state"
            value={formData.address.state}
            onChange={(e) => handleInputChange(e, 'address')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.state ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter state/province"
          />
          {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="postalCode"
            value={formData.address.postalCode}
            onChange={(e) => handleInputChange(e, 'address')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.postalCode ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter postal code"
          />
          {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Longitude (for location search)
          </label>
          <input
            type="number"
            step="any"
            value={formData.coordinates.coordinates[0]}
            onChange={(e) => handleCoordinatesChange('longitude', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., 73.0479"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Latitude (for location search)
          </label>
          <input
            type="number"
            step="any"
            value={formData.coordinates.coordinates[1]}
            onChange={(e) => handleCoordinatesChange('latitude', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g., 33.6844"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => handleInputChange(e)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter phone number"
          />
          {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Number
          </label>
          <input
            type="tel"
            name="whatsappNumber"
            value={formData.whatsappNumber}
            onChange={(e) => handleInputChange(e)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter WhatsApp number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="emailAddress"
            value={formData.emailAddress}
            onChange={(e) => handleInputChange(e)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.emailAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="pharmacy@example.com"
          />
          {errors.emailAddress && <p className="text-red-500 text-sm mt-1">{errors.emailAddress}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website URL
          </label>
          <input
            type="url"
            name="websiteUrl"
            value={formData.websiteUrl}
            onChange={(e) => handleInputChange(e)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="https://www.yourpharmacy.com"
          />
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-800 mb-3">Delivery Options</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Radius (km)
            </label>
            <input
              type="number"
              name="deliveryRadius"
              value={formData.deliveryOptions.deliveryRadius}
              onChange={(e) => handleInputChange(e, 'deliveryOptions')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Delivery Charges (Rs.)
            </label>
            <input
              type="number"
              name="deliveryCharges"
              value={formData.deliveryOptions.deliveryCharges}
              onChange={(e) => handleInputChange(e, 'deliveryOptions')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Free Delivery Above (Rs.)
            </label>
            <input
              type="number"
              name="freeDeliveryAbove"
              value={formData.deliveryOptions.freeDeliveryAbove}
              onChange={(e) => handleInputChange(e, 'deliveryOptions')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Delivery Time
            </label>
            <input
              type="text"
              name="estimatedDeliveryTime"
              value={formData.deliveryOptions.estimatedDeliveryTime}
              onChange={(e) => handleInputChange(e, 'deliveryOptions')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., 1-2 hours"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
        <User className="w-6 h-6 mr-2 text-emerald-600" />
        Pharmacist-in-Charge Information
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.pharmacistInCharge.fullName}
            onChange={(e) => handleInputChange(e, 'pharmacistInCharge')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.pharmacistName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter pharmacist full name"
          />
          {errors.pharmacistName && <p className="text-red-500 text-sm mt-1">{errors.pharmacistName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Registration Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={formData.pharmacistInCharge.registrationNumber}
            onChange={(e) => handleInputChange(e, 'pharmacistInCharge')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.pharmacistReg ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter registration number"
          />
          {errors.pharmacistReg && <p className="text-red-500 text-sm mt-1">{errors.pharmacistReg}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Qualification <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="qualification"
            value={formData.pharmacistInCharge.qualification}
            onChange={(e) => handleInputChange(e, 'pharmacistInCharge')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.pharmacistQual ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Pharm.D, B.Pharm"
          />
          {errors.pharmacistQual && <p className="text-red-500 text-sm mt-1">{errors.pharmacistQual}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.pharmacistInCharge.phoneNumber}
            onChange={(e) => handleInputChange(e, 'pharmacistInCharge')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.pharmacistPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter phone number"
          />
          {errors.pharmacistPhone && <p className="text-red-500 text-sm mt-1">{errors.pharmacistPhone}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            name="emailAddress"
            value={formData.pharmacistInCharge.emailAddress}
            onChange={(e) => handleInputChange(e, 'pharmacistInCharge')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="pharmacist@example.com"
          />
        </div>
      </div>
    </div>
  );

const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
        <User className="w-6 h-6 mr-2 text-emerald-600" />
        Administrative Contact (Login Credentials)
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.administrativeContact.fullName}
            onChange={(e) => handleInputChange(e, 'administrativeContact')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.adminName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter admin full name"
          />
          {errors.adminName && <p className="text-red-500 text-sm mt-1">{errors.adminName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Designation <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="designation"
            value={formData.administrativeContact.designation}
            onChange={(e) => handleInputChange(e, 'administrativeContact')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.adminDesignation ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="e.g., Owner, Manager"
          />
          {errors.adminDesignation && <p className="text-red-500 text-sm mt-1">{errors.adminDesignation}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.administrativeContact.phoneNumber}
            onChange={(e) => handleInputChange(e, 'administrativeContact')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            placeholder="Enter phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email Address (Login Email) <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="emailAddress"
            value={formData.administrativeContact.emailAddress}
            onChange={(e) => handleInputChange(e, 'administrativeContact')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.adminEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="admin@example.com"
          />
          {errors.adminEmail && <p className="text-red-500 text-sm mt-1">{errors.adminEmail}</p>}
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password (for login) <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="password"
            value={formData.administrativeContact.password}
            onChange={(e) => handleInputChange(e, 'administrativeContact')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.adminPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter password (minimum 6 characters)"
          />
          {errors.adminPassword && <p className="text-red-500 text-sm mt-1">{errors.adminPassword}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Proof Type <span className="text-red-500">*</span>
          </label>
          <select
            name="documentType"
            value={formData.administrativeContact.idProof.documentType}
            onChange={(e) => handleInputChange(e, 'administrativeContact.idProof')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          >
            <option value="CNIC">CNIC</option>
            <option value="NIC">NIC</option>
            <option value="Passport">Passport</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ID Document Number <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="documentNumber"
            value={formData.administrativeContact.idProof.documentNumber}
            onChange={(e) => handleInputChange(e, 'administrativeContact.idProof')}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
              errors.adminIdNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter ID number"
          />
          {errors.adminIdNumber && <p className="text-red-500 text-sm mt-1">{errors.adminIdNumber}</p>}
        </div>
      </div>

      <div className="border-t pt-4">
        <h4 className="font-medium text-gray-800 mb-3">Bank Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountTitle"
              value={formData.bankDetails.accountTitle}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.accountTitle ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter account title"
            />
            {errors.accountTitle && <p className="text-red-500 text-sm mt-1">{errors.accountTitle}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="accountNumber"
              value={formData.bankDetails.accountNumber}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.accountNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter account number"
            />
            {errors.accountNumber && <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="bankName"
              value={formData.bankDetails.bankName}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                errors.bankName ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter bank name"
            />
            {errors.bankName && <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Code
            </label>
            <input
              type="text"
              name="branchCode"
              value={formData.bankDetails.branchCode}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter branch code"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IBAN
            </label>
            <input
              type="text"
              name="iban"
              value={formData.bankDetails.iban}
              onChange={(e) => handleInputChange(e, 'bankDetails')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              placeholder="Enter IBAN"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-800 flex items-center">
        <FileText className="w-6 h-6 mr-2 text-emerald-600" />
        Document Uploads
      </h3>

      <div className="space-y-6">
        {/* Pharmacy Registration Certificate */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Pharmacy Registration Certificate</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registration Certificate Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pharmacyRegNumber"
                value={formData.pharmacyRegNumber}
                onChange={(e) => handleInputChange(e)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.pharmacyRegNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter certificate registration number"
              />
              {errors.pharmacyRegNumber && <p className="text-red-500 text-sm mt-1">{errors.pharmacyRegNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Certificate <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'pharmacyRegistrationCertificate')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {files.pharmacyRegistrationCertificate && (
                <p className="text-sm text-green-600 mt-1">✓ {files.pharmacyRegistrationCertificate.name}</p>
              )}
              {errors.pharmacyRegistrationCertificate && (
                <p className="text-red-500 text-sm mt-1">{errors.pharmacyRegistrationCertificate}</p>
              )}
            </div>
          </div>
        </div>

        {/* Drug License */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Drug License</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Drug License Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="drugLicenseExpiryDate"
                value={formData.drugLicenseExpiryDate}
                onChange={(e) => handleInputChange(e)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.drugLicenseExpiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.drugLicenseExpiryDate && <p className="text-red-500 text-sm mt-1">{errors.drugLicenseExpiryDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Drug License <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'drugLicense')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {files.drugLicense && (
                <p className="text-sm text-green-600 mt-1">✓ {files.drugLicense.name}</p>
              )}
              {errors.drugLicense && <p className="text-red-500 text-sm mt-1">{errors.drugLicense}</p>}
            </div>
          </div>
        </div>

        {/* Pharmacist License */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Pharmacist License</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pharmacist License Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="pharmacistLicenseNumber"
                value={formData.pharmacistLicenseNumber}
                onChange={(e) => handleInputChange(e)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.pharmacistLicenseNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter pharmacist license number"
              />
              {errors.pharmacistLicenseNumber && <p className="text-red-500 text-sm mt-1">{errors.pharmacistLicenseNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pharmacist License Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="pharmacistLicenseExpiryDate"
                value={formData.pharmacistLicenseExpiryDate}
                onChange={(e) => handleInputChange(e)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.pharmacistLicenseExpiryDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.pharmacistLicenseExpiryDate && <p className="text-red-500 text-sm mt-1">{errors.pharmacistLicenseExpiryDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Pharmacist License <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'pharmacistLicense')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {files.pharmacistLicense && (
                <p className="text-sm text-green-600 mt-1">✓ {files.pharmacistLicense.name}</p>
              )}
              {errors.pharmacistLicense && <p className="text-red-500 text-sm mt-1">{errors.pharmacistLicense}</p>}
            </div>
          </div>
        </div>

        {/* Proof of Ownership */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Proof of Ownership/Lease Agreement <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, 'proofOfOwnership')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          {files.proofOfOwnership && (
            <p className="text-sm text-green-600 mt-1">✓ {files.proofOfOwnership.name}</p>
          )}
          {errors.proofOfOwnership && <p className="text-red-500 text-sm mt-1">{errors.proofOfOwnership}</p>}
        </div>

        {/* Tax Registration */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">Tax Registration</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tax Registration Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={(e) => handleInputChange(e)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                  errors.taxNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter tax registration number"
              />
              {errors.taxNumber && <p className="text-red-500 text-sm mt-1">{errors.taxNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Upload Tax Registration Document <span className="text-red-500">*</span>
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileChange(e, 'taxRegistration')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
              {files.taxRegistration && (
                <p className="text-sm text-green-600 mt-1">✓ {files.taxRegistration.name}</p>
              )}
              {errors.taxRegistration && <p className="text-red-500 text-sm mt-1">{errors.taxRegistration}</p>}
            </div>
          </div>
        </div>

        {/* Admin ID Proof */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Administrative Contact ID Proof <span className="text-red-500">*</span>
          </label>
          <input
            type="file"
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, 'adminIdProof')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          {files.adminIdProof && (
            <p className="text-sm text-green-600 mt-1">✓ {files.adminIdProof.name}</p>
          )}
          {errors.adminIdProof && <p className="text-red-500 text-sm mt-1">{errors.adminIdProof}</p>}
        </div>

        {/* Optional: Store Front Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Store Front Image (Optional)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, 'storeFront')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          {files.storeFront && (
            <p className="text-sm text-green-600 mt-1">✓ {files.storeFront.name}</p>
          )}
        </div>

        {/* Optional: Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pharmacy Logo (Optional)
          </label>
          <input
            type="file"
            accept=".jpg,.jpeg,.png"
            onChange={(e) => handleFileChange(e, 'logo')}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
          />
          {files.logo && (
            <p className="text-sm text-green-600 mt-1">✓ {files.logo.name}</p>
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <AlertCircle className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Important Information:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>All documents must be in PDF, JPG, or PNG format</li>
              <li>Maximum file size: 10MB per document</li>
              <li>Ensure all documents are clear and legible</li>
              <li>Your registration will be reviewed by an admin before approval</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-12 px-4">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Heart className="text-red-500 h-8 w-8 animate-pulse" />
            <span className="text-2xl font-bold text-gray-800">CardioLink</span>
          </div>
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Home
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="inline-block p-3 bg-emerald-100 rounded-full mb-4">
            <Pill className="w-12 h-12 text-emerald-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pharmacy Registration
          </h1>
          <p className="text-gray-600">
            Join CardioLink's pharmacy network and reach more customers
          </p>
        </div>

        {renderStepIndicator()}

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
            )}

            {currentStep < 5 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors ml-auto"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className={`flex items-center px-6 py-3 rounded-lg transition-colors ml-auto ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                }`}
              >
                {loading ? 'Submitting...' : 'Submit Registration'}
                <CheckCircle className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className={`mt-6 p-4 rounded-lg ${
              message.includes('success') || message.includes('successfully')
                ? 'bg-green-100 text-green-800 border border-green-200'
                : 'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <div className="flex items-start">
                {message.includes('success') || message.includes('successfully') ? (
                  <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
                )}
                <p>{message}</p>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-8 text-center text-gray-600 text-sm">
        <p>© {new Date().getFullYear()} CardioLink. All rights reserved.</p>
      </div>
    </div>
  );
};

export default PharmacyRegistration;

