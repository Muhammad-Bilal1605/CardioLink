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
  Calendar,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';

const HospitalRegistration = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    // Basic Information
    hospitalName: '',
    hospitalType: 'Private',
    registrationNumber: '',
    yearEstablished: '',
    numberOfBeds: '',
    specialtiesOffered: [],
    ownershipType: 'Private',
    
    // Address Information
    address: {
      street: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'Pakistan'
    },
    coordinates: {
      latitude: '',
      longitude: ''
    },
    phoneNumber: '',
    emailAddress: '',
    emergencyContactNumber: '',
    websiteUrl: '',
    
    // Administrative Contact
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
    
    // Additional Fields for documents
    healthLicenseNumber: '',
    healthLicenseExpiryDate: '',
    ownershipDocumentType: 'Ownership Deed',
    ambulanceRegNumber: '',
    numberOfAmbulances: '',
    taxNumber: '',
    accreditationType: 'ISO',
    accreditationNumber: '',
    accreditationIssuedBy: '',
    accreditationExpiryDate: ''
  });

  const [files, setFiles] = useState({
    hospitalRegistrationCertificate: null,
    healthDepartmentLicense: null,
    proofOfOwnership: null,
    practitionersList: null,
    labCertification: null,
    ambulanceRegistration: null,
    accreditationCertificates: [],
    taxRegistration: null,
    dataPrivacyPolicy: null,
    adminIdProof: null
  });

  const hospitalTypes = [
    'Government', 'Private', 'Clinic', 'Specialty', 'Teaching', 'Research', 'Military', 'Other'
  ];

  const ownershipTypes = [
    'Proprietorship', 'Partnership', 'Corporation', 'Non-Profit', 'Government', 'Trust', 'Other'
  ];

  const specialties = [
    'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Gynecology', 'Dermatology', 'Psychiatry', 'Radiology', 'Pathology',
    'Anesthesiology', 'Emergency Medicine', 'Internal Medicine', 'Surgery',
    'Urology', 'Ophthalmology', 'ENT', 'Gastroenterology', 'Nephrology',
    'Pulmonology', 'Endocrinology', 'Rheumatology', 'Hematology', 'Other'
  ];

  const idProofTypes = ['CNIC', 'NIC', 'Passport', 'Other'];
  const ownershipDocTypes = ['Ownership Deed', 'Lease Agreement', 'Rental Agreement', 'Other'];
  const accreditationTypes = ['ISO', 'NABH', 'JCIA', 'Other'];

  const steps = [
    { number: 1, title: 'Basic Information', icon: Building2 },
    { number: 2, title: 'Contact & Location', icon: MapPin },
    { number: 3, title: 'Administrative Contact', icon: User },
    { number: 4, title: 'Documents Upload', icon: FileText },
    { number: 5, title: 'Review & Submit', icon: CheckCircle }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const keys = name.split('.');
      setFormData(prev => {
        const newData = { ...prev };
        let current = newData;
        
        // Navigate to the nested object
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        
        // Set the final value
        current[keys[keys.length - 1]] = value;
        
        return newData;
      });
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNestedInputChange = (parent, child, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [child]: value
      }
    }));
  };

  const handleSpecialtyChange = (specialty) => {
    setFormData(prev => ({
      ...prev,
      specialtiesOffered: prev.specialtiesOffered.includes(specialty)
        ? prev.specialtiesOffered.filter(s => s !== specialty)
        : [...prev.specialtiesOffered, specialty]
    }));
  };

  const handleFileChange = (fieldName, file) => {
    if (fieldName === 'accreditationCertificates') {
      setFiles(prev => ({
        ...prev,
        [fieldName]: [...prev[fieldName], file]
      }));
    } else {
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));
    }
  };

  const removeFile = (fieldName, index = null) => {
    if (fieldName === 'accreditationCertificates' && index !== null) {
      setFiles(prev => ({
        ...prev,
        [fieldName]: prev[fieldName].filter((_, i) => i !== index)
      }));
    } else {
      setFiles(prev => ({
        ...prev,
        [fieldName]: null
      }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.hospitalName) newErrors.hospitalName = 'Hospital name is required';
        if (!formData.registrationNumber) newErrors.registrationNumber = 'Registration number is required';
        if (!formData.yearEstablished) newErrors.yearEstablished = 'Year established is required';
        if (!formData.numberOfBeds) newErrors.numberOfBeds = 'Number of beds is required';
        if (formData.specialtiesOffered.length === 0) newErrors.specialtiesOffered = 'At least one specialty is required';
        break;
      
      case 2:
        if (!formData.address.street) newErrors['address.street'] = 'Street address is required';
        if (!formData.address.city) newErrors['address.city'] = 'City is required';
        if (!formData.address.state) newErrors['address.state'] = 'State is required';
        if (!formData.address.postalCode) newErrors['address.postalCode'] = 'Postal code is required';
        if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone number is required';
        if (!formData.emailAddress) newErrors.emailAddress = 'Email address is required';
        if (!formData.emergencyContactNumber) newErrors.emergencyContactNumber = 'Emergency contact is required';
        break;
      
      case 3:
        if (!formData.administrativeContact.fullName) newErrors['administrativeContact.fullName'] = 'Admin name is required';
        if (!formData.administrativeContact.designation) newErrors['administrativeContact.designation'] = 'Designation is required';
        if (!formData.administrativeContact.phoneNumber) newErrors['administrativeContact.phoneNumber'] = 'Admin phone is required';
        if (!formData.administrativeContact.emailAddress) newErrors['administrativeContact.emailAddress'] = 'Admin email is required';
        if (!formData.administrativeContact.password) {
          newErrors['administrativeContact.password'] = 'Password is required';
        } else if (formData.administrativeContact.password.length < 6) {
          newErrors['administrativeContact.password'] = 'Password must be at least 6 characters long';
        }
        if (!formData.administrativeContact.idProof.documentNumber) newErrors['administrativeContact.idProof.documentNumber'] = 'ID number is required';
        break;
      
      case 4:
        const requiredFiles = [
          'hospitalRegistrationCertificate',
          'healthDepartmentLicense', 
          'proofOfOwnership',
          'practitionersList',
          'taxRegistration',
          'dataPrivacyPolicy',
          'adminIdProof'
        ];
        
        requiredFiles.forEach(field => {
          if (!files[field]) {
            newErrors[field] = 'This document is required';
          }
        });
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;
    
    setLoading(true);
    setErrors({});
    setMessage('');

    try {
      const submitFormData = new FormData();
      
      // Append form data
      Object.keys(formData).forEach(key => {
        if (typeof formData[key] === 'object' && formData[key] !== null) {
          if (Array.isArray(formData[key])) {
            formData[key].forEach((item, index) => {
              submitFormData.append(`${key}[${index}]`, item);
            });
          } else {
            Object.keys(formData[key]).forEach(subKey => {
              if (typeof formData[key][subKey] === 'object') {
                Object.keys(formData[key][subKey]).forEach(subSubKey => {
                  submitFormData.append(`${key}.${subKey}.${subSubKey}`, formData[key][subKey][subSubKey]);
                });
              } else {
                submitFormData.append(`${key}.${subKey}`, formData[key][subKey]);
              }
            });
          }
        } else {
          submitFormData.append(key, formData[key]);
        }
      });
      
      // Append files
      Object.keys(files).forEach(key => {
        if (key === 'accreditationCertificates') {
          files[key].forEach((file, index) => {
            if (file) {
              submitFormData.append(key, file);
            }
          });
        } else if (files[key]) {
          submitFormData.append(key, files[key]);
        }
      });

      const response = await axios.post('http://localhost:5000/api/hospitals', submitFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage('Hospital registration submitted successfully! Your application is under review.');
        setCurrentStep(6); // Success step
      }
    } catch (error) {
      console.error('Error submitting hospital registration:', error);
      setMessage(error.response?.data?.message || 'Error submitting registration');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Hospital Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hospital Name *
          </label>
          <input
            type="text"
            name="hospitalName"
            value={formData.hospitalName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.hospitalName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter hospital name"
          />
          {errors.hospitalName && <p className="text-red-500 text-sm mt-1">{errors.hospitalName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hospital Type *
          </label>
          <select
            name="hospitalType"
            value={formData.hospitalType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {hospitalTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Registration Number *
          </label>
          <input
            type="text"
            name="registrationNumber"
            value={formData.registrationNumber}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.registrationNumber ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter registration number"
          />
          {errors.registrationNumber && <p className="text-red-500 text-sm mt-1">{errors.registrationNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Year Established *
          </label>
          <input
            type="number"
            name="yearEstablished"
            value={formData.yearEstablished}
            onChange={handleInputChange}
            min="1800"
            max={new Date().getFullYear()}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.yearEstablished ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter year established"
          />
          {errors.yearEstablished && <p className="text-red-500 text-sm mt-1">{errors.yearEstablished}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Beds *
          </label>
          <input
            type="number"
            name="numberOfBeds"
            value={formData.numberOfBeds}
            onChange={handleInputChange}
            min="1"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.numberOfBeds ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter number of beds"
          />
          {errors.numberOfBeds && <p className="text-red-500 text-sm mt-1">{errors.numberOfBeds}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ownership Type *
          </label>
          <select
            name="ownershipType"
            value={formData.ownershipType}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ownershipTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Specialties Offered * (Select at least one)
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {specialties.map(specialty => (
            <label key={specialty} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.specialtiesOffered.includes(specialty)}
                onChange={() => handleSpecialtyChange(specialty)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{specialty}</span>
            </label>
          ))}
        </div>
        {errors.specialtiesOffered && <p className="text-red-500 text-sm mt-1">{errors.specialtiesOffered}</p>}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact & Location Information</h3>
      
      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Address</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Street Address *
            </label>
            <input
              type="text"
              name="address.street"
              value={formData.address.street}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['address.street'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter street address"
            />
            {errors['address.street'] && <p className="text-red-500 text-sm mt-1">{errors['address.street']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              name="address.city"
              value={formData.address.city}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['address.city'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter city"
            />
            {errors['address.city'] && <p className="text-red-500 text-sm mt-1">{errors['address.city']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              name="address.state"
              value={formData.address.state}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['address.state'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter state"
            />
            {errors['address.state'] && <p className="text-red-500 text-sm mt-1">{errors['address.state']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Postal Code *
            </label>
            <input
              type="text"
              name="address.postalCode"
              value={formData.address.postalCode}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['address.postalCode'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter postal code"
            />
            {errors['address.postalCode'] && <p className="text-red-500 text-sm mt-1">{errors['address.postalCode']}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country *
            </label>
            <input
              type="text"
              name="address.country"
              value={formData.address.country}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter country"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Contact Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter phone number"
            />
            {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="emailAddress"
              value={formData.emailAddress}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.emailAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.emailAddress && <p className="text-red-500 text-sm mt-1">{errors.emailAddress}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Emergency Contact Number *
            </label>
            <input
              type="tel"
              name="emergencyContactNumber"
              value={formData.emergencyContactNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.emergencyContactNumber ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter emergency contact number"
            />
            {errors.emergencyContactNumber && <p className="text-red-500 text-sm mt-1">{errors.emergencyContactNumber}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL (Optional)
            </label>
            <input
              type="url"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter website URL"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Coordinates (Optional)</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              name="coordinates.latitude"
              value={formData.coordinates.latitude}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter latitude"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              name="coordinates.longitude"
              value={formData.coordinates.longitude}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter longitude"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Contact Person</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name *
          </label>
          <input
            type="text"
            name="administrativeContact.fullName"
            value={formData.administrativeContact.fullName}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['administrativeContact.fullName'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter full name"
          />
          {errors['administrativeContact.fullName'] && <p className="text-red-500 text-sm mt-1">{errors['administrativeContact.fullName']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Designation *
          </label>
          <input
            type="text"
            name="administrativeContact.designation"
            value={formData.administrativeContact.designation}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['administrativeContact.designation'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter designation"
          />
          {errors['administrativeContact.designation'] && <p className="text-red-500 text-sm mt-1">{errors['administrativeContact.designation']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="administrativeContact.phoneNumber"
            value={formData.administrativeContact.phoneNumber}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['administrativeContact.phoneNumber'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter phone number"
          />
          {errors['administrativeContact.phoneNumber'] && <p className="text-red-500 text-sm mt-1">{errors['administrativeContact.phoneNumber']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Address *
          </label>
          <input
            type="email"
            name="administrativeContact.emailAddress"
            value={formData.administrativeContact.emailAddress}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['administrativeContact.emailAddress'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter email address"
          />
          {errors['administrativeContact.emailAddress'] && <p className="text-red-500 text-sm mt-1">{errors['administrativeContact.emailAddress']}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Password *
          </label>
          <input
            type="password"
            name="administrativeContact.password"
            value={formData.administrativeContact.password}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors['administrativeContact.password'] ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter password"
          />
          {errors['administrativeContact.password'] && <p className="text-red-500 text-sm mt-1">{errors['administrativeContact.password']}</p>}
          <p className="text-gray-500 text-sm mt-1">Password will be used for hospital admin login after approval</p>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">ID Proof</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              name="administrativeContact.idProof.documentType"
              value={formData.administrativeContact.idProof.documentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {idProofTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Number *
            </label>
            <input
              type="text"
              name="administrativeContact.idProof.documentNumber"
              value={formData.administrativeContact.idProof.documentNumber}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors['administrativeContact.idProof.documentNumber'] ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter document number"
            />
            {errors['administrativeContact.idProof.documentNumber'] && <p className="text-red-500 text-sm mt-1">{errors['administrativeContact.idProof.documentNumber']}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  const renderFileUpload = (fieldName, title, required = false, accept = ".pdf,.doc,.docx,.jpg,.jpeg,.png") => (
    <div className="border border-gray-300 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-gray-800">
          {title} {required && <span className="text-red-500">*</span>}
        </h4>
        {files[fieldName] && (
          <button
            type="button"
            onClick={() => removeFile(fieldName)}
            className="text-red-500 hover:text-red-700 text-sm"
          >
            Remove
          </button>
        )}
      </div>
      
      {!files[fieldName] ? (
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-2 text-gray-400" />
            <p className="mb-2 text-sm text-gray-500">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (MAX. 10MB)</p>
          </div>
          <input
            type="file"
            accept={accept}
            onChange={(e) => e.target.files[0] && handleFileChange(fieldName, e.target.files[0])}
            className="hidden"
          />
        </label>
      ) : (
        <div className="flex items-center p-3 bg-gray-50 rounded-lg">
          <FileText className="w-5 h-5 text-gray-400 mr-2" />
          <span className="text-sm text-gray-700 truncate">{files[fieldName].name}</span>
        </div>
      )}
      
      {errors[fieldName] && <p className="text-red-500 text-sm mt-1">{errors[fieldName]}</p>}
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Documents Upload</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {renderFileUpload('hospitalRegistrationCertificate', 'Hospital Registration Certificate', true)}
        
        <div className="space-y-4">
          {renderFileUpload('healthDepartmentLicense', 'Health Department License', true)}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                License Number *
              </label>
              <input
                type="text"
                name="healthLicenseNumber"
                value={formData.healthLicenseNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter license number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date *
              </label>
              <input
                type="date"
                name="healthLicenseExpiryDate"
                value={formData.healthLicenseExpiryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {renderFileUpload('proofOfOwnership', 'Proof of Ownership/Lease Agreement', true)}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type *
            </label>
            <select
              name="ownershipDocumentType"
              value={formData.ownershipDocumentType}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {ownershipDocTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>

        {renderFileUpload('practitionersList', 'List of Practicing Doctors', true)}

        <div className="space-y-4">
          {renderFileUpload('taxRegistration', 'Tax Registration Document', true)}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tax Number *
            </label>
            <input
              type="text"
              name="taxNumber"
              value={formData.taxNumber}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter tax number"
            />
          </div>
        </div>

        {renderFileUpload('dataPrivacyPolicy', 'Data Privacy & Patient Record Policy', true)}

        {renderFileUpload('adminIdProof', 'Administrative Contact ID Proof', true)}

        {renderFileUpload('labCertification', 'Lab Certification (Optional)', false)}

        <div className="space-y-4">
          {renderFileUpload('ambulanceRegistration', 'Ambulance Registration (Optional)', false)}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registration Number
              </label>
              <input
                type="text"
                name="ambulanceRegNumber"
                value={formData.ambulanceRegNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter registration number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Ambulances
              </label>
              <input
                type="number"
                name="numberOfAmbulances"
                value={formData.numberOfAmbulances}
                onChange={handleInputChange}
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter number"
              />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-4">Accreditation Certificates (Optional)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Accreditation Type
                </label>
                <select
                  name="accreditationType"
                  value={formData.accreditationType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {accreditationTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certificate Number
                </label>
                <input
                  type="text"
                  name="accreditationNumber"
                  value={formData.accreditationNumber}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter certificate number"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issued By
                </label>
                <input
                  type="text"
                  name="accreditationIssuedBy"
                  value={formData.accreditationIssuedBy}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter issuing authority"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expiry Date
              </label>
              <input
                type="date"
                name="accreditationExpiryDate"
                value={formData.accreditationExpiryDate}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500">
                  Upload Accreditation Certificate
                </p>
              </div>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files[0] && handleFileChange('accreditationCertificates', e.target.files[0])}
                className="hidden"
              />
            </label>
            
            {files.accreditationCertificates.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">Uploaded Certificates:</h5>
                {files.accreditationCertificates.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-700">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile('accreditationCertificates', index)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review & Submit</h3>
      
      <div className="space-y-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Basic Information</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>Hospital Name: {formData.hospitalName}</div>
            <div>Type: {formData.hospitalType}</div>
            <div>Registration: {formData.registrationNumber}</div>
            <div>Year Established: {formData.yearEstablished}</div>
            <div>Beds: {formData.numberOfBeds}</div>
            <div>Ownership: {formData.ownershipType}</div>
          </div>
          <div className="mt-2">
            <div className="text-sm">Specialties: {formData.specialtiesOffered.join(', ')}</div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Contact Information</h4>
          <div className="text-sm space-y-1">
            <div>Address: {formData.address.street}, {formData.address.city}, {formData.address.state} {formData.address.postalCode}</div>
            <div>Phone: {formData.phoneNumber}</div>
            <div>Email: {formData.emailAddress}</div>
            <div>Emergency: {formData.emergencyContactNumber}</div>
            {formData.websiteUrl && <div>Website: {formData.websiteUrl}</div>}
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Administrative Contact</h4>
          <div className="text-sm space-y-1">
            <div>Name: {formData.administrativeContact.fullName}</div>
            <div>Designation: {formData.administrativeContact.designation}</div>
            <div>Phone: {formData.administrativeContact.phoneNumber}</div>
            <div>Email: {formData.administrativeContact.emailAddress}</div>
            <div>Password: {formData.administrativeContact.password ? '✓ Set' : '✗ Not set'}</div>
            <div>ID: {formData.administrativeContact.idProof.documentType} - {formData.administrativeContact.idProof.documentNumber}</div>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-800 mb-2">Uploaded Documents</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            {Object.entries(files).map(([key, file]) => {
              if (key === 'accreditationCertificates') {
                return file.length > 0 && (
                  <div key={key} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    Accreditation Certificates ({file.length})
                  </div>
                );
              }
              return file && (
                <div key={key} className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5 mr-2" />
            <div className="text-sm text-blue-700">
              <p className="font-medium mb-1">Important:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Your application will be reviewed by our team</li>
                <li>You will receive an email confirmation after submission</li>
                <li>The review process typically takes 3-5 business days</li>
                <li>You may be contacted for additional information</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSuccessStep = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <CheckCircle className="w-16 h-16 text-green-500" />
      </div>
      <h3 className="text-2xl font-bold text-gray-900">Registration Submitted Successfully!</h3>
      <p className="text-gray-600 max-w-lg mx-auto">
        Your hospital registration has been submitted successfully. You will receive an email confirmation shortly. 
        Our team will review your application and contact you within 3-5 business days.
      </p>
      <div className="space-y-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mr-4"
        >
          Go to Dashboard
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Submit Another Application
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Registration</h1>
          <p className="text-gray-600">Register your hospital with CardioLink</p>
        </div>

        {/* Progress Bar */}
        {currentStep <= 5 && (
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {steps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentStep >= step.number 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {currentStep > step.number ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className={`text-xs mt-1 ${
                      currentStep >= step.number ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex mt-4">
              <div 
                className="h-2 bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
              <div 
                className="h-2 bg-gray-200 rounded-full flex-1"
                style={{ width: `${100 - ((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Form Content */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {message && (
            <div className={`mb-4 p-4 rounded-md ${
              message.includes('success') || message.includes('submitted')
                ? 'bg-green-100 border border-green-400 text-green-700'
                : 'bg-red-100 border border-red-400 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
          {currentStep === 6 && renderSuccessStep()}

          {/* Navigation Buttons */}
          {currentStep <= 5 && (
            <div className="flex justify-between mt-8">
              <button
                onClick={prevStep}
                disabled={currentStep === 1}
                className={`px-4 py-2 rounded-md flex items-center ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </button>

              {currentStep < 5 ? (
                <button
                  onClick={nextStep}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Registration
                      <CheckCircle className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalRegistration; 