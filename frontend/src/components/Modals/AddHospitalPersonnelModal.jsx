import React, { useState } from 'react';
import { X, User, Mail, Lock, Stethoscope, ImagePlus, Beaker, UserCheck, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AddHospitalPersonnelModal = ({ 
  isOpen, 
  onClose, 
  onPersonnelAdded,
  title = "Add Hospital Personnel" 
}) => {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const [fieldTouched, setFieldTouched] = useState({});

  const [personnel, setPersonnel] = useState({
    name: '',
    email: '',
    password: '',
    role: '',
    // Doctor specific fields
    specialty: '',
    department: '',
    licenseNumber: '',
    employeeId: '',
    yearsOfExperience: '',
    qualifications: [],
    // Radiologist specific fields
    specializations: [],
    // Lab technologist specific fields
    certificationNumber: '',
    // Front desk specific fields
    shift: 'Morning',
    accessLevel: 'Basic'
  });

  const roles = [
    {
      id: 'doctor',
      title: 'Doctor',
      icon: <Stethoscope className="h-5 w-5" />,
      description: 'Medical practitioner',
      requiredFields: ['specialty', 'department', 'licenseNumber']
    },
    {
      id: 'radiologist',
      title: 'Radiologist',
      icon: <ImagePlus className="h-5 w-5" />,
      description: 'Imaging specialist',
      requiredFields: ['licenseNumber']
    },
    {
      id: 'lab-technologist',
      title: 'Lab Technologist',
      icon: <Beaker className="h-5 w-5" />,
      description: 'Laboratory specialist',
      requiredFields: ['certificationNumber']
    },
    {
      id: 'hospital-front-desk',
      title: 'Front Desk Staff',
      icon: <UserCheck className="h-5 w-5" />,
      description: 'Reception and administration',
      requiredFields: []
    }
  ];

  const specialties = [
    'Cardiology', 'Oncology', 'Neurology', 'Orthopedics', 'Pediatrics',
    'Gynecology', 'Dermatology', 'Psychiatry', 'Radiology', 'Pathology',
    'Anesthesiology', 'Emergency Medicine', 'Internal Medicine', 'Surgery',
    'Urology', 'Ophthalmology', 'ENT', 'Gastroenterology', 'Nephrology',
    'Pulmonology', 'Endocrinology', 'Rheumatology', 'Hematology'
  ];

  const departments = [
    'Cardiology', 'Emergency', 'Surgery', 'Pediatrics', 'Radiology',
    'Laboratory', 'Pharmacy', 'Administration', 'ICU', 'OPD'
  ];

  const radiologySpecializations = [
    'Cardiac Imaging', 'Neuroradiology', 'Musculoskeletal Imaging',
    'Chest Imaging', 'Abdominal Imaging', 'Interventional Radiology'
  ];

  const labSpecializations = [
    'Clinical Chemistry', 'Hematology', 'Microbiology', 'Immunology',
    'Molecular Diagnostics', 'Histopathology', 'Cytology'
  ];

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 6,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    };
  };

  const validateField = (name, value) => {
    const errors = {};
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errors[name] = 'Name is required';
        } else if (value.trim().length < 2) {
          errors[name] = 'Name must be at least 2 characters';
        }
        break;
      
      case 'email':
        if (!value) {
          errors[name] = 'Email is required';
        } else if (!validateEmail(value)) {
          errors[name] = 'Please enter a valid email address';
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
      
      case 'role':
        if (!value) {
          errors[name] = 'Role is required';
        }
        break;
      
      case 'specialty':
        if (personnel.role === 'doctor' && !value) {
          errors[name] = 'Specialty is required for doctors';
        }
        break;
      
      case 'department':
        if (personnel.role === 'doctor' && !value) {
          errors[name] = 'Department is required for doctors';
        }
        break;
      
      case 'licenseNumber':
        if ((personnel.role === 'doctor' || personnel.role === 'radiologist') && !value) {
          errors[name] = 'License number is required';
        }
        break;
      
      case 'certificationNumber':
        if (personnel.role === 'lab-technologist' && !value) {
          errors[name] = 'Certification number is required';
        }
        break;
      
      default:
        break;
    }
    
    return errors;
  };

  const resetForm = () => {
    setError(null);
    setValidationErrors({});
    setFieldTouched({});
    setPersonnel({
      name: '',
      email: '',
      password: '',
      role: '',
      specialty: '',
      department: '',
      licenseNumber: '',
      employeeId: '',
      yearsOfExperience: '',
      qualifications: [],
      specializations: [],
      certificationNumber: '',
      shift: 'Morning',
      accessLevel: 'Basic'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPersonnel(prev => ({
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
  };

  const handleArrayInputChange = (field, value) => {
    setPersonnel(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    const allErrors = {};
    const requiredFields = ['name', 'email', 'password', 'role'];
    
    // Add role-specific required fields
    const selectedRole = roles.find(r => r.id === personnel.role);
    if (selectedRole) {
      requiredFields.push(...selectedRole.requiredFields);
    }
    
    requiredFields.forEach(field => {
      const fieldErrors = validateField(field, personnel[field]);
      Object.assign(allErrors, fieldErrors);
    });
    
    if (Object.keys(allErrors).length > 0) {
      setValidationErrors(allErrors);
      setError('Please fix all validation errors before submitting');
      return;
    }
    
    setAdding(true);
    setError(null);
    
    try {
      // Prepare the data based on role
      const personnelData = {
        name: personnel.name,
        email: personnel.email,
        password: personnel.password,
        role: personnel.role,
        employeeId: personnel.employeeId || undefined,
        yearsOfExperience: personnel.yearsOfExperience ? parseInt(personnel.yearsOfExperience) : undefined
      };

      // Add role-specific fields
      switch (personnel.role) {
        case 'doctor':
          personnelData.specialty = personnel.specialty;
          personnelData.department = personnel.department;
          personnelData.licenseNumber = personnel.licenseNumber;
          personnelData.qualifications = personnel.qualifications;
          break;
        case 'radiologist':
          personnelData.licenseNumber = personnel.licenseNumber;
          personnelData.specializations = personnel.specializations;
          break;
        case 'lab-technologist':
          personnelData.certificationNumber = personnel.certificationNumber;
          personnelData.specializations = personnel.specializations;
          break;
        case 'hospital-front-desk':
          personnelData.shift = personnel.shift;
          personnelData.accessLevel = personnel.accessLevel;
          break;
      }

      const response = await axios.post('http://localhost:5000/api/auth/add-hospital-personnel', personnelData, {
        withCredentials: true
      });
      
      if (response.data.success) {
        if (onPersonnelAdded) {
          onPersonnelAdded(response.data.user);
        }
        resetForm();
        onClose();
      }
    } catch (err) {
      console.error('Error adding personnel:', err);
      setError(err.response?.data?.message || 'Error adding personnel');
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
        
        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-4">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  value={personnel.name}
                  onChange={handleInputChange}
                  required
                  className={getInputClassName('name')}
                />
                {renderFieldError('name')}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="email"
                  value={personnel.email}
                  onChange={handleInputChange}
                  required
                  className={getInputClassName('email')}
                />
                {renderFieldError('email')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <input
                  type="password"
                  name="password"
                  value={personnel.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className={getInputClassName('password')}
                />
                {renderFieldError('password')}
                <p className="mt-1 text-sm text-gray-500">Must contain uppercase, lowercase, and number (min 6 characters)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                <input
                  type="text"
                  name="employeeId"
                  value={personnel.employeeId}
                  onChange={handleInputChange}
                  className={getInputClassName('employeeId')}
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
              <div className="grid grid-cols-2 gap-3">
                {roles.map((role) => (
                  <button
                    type="button"
                    key={role.id}
                    onClick={() => handleInputChange({ target: { name: 'role', value: role.id } })}
                    className={`flex items-center p-3 rounded-lg border-2 transition duration-200 ${
                      personnel.role === role.id
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="mr-3">{role.icon}</div>
                    <div className="text-left">
                      <div className="font-medium text-sm">{role.title}</div>
                      <div className="text-xs opacity-70">{role.description}</div>
                    </div>
                  </button>
                ))}
              </div>
              {renderFieldError('role')}
            </div>

            {/* Role-specific fields */}
            {personnel.role === 'doctor' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-800">Doctor Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Specialty *</label>
                    <select
                      name="specialty"
                      value={personnel.specialty}
                      onChange={handleInputChange}
                      required
                      className={getInputClassName('specialty')}
                    >
                      <option value="">Select Specialty</option>
                      {specialties.map(specialty => (
                        <option key={specialty} value={specialty}>{specialty}</option>
                      ))}
                    </select>
                    {renderFieldError('specialty')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department *</label>
                    <select
                      name="department"
                      value={personnel.department}
                      onChange={handleInputChange}
                      required
                      className={getInputClassName('department')}
                    >
                      <option value="">Select Department</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    {renderFieldError('department')}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={personnel.licenseNumber}
                      onChange={handleInputChange}
                      required
                      className={getInputClassName('licenseNumber')}
                    />
                    {renderFieldError('licenseNumber')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={personnel.yearsOfExperience}
                      onChange={handleInputChange}
                      min="0"
                      className={getInputClassName('yearsOfExperience')}
                    />
                  </div>
                </div>
              </div>
            )}

            {personnel.role === 'radiologist' && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-800">Radiologist Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">License Number *</label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={personnel.licenseNumber}
                      onChange={handleInputChange}
                      required
                      className={getInputClassName('licenseNumber')}
                    />
                    {renderFieldError('licenseNumber')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={personnel.yearsOfExperience}
                      onChange={handleInputChange}
                      min="0"
                      className={getInputClassName('yearsOfExperience')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specializations</label>
                  <select
                    multiple
                    value={personnel.specializations}
                    onChange={(e) => handleArrayInputChange('specializations', Array.from(e.target.selectedOptions, option => option.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {radiologySpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>
            )}

            {personnel.role === 'lab-technologist' && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-800">Lab Technologist Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Certification Number *</label>
                    <input
                      type="text"
                      name="certificationNumber"
                      value={personnel.certificationNumber}
                      onChange={handleInputChange}
                      required
                      className={getInputClassName('certificationNumber')}
                    />
                    {renderFieldError('certificationNumber')}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={personnel.yearsOfExperience}
                      onChange={handleInputChange}
                      min="0"
                      className={getInputClassName('yearsOfExperience')}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Specializations</label>
                  <select
                    multiple
                    value={personnel.specializations}
                    onChange={(e) => handleArrayInputChange('specializations', Array.from(e.target.selectedOptions, option => option.value))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    {labSpecializations.map(spec => (
                      <option key={spec} value={spec}>{spec}</option>
                    ))}
                  </select>
                  <p className="mt-1 text-sm text-gray-500">Hold Ctrl/Cmd to select multiple</p>
                </div>
              </div>
            )}

            {personnel.role === 'hospital-front-desk' && (
              <div className="space-y-4 p-4 bg-yellow-50 rounded-lg">
                <h4 className="font-medium text-yellow-800">Front Desk Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Shift</label>
                    <select
                      name="shift"
                      value={personnel.shift}
                      onChange={handleInputChange}
                      className={getInputClassName('shift')}
                    >
                      <option value="Morning">Morning</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Access Level</label>
                    <select
                      name="accessLevel"
                      value={personnel.accessLevel}
                      onChange={handleInputChange}
                      className={getInputClassName('accessLevel')}
                    >
                      <option value="Basic">Basic</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={adding}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center transition-colors ${
                adding ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {adding && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {adding ? 'Adding Personnel...' : 'Add Personnel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddHospitalPersonnelModal; 