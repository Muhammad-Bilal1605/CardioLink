import React from 'react';
import { Cigarette, Wine, Pill, Briefcase } from 'lucide-react';

const SocialHistory = ({ patient }) => {
  const { socialHistory } = patient;

  // Helper function to check if a value should be displayed
  const shouldDisplay = (value) => {
    return value && value.toLowerCase() !== 'unknown' && value.toLowerCase() !== 'never';
  };

  // Helper function to get status color
  const getStatusColor = (status) => {
    const lowerStatus = status?.toLowerCase();
    if (lowerStatus === 'current') return 'text-red-600';
    if (lowerStatus === 'former') return 'text-orange-600';
    if (lowerStatus === 'occasional') return 'text-yellow-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span className="bg-blue-100 p-2 rounded-lg mr-2">
          <Cigarette className="h-5 w-5 text-blue-600" />
        </span>
        Social History
      </h3>
      
      {/* Tobacco Use */}
      {shouldDisplay(socialHistory.tobaccoUse) && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Cigarette className="h-4 w-4 mr-2 text-gray-500" />
            Tobacco Use
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-sm text-gray-500">Status</span>
              <p className={`font-medium ${getStatusColor(socialHistory.tobaccoUse)}`}>
                {socialHistory.tobaccoUse}
              </p>
            </div>
            {shouldDisplay(socialHistory.tobaccoType) && (
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Type</span>
                <p className="font-medium text-gray-800">{socialHistory.tobaccoType}</p>
              </div>
            )}
            {shouldDisplay(socialHistory.tobaccoFrequency) && (
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Frequency</span>
                <p className="font-medium text-gray-800">{socialHistory.tobaccoFrequency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alcohol Use */}
      {shouldDisplay(socialHistory.alcoholUse) && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Wine className="h-4 w-4 mr-2 text-gray-500" />
            Alcohol Use
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-sm text-gray-500">Status</span>
              <p className={`font-medium ${getStatusColor(socialHistory.alcoholUse)}`}>
                {socialHistory.alcoholUse}
              </p>
            </div>
            {shouldDisplay(socialHistory.alcoholType) && (
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Type</span>
                <p className="font-medium text-gray-800">{socialHistory.alcoholType}</p>
              </div>
            )}
            {shouldDisplay(socialHistory.alcoholFrequency) && (
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Frequency</span>
                <p className="font-medium text-gray-800">{socialHistory.alcoholFrequency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Drug Use */}
      {shouldDisplay(socialHistory.illicitDrugUse) && (
        <div className="mb-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Pill className="h-4 w-4 mr-2 text-gray-500" />
            Illicit Drug Use
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md shadow-sm">
              <span className="text-sm text-gray-500">Status</span>
              <p className={`font-medium ${getStatusColor(socialHistory.illicitDrugUse)}`}>
                {socialHistory.illicitDrugUse}
              </p>
            </div>
            {shouldDisplay(socialHistory.drugType) && (
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Type</span>
                <p className="font-medium text-gray-800">{socialHistory.drugType}</p>
              </div>
            )}
            {shouldDisplay(socialHistory.drugFrequency) && (
              <div className="bg-white p-3 rounded-md shadow-sm">
                <span className="text-sm text-gray-500">Frequency</span>
                <p className="font-medium text-gray-800">{socialHistory.drugFrequency}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Occupation */}
      {shouldDisplay(socialHistory.occupation) && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 mb-3 flex items-center">
            <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
            Occupation
          </h4>
          <div className="bg-white p-3 rounded-md shadow-sm">
            <span className="text-sm text-gray-500">Current</span>
            <p className="font-medium text-gray-800">{socialHistory.occupation}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialHistory; 