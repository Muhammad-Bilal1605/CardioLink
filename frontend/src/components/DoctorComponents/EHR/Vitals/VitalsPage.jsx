import React, { useState } from 'react';
import UploadVitals from './UploadVitals';
import VitalsList from './VitalsList';

const VitalsPage = ({ patientId }) => {
  const [view, setView] = useState('list'); // 'list' or 'upload'
  
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4 md:mb-0">
          Patient Vital Signs
        </h1>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setView('list')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'list'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            View History
          </button>
          <button
            onClick={() => setView('upload')}
            className={`px-4 py-2 rounded-md font-medium ${
              view === 'upload'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Add New
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="mt-4">
        {view === 'list' ? (
          <VitalsList patientId={patientId} />
        ) : (
          <UploadVitals 
            patientId={patientId} 
            onSuccess={() => setView('list')}
          />
        )}
      </div>
    </div>
  );
};

export default VitalsPage; 