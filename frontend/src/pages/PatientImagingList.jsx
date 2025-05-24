import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, User, Calendar, UserPlus } from 'lucide-react';
import { usePatient } from '../context/PatientContext';
import AddPatientModal from '../components/Modals/AddPatientModal';

const PatientImagingList = () => {
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
    // Navigate to upload imaging without patient ID in URL
    navigate('/upload-imaging');
  };

  const handlePatientAdded = (newPatient) => {
    // Add the new patient to the list
    setPatients([newPatient, ...patients]);
    // Automatically select the new patient and navigate to upload
    setActivePatient(newPatient._id, newPatient);
    navigate('/upload-imaging');
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
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Patient Imaging Management</h1>
              <p className="mt-2 text-blue-100">Select a patient to upload their medical imaging</p>
            </div>
            <button 
              className="mt-4 md:mt-0 flex items-center justify-center bg-white text-blue-700 py-2 px-4 rounded-md hover:bg-blue-50 transition-colors font-medium"
              onClick={() => setShowAddModal(true)}
            >
              <UserPlus className="h-5 w-5 mr-1" />
              <span>Add Patient</span>
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="p-6 border-b border-gray-200">
          <div className="relative">
            <input
              type="text"
              placeholder="Search patients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Patient cards */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-100 text-red-700 p-4 rounded-md">
              {error}
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No patients found. {searchTerm ? 'Try a different search term.' : ''}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((patient) => (
                <div
                  key={patient._id}
                  onClick={() => handlePatientClick(patient)}
                  className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 text-white">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-white bg-opacity-20 flex items-center justify-center mr-4">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-lg">{patient.firstName} {patient.lastName}</h2>
                        <div className="flex items-center text-sm mt-1">
                          <span className="inline-flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {calculateAge(patient.dateOfBirth)} years
                          </span>
                          <span className="mx-2">•</span>
                          <span>{patient.gender}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Patient ID: {patient._id.slice(-6)}</span>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        Upload Imaging
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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

export default PatientImagingList; 