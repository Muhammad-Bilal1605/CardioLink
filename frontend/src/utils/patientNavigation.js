import { useNavigate } from 'react-router-dom';
import { usePatient } from '../context/PatientContext';

// Custom hook for secure patient navigation
export const usePatientNavigation = () => {
  const navigate = useNavigate();
  const { setActivePatient, getActivePatientId } = usePatient();

  // Navigate to EHR with patient context
  const navigateToEHR = (patient) => {
    if (patient && patient._id) {
      setActivePatient(patient._id, patient);
      navigate('/ehr');
    } else {
      console.error('Patient data is required for EHR navigation');
    }
  };

  // Navigate to upload pages with patient context
  const navigateToUpload = (uploadType, patient) => {
    if (patient && patient._id) {
      setActivePatient(patient._id, patient);
      navigate(`/upload-${uploadType}`);
    } else {
      console.error('Patient data is required for upload navigation');
    }
  };

  // Navigate back to patient list
  const navigateToPatientList = () => {
    navigate('/patients');
  };

  // Check if patient is selected and redirect if not
  const ensurePatientSelected = () => {
    const patientId = getActivePatientId();
    if (!patientId) {
      console.log('No patient selected, redirecting to patient list');
      navigate('/patients');
      return false;
    }
    return true;
  };

  return {
    navigateToEHR,
    navigateToUpload,
    navigateToPatientList,
    ensurePatientSelected,
  };
};

// Utility functions for non-hook contexts
export const patientNavigation = {
  // Get secure EHR URL (no patient ID exposed)
  getEHRUrl: () => '/ehr',
  
  // Get secure upload URLs (no patient ID exposed)
  getUploadUrl: (uploadType) => `/upload-${uploadType}`,
  
  // Available upload types
  uploadTypes: {
    IMAGING: 'imaging',
    LAB_RESULTS: 'lab-results',
    PROCEDURES: 'procedures', 
    MEDICATIONS: 'medications',
    VISITS: 'visits',
    HOSPITALIZATIONS: 'hospitalizations',
    VITAL_SIGNS: 'vital-signs'
  }
}; 