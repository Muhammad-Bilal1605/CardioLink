import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { usePatient } from '../../../../../context/PatientContext';
import MedicationItem from './MedicationItem';

const CurrentMedications = () => {
  const { getActivePatientId } = usePatient();
  const patientId = getActivePatientId();
  
  // Log patientId for debugging
  console.log('Medications - Using patient ID from context:', patientId);
  
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMedications = async () => {
      if (!patientId) {
        console.error('No patient ID available. Cannot fetch medications.');
        return;
      }

      console.log('Fetching medications for patient ID:', patientId);
      console.log('API URL:', `http://localhost:5000/api/medications/patient/${patientId}`);
      
      setLoading(true);
      try {
        // Fix the endpoint URL to match the backend route pattern
        const response = await axios.get(`http://localhost:5000/api/medications/patient/${patientId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Medications API response:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data)) {
          console.log('Medications data available:', response.data.data.length, 'records');
          setMedications(response.data.data);
        } else {
          console.log('No medications data available or invalid format');
          console.log('Success flag:', response.data.success);
          console.log('Is data an array?', Array.isArray(response.data.data));
          console.log('Data length:', response.data.data ? response.data.data.length : 'null');
          setError('Failed to fetch medications');
        }
      } catch (err) {
        console.error('Error fetching medications:', err);
        if (err.response) {
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
        }
        setError('Error fetching medications');
      } finally {
        setLoading(false);
      }
    };

    fetchMedications();
  }, [patientId]);

  return (
    <div className='bg-white w-full rounded-lg p-4'>
      <h3 className="text-lg font-semibold text-green-800 mb-3">Current Medications</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <p className="text-gray-500">Loading medications...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4">
          <p className="text-red-500">{error}</p>
        </div>
      ) : medications.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500">No active medications found</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-h-64 pr-1 space-y-2 w-full">
          {medications.map((med, index) => (
            <MedicationItem
              key={med._id || index}
              name={med.name}
              dosage={med.dosage}
              frequency={med.frequency}
              startDate={med.startDate}
              endDate={med.endDate}
              prescribedBy={med.prescribedBy}
              reason={med.reason}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CurrentMedications;