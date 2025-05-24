// src/components/Overview/LeftRow1.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePatient } from '../../../../context/PatientContext';
import profileImage from '../../../../images/profile.png';

const LeftRow1 = () => {
  const { getActivePatientId, getActivePatient } = usePatient();
  const patientId = getActivePatientId();

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) {
        console.error('No patient ID available. Cannot fetch patient data.');
        return;
      }
      
      // First check if we already have patient data in context
      const existingPatient = getActivePatient();
      if (existingPatient) {
        setPatient(existingPatient);
        return;
      }
      
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/patients/${patientId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success && response.data.data) {
          setPatient(response.data.data);
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId, getActivePatient]);

  // Calculate age from DOB
  const calculateAge = (dob) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
    
    return calculatedAge;
  };

  return (
    <div className="flex flex-col items-center bg-white p-3 md:p-6 rounded-xl shadow-lg w-full">
      {/* Profile Image */}
      <div className="w-16 h-16 md:w-24 md:h-24 lg:w-28 lg:h-28 mb-2 md:mb-4">
        <img
          src={profileImage}
          alt="Profile"
          className="w-full h-full object-cover rounded-full border-4 border-blue-200"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/100?text=Profile';
          }}
        />
      </div>

      {/* Basic Info */}
      <div className="text-center space-y-0 md:space-y-1 mb-3 md:mb-5">
        <h2 className="text-base md:text-lg lg:text-xl font-semibold text-gray-800">
          {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Name'}
        </h2>
        <p className="text-gray-600 text-xs md:text-sm">
          Age: {patient ? calculateAge(patient.dateOfBirth) : 'N/A'}
        </p>
        <p className="text-gray-600 text-xs md:text-sm">
          Gender: {patient?.gender || 'N/A'}
        </p>
      </div>

      {/* Divider Line */}
      <div className="w-full border-t border-gray-300 mb-2 md:mb-4"></div>

      {/* Emergency Contact */}
      <div className="w-full text-xs md:text-sm text-gray-700">
        <h3 className="font-semibold text-blue-600 mb-1">Emergency Contact</h3>
        <ul className="space-y-1">
          <li className="flex justify-between">
            <span>Name:</span>
            <span className="font-medium">{patient?.emergencyContact?.name || 'N/A'}</span>
          </li>
          <li className="flex justify-between">
            <span>Relation:</span>
            <span className="font-medium">{patient?.emergencyContact?.relationship || 'N/A'}</span>
          </li>
          <li className="flex justify-between">
            <span>Phone:</span>
            <span className="font-medium text-xs md:text-sm">{patient?.emergencyContact?.phoneNumber || 'N/A'}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default LeftRow1;