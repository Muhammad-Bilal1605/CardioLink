import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Search, UserPlus, Calendar, Phone, Mail, X } from 'lucide-react';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPatient, setNewPatient] = useState({
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
  const [currentStep, setCurrentStep] = useState(1);
  const [addingPatient, setAddingPatient] = useState(false);
  const [addError, setAddError] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const endpoint = `http://localhost:5000/api/patients/search?query=${encodeURIComponent(searchTerm)}`;
        const response = await axios.get(endpoint);
        
        if (response.data.success) {
          setPatients(response.data.data);
        } else {
          setError('Failed to fetch patients');
        }
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPatients();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handlePatientClick = (patientId) => {
    navigate(`/ehr?patientId=${patientId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const calculateAge = (birthDateString) => {
    if (!birthDateString) return 'N/A';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewPatient(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNestedInputChange = (section, field, value) => {
    setNewPatient(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    setAddingPatient(true);
    setAddError(null);
    
    try {
      const response = await axios.post('http://localhost:5000/api/patients', newPatient);
      
          if (response.data.success) {
            setPatients([response.data.data, ...patients]);
            setShowAddModal(false);
        setCurrentStep(1);
    setNewPatient({
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
      }
    } catch (err) {
      console.error('Error adding patient:', err);
      setAddError(err.response?.data?.error || 'Failed to add patient');
    } finally {
      setAddingPatient(false);
    }
  };

  const renderAddPatientForm = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={newPatient.firstName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={newPatient.lastName}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={newPatient.dateOfBirth}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select
                  name="gender"
                  value={newPatient.gender}
                  onChange={handleInputChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={newPatient.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input
                type="password"
                name="password"
                value={newPatient.password}
                onChange={handleInputChange}
                required
                minLength={6}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
              <p className="mt-1 text-sm text-gray-500">Password must be at least 6 characters long</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Phone Number</label>
              <input
                type="tel"
                name="phoneNumber"
                value={newPatient.phoneNumber}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Address Information</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">Street</label>
              <input
                type="text"
                value={newPatient.address.street}
                onChange={(e) => handleNestedInputChange('address', 'street', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">City</label>
                <input
                  type="text"
                  value={newPatient.address.city}
                  onChange={(e) => handleNestedInputChange('address', 'city', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">State</label>
                <input
                  type="text"
                  value={newPatient.address.state}
                  onChange={(e) => handleNestedInputChange('address', 'state', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                <input
                  type="text"
                  value={newPatient.address.zipCode}
                  onChange={(e) => handleNestedInputChange('address', 'zipCode', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Country</label>
                <input
                  type="text"
                  value={newPatient.address.country}
                  onChange={(e) => handleNestedInputChange('address', 'country', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Social History</h3>
            
            {/* Tobacco Use Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Tobacco Use</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={newPatient.socialHistory.tobaccoUse}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'tobaccoUse', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
                  value={newPatient.socialHistory.tobaccoType}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'tobaccoType', e.target.value)}
                  placeholder="e.g., Cigarettes, Cigars, Vaping"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <input
                  type="text"
                  value={newPatient.socialHistory.tobaccoFrequency}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'tobaccoFrequency', e.target.value)}
                  placeholder="e.g., Daily, Occasional, 1 pack per day"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Alcohol Use Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Alcohol Use</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={newPatient.socialHistory.alcoholUse}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'alcoholUse', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
                  value={newPatient.socialHistory.alcoholType}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'alcoholType', e.target.value)}
                  placeholder="e.g., Beer, Wine, Spirits"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <input
                  type="text"
                  value={newPatient.socialHistory.alcoholFrequency}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'alcoholFrequency', e.target.value)}
                  placeholder="e.g., Social, Daily, 2 drinks per day"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Drug Use Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Illicit Drug Use</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={newPatient.socialHistory.illicitDrugUse}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'illicitDrugUse', e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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
                  value={newPatient.socialHistory.drugType}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'drugType', e.target.value)}
                  placeholder="e.g., Marijuana, Cocaine"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <input
                  type="text"
                  value={newPatient.socialHistory.drugFrequency}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'drugFrequency', e.target.value)}
                  placeholder="e.g., Occasional, Weekly"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Occupation Section */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700">Occupation</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700">Current Occupation</label>
                <input
                  type="text"
                  value={newPatient.socialHistory.occupation}
                  onChange={(e) => handleNestedInputChange('socialHistory', 'occupation', e.target.value)}
                  placeholder="Enter current occupation"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                />
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Special Directives</h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newPatient.specialDirectives.dnr}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'dnr', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Do Not Resuscitate (DNR)</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newPatient.specialDirectives.livingWill}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'livingWill', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Living Will</label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newPatient.specialDirectives.organDonor}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'organDonor', e.target.checked)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">Organ Donor</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Religious Instructions</label>
                <textarea
                  value={newPatient.specialDirectives.religiousInstructions}
                  onChange={(e) => handleNestedInputChange('specialDirectives', 'religiousInstructions', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
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

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <User className="h-8 w-8 mr-2 text-green-600" />
            <h1 className="text-2xl font-bold text-gray-800">Patient Directory</h1>
          </div>
          
          <div className="flex flex-col md:flex-row gap-2">
            {/* Search box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 w-full"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            {/* Add new patient button */}
            <button 
              className="flex items-center justify-center bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus className="h-5 w-5 mr-1" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>
        
        {/* Main content */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : patients.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <p className="text-gray-500">No patients found. {searchTerm ? 'Try a different search term.' : ''}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {patients.map((patient) => (
              <div 
                key={patient._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handlePatientClick(patient._id)}
              >
                <div className="bg-gradient-to-r from-green-500 to-teal-400 p-4 text-white">
                  <h2 className="font-semibold text-lg">{patient.firstName} {patient.lastName}</h2>
                  <div className="flex items-center text-sm mt-1">
                    <span className="inline-flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {formatDate(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)} years)
                    </span>
                    <span className="mx-2">•</span>
                    <span>{patient.gender}</span>
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex items-center mb-2">
                    <Phone className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 text-sm">{patient.phoneNumber}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <Mail className="h-4 w-4 text-gray-500 mr-2" />
                    <span className="text-gray-700 text-sm">{patient.email}</span>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-between items-center">
                  <span className="text-xs text-gray-500">Last updated: {formatDate(patient.updatedAt)}</span>
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">View EHR</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Patient Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Add New Patient</h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setCurrentStep(1);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddPatient} className="p-6">
              {addError && (
                <div className="mb-4 bg-red-100 text-red-700 p-3 rounded-md text-sm">
                  {addError}
                </div>
              )}
              
              {renderAddPatientForm()}

              <div className="mt-6 flex justify-between">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    Previous
                  </button>
                )}
                <div className="flex space-x-3">
                  {currentStep < 4 ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentStep(prev => prev + 1);
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={addingPatient}
                      className={`px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center ${
                        addingPatient ? 'opacity-70 cursor-not-allowed' : ''
                      }`}
                    >
                      {addingPatient && (
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      )}
                      {addingPatient ? 'Adding...' : 'Add Patient'}
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientList; 