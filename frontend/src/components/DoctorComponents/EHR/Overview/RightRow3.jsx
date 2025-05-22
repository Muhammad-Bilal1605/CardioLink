import React from 'react';
import RightRow3Column1 from './RightRow3Column1';
import SpecialDirectives from '../SpecialDirectives';

const RightRow3 = ({ patientId }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {patientId && (
                    <>
                      <SocialHistory patient={patient} />
                      <SpecialDirectives patient={patient} />
                    </>
      )}
      
      {/* Column 2 - Empty for future use */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Future Section</h3>
        <div className="text-gray-500 italic text-center h-full flex items-center justify-center">
          <p>Reserved for future content</p>
        </div>
      </div>
      
      {/* Column 3 - Empty for future use */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-semibold text-gray-800 mb-3 border-b pb-2">Future Section</h3>
        <div className="text-gray-500 italic text-center h-full flex items-center justify-center">
          <p>Reserved for future content</p>
        </div>
      </div>
    </div>
  );
};

export default RightRow3; 