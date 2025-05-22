// Create a new component file: src/components/LeftRow2.jsx

import React, { useState } from 'react';

const LeftRow2 = ({ activePage, onPageChange }) => {
  const pages = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'visits', name: 'Visits', icon: '👨‍⚕️' },
    { id: 'hospitalizations', name: 'Hospitalizations', icon: '🏥' },
    { id: 'procedures', name: 'Procedures', icon: '⚕️' },
    { id: 'labs', name: 'Labs', icon: '🧪' },
    { id: 'imaging', name: 'Imaging', icon: '🔬' },
    { id: 'medications', name: 'Medications', icon: '💊' },
    { id: 'vitals', name: 'Vital Signs', icon: '❤️' }
  ];

  return (
    <div className="w-full rounded-lg shadow-md p-2">
      
      <nav className="flex flex-col space-y-1">
        {pages.map((page) => (
          <button
            key={page.id}
            onClick={() => onPageChange(page.id)}
            className={`flex items-center p-3 rounded-md transition-colors duration-200 ${
              activePage === page.id
                ? 'bg-green-600 text-white'
                : 'hover:bg-blue-100 text-gray-700'
            }`}
          >
            <span className="mr-3 text-lg">{page.icon}</span>
            <span className="font-medium">{page.name}</span>
            {activePage === page.id && (
              <span className="ml-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default LeftRow2;