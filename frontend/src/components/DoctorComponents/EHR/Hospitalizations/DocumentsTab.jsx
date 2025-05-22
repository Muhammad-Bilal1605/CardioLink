import React from 'react';
import { useNavigate } from 'react-router-dom';

const DocumentsTab = ({ 
  formData, 
  handleFileChange, 
  setActiveTab, 
  patientId, 
  loading, 
  handleSubmit 
}) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Documents</p>
        <p>Upload supporting documents for this hospitalization.</p>
      </div>
      
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-700">Discharge Report</h3>
        </div>
        
        <div className="p-6">
          <div className="max-w-xl mx-auto flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors">
            <input
              type="file"
              id="discharge-report"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,image/*"
              className="hidden"
            />
            <label htmlFor="discharge-report" className="cursor-pointer text-center">
              {!formData.dischargeReport ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <span className="mt-2 block text-sm font-medium text-gray-700">
                    Click to upload discharge report
                  </span>
                  <span className="mt-1 block text-xs text-gray-500">
                    PDF, DOC, DOCX, or images up to 10MB
                  </span>
                </>
              ) : (
                <div className="space-y-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="block text-sm font-medium text-gray-700">
                    {formData.dischargeReport.name}
                  </span>
                  <span className="block text-xs text-gray-500">
                    Click to change file
                  </span>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('associations')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            onClick={handleSubmit}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </>
            ) : (
              'Save Hospitalization Record'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentsTab; 