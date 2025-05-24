import React, { useState } from 'react';
import { X, User, Home, Stethoscope, Shield, Heart, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AddPatientModal = ({ 
  isOpen, 
  onClose, 
  onPatientAdded,
  title = "Add New Patient" 
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  
  // Validation states
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // Allergy-related states
  const [showAllergyForm, setShowAllergyForm] = useState(false);
  const [allergyType, setAllergyType] = useState('medicinal');
  const [newAllergy, setNewAllergy] = useState({
    name: '',
    reaction: '',
    criticality: 'Medium',
    notes: ''
  });

  const [patient, setPatient] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Male',
    email: '',
    password: '',
    phoneNumber: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    allergies: {
      medicinal: [],
      food: [],
      environmental: []
    },
    insurance: {
      provider: '',
      policyNumber: '',
      groupNumber: '',
      expiryDate: ''
    },
    emergencyContact: {
      name: '',
      relationship: '',
      phoneNumber: ''
    },
    socialHistory: {
      tobaccoUse: 'Unknown',
      tobaccoType: '',
      tobaccoFrequency: '',
      alcoholUse: 'Unknown',
      alcoholType: '',
      alcoholFrequency: '',
      illicitDrugUse: 'Unknown',
      drugType: '',
      drugFrequency: '',
      occupation: ''
    },
    specialDirectives: {
      dnr: false,
      livingWill: false,
      religiousInstructions: '',
      organDonor: false
    }
  });

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
  };

  const validateZipCode = (zipCode) => {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    };
  };

  const validateDateOfBirth = (dateOfBirth) => {
    if (!dateOfBirth) return false;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    return birthDate < today && birthDate > new Date('1900-01-01');
  };

  // Check if email already exists
  const checkEmailExists = async (email) => {
    if (!validateEmail(email)) return;
    
    setEmailChecking(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/patients/check-email?email=${encodeURIComponent(email)}`);
      setEmailExists(response.data.exists);
    } catch (err) {
      console.error('Error checking email:', err);
    } finally {
      setEmailChecking(false);
    }
  };

  // Validate individual fields
  const validateField = (name, value, section = null) => {
    const errors = {};
    
    if (section) {
      // Handle nested field validation
      if (section === 'address' && name === 'zipCode' && value && !validateZipCode(value)) {
        errors[`${section}.${name}`] = 'Please enter a valid ZIP code (12345 or 12345-6789)';
      }
      if (section === 'emergencyContact' && name === 'phoneNumber' && value && !validatePhone(value)) {
        errors[`${section}.${name}`] = 'Please enter a valid phone number';
      }
    } else {
      // Handle top-level field validation
      switch (name) {
        case 'firstName':
        case 'lastName':
          if (!value.trim()) {
            errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name is required`;
          } else if (value.trim().length < 2) {
            errors[name] = `${name === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
          }
          break;
        
        case 'email':
          if (!value) {
            errors[name] = 'Email is required';
          } else if (!validateEmail(value)) {
            errors[name] = 'Please enter a valid email address';
          } else if (emailExists) {
            errors[name] = 'This email is already registered';
          }
          break;
        
        case 'password':
          if (!value) {
            errors[name] = 'Password is required';
          } else {
            const passwordValidation = validatePassword(value);
            if (!passwordValidation.length) {
              errors[name] = 'Password must be at least 6 characters long';
            } else if (!passwordValidation.hasUpper || !passwordValidation.hasLower || !passwordValidation.hasNumber) {
              errors[name] = 'Password must contain uppercase, lowercase, and number';
            }
          }
          break;
        
        case 'phoneNumber':
          if (!value) {
            errors[name] = 'Phone number is required';
          } else if (!validatePhone(value)) {
            errors[name] = 'Please enter a valid phone number';
          }
          break;
        
        case 'dateOfBirth':
          if (!value) {
            errors[name] = 'Date of birth is required';
          } else if (!validateDateOfBirth(value)) {
            errors[name] = 'Please enter a valid birth date';
          }
          break;
        
        case 'gender':
          if (!value) {
            errors[name] = 'Gender is required';
          }
          break;
        
        default:
          break;
      }
    }
    
    return errors;
  };

  // Validate current step
  const validateCurrentStep = () => {
    let stepErrors = {};
    
    switch (currentStep) {
      case 1:
        stepErrors = {
          ...validateField('firstName', patient.firstName),
          ...validateField('lastName', patient.lastName),
          ...validateField('email', patient.email),
          ...validateField('password', patient.password),
          ...validateField('phoneNumber', patient.phoneNumber),
          ...validateField('dateOfBirth', patient.dateOfBirth),
          ...validateField('gender', patient.gender)
        };
        break;
      
      case 2:
        // Address validation is optional, but validate format if provided
        if (patient.address.zipCode) {
          stepErrors = {
            ...validateField('zipCode', patient.address.zipCode, 'address')
          };
        }
        if (patient.emergencyContact.phoneNumber) {
          stepErrors = {
            ...stepErrors,
            ...validateField('phoneNumber', patient.emergencyContact.phoneNumber, 'emergencyContact')
          };
        }
        break;
      
      // Steps 3, 4, 5 are optional
      default:
        break;
    }
    
    return stepErrors;
  };

  const resetForm = () => {
    setCurrentStep(1);
    setError(null);
    setValidationErrors({});
    setFieldTouched({});
    setEmailExists(false);
    setEmailChecking(false);
    setIsNavigating(false);
    setShowAllergyForm(false);
    setAllergyType('medicinal');
    setNewAllergy({
      name: '',
      reaction: '',
      criticality: 'Medium',
      notes: ''
    });
    setPatient({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      gender: 'Male',
      email: '',
      password: '',
      phoneNumber: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      },
      allergies: {
        medicinal: [],
        food: [],
        environmental: []
      },
      insurance: {
        provider: '',
        policyNumber: '',
        groupNumber: '',
        expiryDate: ''
      },
      emergencyContact: {
        name: '',
        relationship: '',
        phoneNumber: ''
      },
      socialHistory: {
        tobaccoUse: 'Unknown',
        tobaccoType: '',
        tobaccoFrequency: '',
        alcoholUse: 'Unknown',
        alcoholType: '',
        alcoholFrequency: '',
        illicitDrugUse: 'Unknown',
        drugType: '',
        drugFrequency: '',
        occupation: ''
      },
      specialDirectives: {
        dnr: false,
        livingWill: false,
        religiousInstructions: '',
        organDonor: false
      }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPatient(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    setFieldTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field in real-time
    const fieldErrors = validateField(name, value);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Remove error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [name]: undefined })
    }));
    
    // Check email uniqueness
    if (name === 'email' && validateEmail(value)) {
      const timeoutId = setTimeout(() => {
        checkEmailExists(value);
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleNestedInputChange = (section, field, value) => {
    setPatient(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Mark nested field as touched
    const fieldKey = `${section}.${field}`;
    setFieldTouched(prev => ({
      ...prev,
      [fieldKey]: true
    }));
    
    // Validate nested field
    const fieldErrors = validateField(field, value, section);
    setValidationErrors(prev => ({
      ...prev,
      ...fieldErrors,
      // Remove error if field is now valid
      ...(Object.keys(fieldErrors).length === 0 && { [fieldKey]: undefined })
    }));
  };

  // Allergy handlers
  const handleAllergyInputChange = (e) => {
    const { name, value } = e.target;
    setNewAllergy(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddAllergy = () => {
    if (!newAllergy.name.trim()) return;
    
    setPatient(prev => ({
      ...prev,
      allergies: {
        ...prev.allergies,
        [allergyType]: [...prev.allergies[allergyType], newAllergy]
      }
    }));
    
    setNewAllergy({
      name: '',
      reaction: '',
      criticality: 'Medium',
      notes: ''
    });
    setShowAllergyForm(false);
  };

  const handleRemoveAllergy = (type, index) => {
    setPatient(prev => ({
      ...prev,
      allergies: {
        ...prev.allergies,
        [type]: prev.allergies[type].filter((_, i) => i !== index)
      }
    }));
  };

  const handleNext = () => {
    const stepErrors = validateCurrentStep();
    
    if (Object.keys(stepErrors).length > 0) {
      setValidationErrors(prev => ({
        ...prev,
        ...stepErrors
      }));
      
      // Mark all fields in current step as touched
      const fieldsToTouch = {};
      Object.keys(stepErrors).forEach(field => {
        fieldsToTouch[field] = true;
      });
      setFieldTouched(prev => ({
        ...prev,
        ...fieldsToTouch
      }));
      
      setError('Please fix the validation errors before proceeding');
      return;
    }
    
    if (emailExists) {
      setError('Please use a different email address');
      return;
    }
    
    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevious = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isNavigating || adding) return;
    
    setIsNavigating(true);
    setTimeout(() => {
      setCurrentStep(prev => prev - 1);
      setIsNavigating(false);
    }, 100);
  };

  const handleNextClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isNavigating || adding) return;
    
    setIsNavigating(true);
    
    // Small delay to prevent double-clicking
    setTimeout(() => {
      handleNext();
      setIsNavigating(false);
    }, 100);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validate all required fields
    const allErrors = validateCurrentStep();
    
    if (Object.keys(allErrors).length > 0 || emailExists) {
      setValidationErrors(allErrors);
      setError('Please fix all validation errors before submitting');
      return;
    }
    
    setAdding(true);
    setError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/patients', patient);
      
      if (response.data.success) {
        if (onPatientAdded) {
          onPatientAdded(response.data.data);
        }
        resetForm();
        onClose();
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      setError(err.response?.data?.message || 'Error adding patient');
    } finally {
      setAdding(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Helper function to render field error
  const renderFieldError = (fieldName) => {
    const error = validationErrors[fieldName];
    const touched = fieldTouched[fieldName];
    
    if (error && touched) {
      return (
        <div className="flex items-center mt-1 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      );
    }
    return null;
  };

  // Helper function to get input class names based on validation state
  const getInputClassName = (fieldName, baseClassName = '') => {
    const error = validationErrors[fieldName];
    const touched = fieldTouched[fieldName];
    const hasError = error && touched;
    
    const baseClasses = baseClassName || "mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500";
    
    if (hasError) {
      return `${baseClasses} border-red-300 focus:border-red-500`;
    } else if (touched && !error) {
      return `${baseClasses} border-green-300 focus:border-green-500`;
    } else {
      return `${baseClasses} border-gray-300 focus:border-blue-500`;
    }
  };

  const steps = [
    { number: 1, title: 'Personal Info', icon: User },
    { number: 2, title: 'Address', icon: Home },
    { number: 3, title: 'Medical Info', icon: Stethoscope },
    { number: 4, title: 'Insurance', icon: Shield },
    { number: 5, title: 'Directives', icon: Heart }
  ];

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <User className="h-5 w-5 mr-2 text-blue-600" />
              Personal Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="firstName"
                  value={patient.firstName}
                  onChange={handleInputChange}
                  required
                  className={getInputClassName('firstName')}
                />
                {renderFieldError('firstName')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  name="lastName"
                  value={patient.lastName}
                  onChange={handleInputChange}
                  required
                  className={getInputClassName('lastName')}
                />
                {renderFieldError('lastName')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={patient.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  max={new Date().toISOString().split('T')[0]}
                  className={getInputClassName('dateOfBirth')}
                />
                {renderFieldError('dateOfBirth')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select
                  name="gender"
                  value={patient.gender}
                  onChange={handleInputChange}
                  required
                  className={getInputClassName('gender')}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                {renderFieldError('gender')}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={patient.email}
                  onChange={handleInputChange}
                  required
                  className={getInputClassName('email')}
                />
                {emailChecking && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                )}
              </div>
              {renderFieldError('email')}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password *</label>
              <input
                type="password"
                name="password"
                value={patient.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className={getInputClassName('password')}
              />
              {renderFieldError('password')}
              <p className="mt-1 text-sm text-gray-500">Password must contain uppercase, lowercase, and number (min 6 characters)</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
              <input
                type="tel"
                name="phoneNumber"
                value={patient.phoneNumber}
                onChange={handleInputChange}
                required
                placeholder="e.g., +1234567890"
                className={getInputClassName('phoneNumber')}
              />
              {renderFieldError('phoneNumber')}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Home className="h-5 w-5 mr-2 text-blue-600" />
              Address Information
            </h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street</label>
              <input
                type="text"
                value={patient.address.street}
                onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
                className={getInputClassName('address.street')}
              />
              {renderFieldError('address.street')}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={patient.address.city}
                  onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                  className={getInputClassName('address.city')}
                />
                {renderFieldError('address.city')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={patient.address.state}
                  onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                  className={getInputClassName('address.state')}
                />
                {renderFieldError('address.state')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  value={patient.address.zipCode}
                  onChange={(e) => handleNestedInputChange('address', 'zipCode', e.target.value)}
                  placeholder="12345 or 12345-6789"
                  className={getInputClassName('address.zipCode')}
                />
                {renderFieldError('address.zipCode')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={patient.address.country}
                  onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                  className={getInputClassName('address.country')}
                />
                {renderFieldError('address.country')}
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-medium text-gray-900 mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={patient.emergencyContact.name}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'name', e.target.value)}
                    className={getInputClassName('emergencyContact.name')}
                  />
                  {renderFieldError('emergencyContact.name')}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Relationship</label>
                  <input
                    type="text"
                    value={patient.emergencyContact.relationship}
                    onChange={(e) => handleNestedInputChange('emergencyContact', 'relationship', e.target.value)}
                    placeholder="e.g., Spouse, Parent, Sibling"
                    className={getInputClassName('emergencyContact.relationship')}
                  />
                  {renderFieldError('emergencyContact.relationship')}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  value={patient.emergencyContact.phoneNumber}
                  onChange={(e) => handleNestedInputChange('emergencyContact', 'phoneNumber', e.target.value)}
                  placeholder="e.g., +1234567890"
                  className={getInputClassName('emergencyContact.phoneNumber')}
                />
                {renderFieldError('emergencyContact.phoneNumber')}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Stethoscope className="h-5 w-5 mr-2 text-blue-600" />
              Medical Information
            </h3>
            
            {/* Allergies Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-md font-medium text-gray-800">Allergies</h4>
                {!showAllergyForm && (
                  <button
                    type="button"
                    onClick={() => setShowAllergyForm(true)}
                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-100"
                  >
                    + Add Allergy
                  </button>
                )}
              </div>
              
              {/* Allergy Form */}
              {showAllergyForm && (
                <div className="bg-white p-4 rounded-md mb-3 border">
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergy Type *
                      </label>
                      <select
                        value={allergyType}
                        onChange={(e) => setAllergyType(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="medicinal">Medicinal</option>
                        <option value="food">Food</option>
                        <option value="environmental">Environmental</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Allergen Name *
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newAllergy.name}
                        onChange={handleAllergyInputChange}
                        required
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Criticality
                      </label>
                      <select
                        name="criticality"
                        value={newAllergy.criticality}
                        onChange={handleAllergyInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Reaction
                      </label>
                      <input
                        type="text"
                        name="reaction"
                        value={newAllergy.reaction}
                        onChange={handleAllergyInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={newAllergy.notes}
                      onChange={handleAllergyInputChange}
                      rows="2"
                      className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowAllergyForm(false)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleAddAllergy}
                      className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              )}
              
              {/* Allergy Lists */}
              <div className="space-y-2">
                {/* Medicinal Allergies */}
                {patient.allergies.medicinal.length > 0 && (
                  <div className="bg-blue-50 rounded-md p-3">
                    <h5 className="text-sm font-medium text-blue-700 mb-2">Medicinal Allergies</h5>
                    <ul className="space-y-1">
                      {patient.allergies.medicinal.map((allergy, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <span className={`font-medium ${
                              allergy.criticality === 'High' ? 'text-red-600' : 
                              allergy.criticality === 'Medium' ? 'text-orange-500' : 'text-green-600'
                            }`}>
                              {allergy.name} ({allergy.criticality})
                            </span>
                            {allergy.reaction && <span className="text-gray-600"> - {allergy.reaction}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy('medicinal', index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Food Allergies */}
                {patient.allergies.food.length > 0 && (
                  <div className="bg-green-50 rounded-md p-3">
                    <h5 className="text-sm font-medium text-green-700 mb-2">Food Allergies</h5>
                    <ul className="space-y-1">
                      {patient.allergies.food.map((allergy, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <span className={`font-medium ${
                              allergy.criticality === 'High' ? 'text-red-600' : 
                              allergy.criticality === 'Medium' ? 'text-orange-500' : 'text-green-600'
                            }`}>
                              {allergy.name} ({allergy.criticality})
                            </span>
                            {allergy.reaction && <span className="text-gray-600"> - {allergy.reaction}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy('food', index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {/* Environmental Allergies */}
                {patient.allergies.environmental.length > 0 && (
                  <div className="bg-amber-50 rounded-md p-3">
                    <h5 className="text-sm font-medium text-amber-700 mb-2">Environmental Allergies</h5>
                    <ul className="space-y-1">
                      {patient.allergies.environmental.map((allergy, index) => (
                        <li key={index} className="flex justify-between items-center text-sm">
                          <div>
                            <span className={`font-medium ${
                              allergy.criticality === 'High' ? 'text-red-600' : 
                              allergy.criticality === 'Medium' ? 'text-orange-500' : 'text-green-600'
                            }`}>
                              {allergy.name} ({allergy.criticality})
                            </span>
                            {allergy.reaction && <span className="text-gray-600"> - {allergy.reaction}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveAllergy('environmental', index)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {patient.allergies.medicinal.length === 0 && 
                 patient.allergies.food.length === 0 && 
                 patient.allergies.environmental.length === 0 && !showAllergyForm && (
                  <p className="text-sm text-gray-500 italic">No allergies added</p>
                )}
              </div>
            </div>

            {/* Social History */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="text-md font-medium text-gray-800 mb-4">Social History</h4>
              
              {/* Tobacco Use */}
              <div className="space-y-4 p-3 bg-white rounded-md mb-4">
                <h5 className="font-medium text-gray-700">Tobacco Use</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={patient.socialHistory.tobaccoUse}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'tobaccoUse', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Never">Never</option>
                      <option value="Former">Former</option>
                      <option value="Current">Current</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input
                      type="text"
                      value={patient.socialHistory.tobaccoType}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'tobaccoType', e.target.value)}
                      placeholder="Cigarettes, Cigars, Vaping"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <input
                      type="text"
                      value={patient.socialHistory.tobaccoFrequency}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'tobaccoFrequency', e.target.value)}
                      placeholder="Daily, 1 pack per day"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Alcohol Use */}
              <div className="space-y-4 p-3 bg-white rounded-md mb-4">
                <h5 className="font-medium text-gray-700">Alcohol Use</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={patient.socialHistory.alcoholUse}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'alcoholUse', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Never">Never</option>
                      <option value="Former">Former</option>
                      <option value="Current">Current</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input
                      type="text"
                      value={patient.socialHistory.alcoholType}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'alcoholType', e.target.value)}
                      placeholder="Beer, Wine, Spirits"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <input
                      type="text"
                      value={patient.socialHistory.alcoholFrequency}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'alcoholFrequency', e.target.value)}
                      placeholder="Weekly, 2 drinks/day"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Illicit Drug Use */}
              <div className="space-y-4 p-3 bg-white rounded-md mb-4">
                <h5 className="font-medium text-gray-700">Illicit Drug Use</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={patient.socialHistory.illicitDrugUse}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'illicitDrugUse', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="Never">Never</option>
                      <option value="Former">Former</option>
                      <option value="Current">Current</option>
                      <option value="Unknown">Unknown</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <input
                      type="text"
                      value={patient.socialHistory.drugType}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'drugType', e.target.value)}
                      placeholder="Type of substance"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Frequency</label>
                    <input
                      type="text"
                      value={patient.socialHistory.drugFrequency}
                      onChange={(e) => handleNestedInputChange('socialHistory', 'drugFrequency', e.target.value)}
                      placeholder="Frequency of use"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Occupation */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Occupation</label>
                <input
                  type="text"
                  value={patient.socialHistory.occupation}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'occupation', e.target.value)}
                  placeholder="Patient's occupation"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Shield className="h-5 w-5 mr-2 text-blue-600" />
              Insurance Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Insurance Provider</label>
                <input
                  type="text"
                  value={patient.insurance.provider}
                  onChange={(e) => handleNestedInputChange('insurance', 'provider', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Policy Number</label>
                <input
                  type="text"
                  value={patient.insurance.policyNumber}
                  onChange={(e) => handleNestedInputChange('insurance', 'policyNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Group Number</label>
                <input
                  type="text"
                  value={patient.insurance.groupNumber}
                  onChange={(e) => handleNestedInputChange('insurance', 'groupNumber', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
                <input
                  type="date"
                  value={patient.insurance.expiryDate}
                  onChange={(e) => handleNestedInputChange('insurance', 'expiryDate', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Heart className="h-5 w-5 mr-2 text-blue-600" />
              Special Directives
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={patient.specialDirectives.dnr}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'dnr', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Do Not Resuscitate (DNR)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={patient.specialDirectives.livingWill}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'livingWill', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Living Will</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={patient.specialDirectives.organDonor}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'organDonor', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Organ Donor</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Religious Instructions</label>
                <textarea
                  value={patient.specialDirectives.religiousInstructions}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'religiousInstructions', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter any religious instructions or preferences..."
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex justify-between">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center ${
                    step.number <= currentStep
                      ? 'text-blue-600'
                      : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step.number <= currentStep
                        ? 'border-blue-600 bg-blue-100'
                        : 'border-gray-300'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="mt-1 text-xs font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handlePrevious}
                disabled={isNavigating || adding}
                className={`px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors ${
                  (isNavigating || adding) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Previous
              </button>
            )}
            <div className="flex space-x-3 ml-auto">
              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={handleNextClick}
                  disabled={isNavigating || adding}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${
                    (isNavigating || adding) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isNavigating ? 'Processing...' : 'Next'}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={adding || isNavigating}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition-colors ${
                    (adding || isNavigating) ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {adding && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {adding ? 'Adding Patient...' : isNavigating ? 'Processing...' : 'Add Patient'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPatientModal; 