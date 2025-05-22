import React from 'react';

const ClinicalDetailsTab = ({ formData, handleChange, setActiveTab }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Clinical Details</p>
        <p>Please provide detailed information about the clinical aspects of this hospitalization.</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Hospitalization</label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          required
          rows="3"
          placeholder="Describe the primary reason for hospitalization"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Outcome</label>
        <textarea
          name="outcome"
          value={formData.outcome}
          onChange={handleChange}
          required
          rows="3"
          placeholder="Describe the outcome of the hospitalization"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Discharge Summary</label>
        <textarea
          name="dischargeSummary"
          value={formData.dischargeSummary}
          onChange={handleChange}
          required
          rows="3"
          placeholder="Enter the discharge summary"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="3"
          placeholder="Any additional notes"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('basicInfo')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('procedures')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue to Procedures
        </button>
      </div>
    </div>
  );
};

export default ClinicalDetailsTab; 