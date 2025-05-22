import React, { useState, useEffect } from 'react';
import axios from 'axios';

const RightRow3Column1 = ({ patientId }) => {
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`http://localhost:5000/api/patients/${patientId}`);
        
        if (response.data.success) {
          setPatientData(response.data.data);
        } else {
          setError('Failed to fetch patient data');
        }
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [patientId]);

  // Extract social history data from patient data
  const socialHistory = patientData?.socialHistory || {};
  const tobaccoUse = patientData?.tobaccoUse || 'Unknown';
  const alcoholUse = patientData?.alcoholUse || 'Unknown';
  const illicitDrugUse = patientData?.illicitDrugUse || 'Unknown';
  const occupation = patientData?.occupation || '';
  
  // Check if we have any social history data
  const hasSocialHistoryData = tobaccoUse !== 'Unknown' || 
    alcoholUse !== 'Unknown' || 
    illicitDrugUse !== 'Unknown' || 
    occupation !== '';
  
  return (
    <div className="bg-white p-4 rounded-lg shadow w-full">
      <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Social History</h3>
      
      {loading ? (
        <div className="text-center py-4">
          <div className="animate-pulse bg-gray-200 h-4 w-1/2 mx-auto mb-2 rounded"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-3/4 mx-auto rounded"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center py-2">{error}</div>
      ) : !hasSocialHistoryData ? (
        <div className="text-gray-500 italic text-center">No social history data available</div>
      ) : (
        <div className="space-y-3">
          <div>
            <span className="font-medium text-gray-700">Tobacco Use:</span> 
            <span className="ml-2">{tobaccoUse}</span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Alcohol Use:</span> 
            <span className="ml-2">{alcoholUse}</span>
          </div>
          
          <div>
            <span className="font-medium text-gray-700">Illicit Drug Use:</span> 
            <span className="ml-2">{illicitDrugUse}</span>
          </div>
          
          {occupation && (
            <div>
              <span className="font-medium text-gray-700">Occupation:</span> 
              <span className="ml-2">{occupation}</span>
            </div>
          )}
          
          {/* Display any additional social history data if available */}
          {Object.keys(socialHistory).length > 0 && (
            <div className="mt-2 pt-2 border-t">
              <h4 className="font-medium text-gray-700 mb-1">Additional Details:</h4>
              <pre className="text-sm whitespace-pre-wrap bg-gray-50 p-2 rounded">
                {JSON.stringify(socialHistory, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RightRow3Column1; 