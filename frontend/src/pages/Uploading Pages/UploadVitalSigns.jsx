import React from 'react';
import { useParams, Link } from 'react-router-dom';
import UploadVitals from '../../components/DoctorComponents/EHR/Vitals/UploadVitals';

const UploadVitalSigns = () => {
  const { patientId } = useParams();

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-green-800">Upload Vital Signs</h1>
        <Link 
          to={`/?patientId=${patientId}`} 
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-gray-700"
        >
          Back to EHR
        </Link>
          </div>

      <UploadVitals 
        patientId={patientId}
        onSuccess={() => window.location.href = `/?patientId=${patientId}`}
      />
      
      <div className="mt-6 text-center">
        <Link 
          to={`/?patientId=${patientId}`}
          className="text-green-600 hover:text-green-800"
        >
          Return to patient record without saving
        </Link>
        </div>
    </div>
  );
};

export default UploadVitalSigns; 