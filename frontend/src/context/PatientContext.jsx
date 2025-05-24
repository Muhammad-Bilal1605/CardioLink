import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const PatientContext = createContext();

export const PatientProvider = ({ children }) => {
  const [currentPatientId, setCurrentPatientId] = useState(null);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Function to securely set the current patient
  const setActivePatient = (patientId, patientData = null) => {
    setCurrentPatientId(patientId);
    setCurrentPatient(patientData);
    
    // Store in sessionStorage for the current browser session only
    // This is more secure than localStorage as it's cleared when the browser is closed
    if (patientId) {
      sessionStorage.setItem('activePatientId', patientId);
      if (patientData) {
        sessionStorage.setItem('activePatientData', JSON.stringify(patientData));
      }
    } else {
      sessionStorage.removeItem('activePatientId');
      sessionStorage.removeItem('activePatientData');
    }
  };

  // Function to clear the current patient
  const clearActivePatient = () => {
    setCurrentPatientId(null);
    setCurrentPatient(null);
    sessionStorage.removeItem('activePatientId');
    sessionStorage.removeItem('activePatientData');
  };

  // Function to get the current patient ID
  const getActivePatientId = () => {
    return currentPatientId || sessionStorage.getItem('activePatientId');
  };

  // Function to get the current patient data
  const getActivePatient = () => {
    if (currentPatient) {
      return currentPatient;
    }
    
    const storedData = sessionStorage.getItem('activePatientData');
    return storedData ? JSON.parse(storedData) : null;
  };

  // Restore patient from sessionStorage on context initialization
  useEffect(() => {
    const storedPatientId = sessionStorage.getItem('activePatientId');
    const storedPatientData = sessionStorage.getItem('activePatientData');
    
    if (storedPatientId) {
      setCurrentPatientId(storedPatientId);
      if (storedPatientData) {
        try {
          setCurrentPatient(JSON.parse(storedPatientData));
        } catch (error) {
          console.error('Error parsing stored patient data:', error);
        }
      }
    }
  }, []);

  // Context value
  const value = {
    currentPatientId,
    currentPatient,
    isLoading,
    setIsLoading,
    setActivePatient,
    clearActivePatient,
    getActivePatientId,
    getActivePatient,
  };

  return (
    <PatientContext.Provider value={value}>
      {children}
    </PatientContext.Provider>
  );
};

// Custom hook to use the patient context
export const usePatient = () => {
  const context = useContext(PatientContext);
  if (!context) {
    throw new Error('usePatient must be used within a PatientProvider');
  }
  return context;
};

export default PatientContext; 