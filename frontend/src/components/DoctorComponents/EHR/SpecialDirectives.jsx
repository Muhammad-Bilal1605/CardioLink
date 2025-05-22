import React from 'react';
import { Check, X } from 'lucide-react';

const SpecialDirectives = ({ patient }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Special Directives</h3>
      
      <div className="space-y-4">
        {/* DNR Status */}
        <div className="flex items-center">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">Do Not Resuscitate (DNR)</span>
          </div>
          <div className="flex items-center">
            {patient.specialDirectives.dnr ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Living Will */}
        <div className="flex items-center">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">Living Will</span>
          </div>
          <div className="flex items-center">
            {patient.specialDirectives.livingWill ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Organ Donor */}
        <div className="flex items-center">
          <div className="flex-1">
            <span className="text-sm font-medium text-gray-700">Organ Donor</span>
          </div>
          <div className="flex items-center">
            {patient.specialDirectives.organDonor ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <X className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>

        {/* Religious Instructions */}
        {patient.specialDirectives.religiousInstructions && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Religious Instructions</h4>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {patient.specialDirectives.religiousInstructions}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpecialDirectives; 