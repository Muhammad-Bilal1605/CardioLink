import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Search, UserPlus, Calendar, Phone, Mail } from 'lucide-react';
import { usePatient } from '../../context/PatientContext';
import AddPatientModal from '../../components/Modals/AddPatientModal';

const PatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const navigate = useNavigate();
  const { setActivePatient } = usePatient();

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

  const handlePatientClick = (patient) => {
    // Set the active patient in context with full patient data
    setActivePatient(patient._id, patient);
    // Navigate to EHR without patient ID in URL
    navigate('/ehr');
  };

  const handlePatientAdded = (newPatient) => {
    // Add the new patient to the list
    setPatients([newPatient, ...patients]);
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
                onClick={() => handlePatientClick(patient)}
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
      <AddPatientModal 
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onPatientAdded={handlePatientAdded}
        title="Add New Patient"
      />
    </div>
  );
};

export default PatientList; 