import React, { useRef } from 'react';

const ProceduresTab = ({ formData, setFormData, setActiveTab }) => {
  const procedureInputRef = useRef(null);

  const handleProcedureChange = (value) => {
    if (value && !formData.proceduresDone.includes(value)) {
      setFormData(prev => ({
        ...prev,
        proceduresDone: [...prev.proceduresDone, value]
      }));
      if (procedureInputRef.current) {
        procedureInputRef.current.value = '';
      }
    }
  };

  const removeProcedure = (index) => {
    setFormData(prev => ({
      ...prev,
      proceduresDone: prev.proceduresDone.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Procedures</p>
        <p>Add any procedures performed during this hospitalization.</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Procedures Done</label>
        <div className="flex space-x-2">
          <input
            ref={procedureInputRef}
            type="text"
            placeholder="Enter procedure name"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleProcedureChange(e.target.value);
              }
            }}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={() => {
              if (procedureInputRef.current) {
                handleProcedureChange(procedureInputRef.current.value);
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex-shrink-0"
          >
            Add
          </button>
        </div>
        
        {formData.proceduresDone.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Added Procedures:</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              {formData.proceduresDone.map((procedure, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-0">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="ml-3 text-gray-700">{procedure}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeProcedure(index)}
                    className="text-red-600 hover:text-red-800 flex items-center text-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('associations')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue to Associations
        </button>
      </div>
    </div>
  );
};

export default ProceduresTab; 