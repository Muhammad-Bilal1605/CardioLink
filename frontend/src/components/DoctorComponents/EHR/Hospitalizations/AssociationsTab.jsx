import React from 'react';

const AssociationsTab = ({ 
  formData, 
  setFormData, 
  setActiveTab, 
  labResults, 
  imaging, 
  procedures, 
  handlePreview 
}) => {
  
  const handleCheckboxChange = (id, field) => {
    setFormData(prev => {
      if (prev[field].includes(id)) {
        return {
          ...prev,
          [field]: prev[field].filter(item => item !== id)
        };
      } else {
        return {
          ...prev,
          [field]: [...prev[field], id]
        };
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Associated Records</p>
        <p>Link this hospitalization to other medical records for this patient.</p>
      </div>

      {/* Lab Results */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-700">Associated Lab Results</h3>
          <p className="text-sm text-gray-500">Select lab results related to this hospitalization</p>
        </div>
        
        <div className="p-4">
          {labResults.length > 0 ? (
            <div className="space-y-3">
              {labResults.map((lab) => (
                <div key={lab._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id={`lab-${lab._id}`}
                      checked={formData.associatedLabResults.includes(lab._id)}
                      onChange={() => handleCheckboxChange(lab._id, 'associatedLabResults')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`lab-${lab._id}`} className="ml-3 block">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(lab.date).toLocaleDateString()} - {lab.testName}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        Category: {lab.category}
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePreview(lab, 'lab');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No lab results available for this patient.</p>
          )}
        </div>
      </div>

      {/* Imaging Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-700">Associated Imaging</h3>
          <p className="text-sm text-gray-500">Select imaging studies related to this hospitalization</p>
        </div>
        
        <div className="p-4">
          {imaging.length > 0 ? (
            <div className="space-y-3">
              {imaging.map((img) => (
                <div key={img._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id={`img-${img._id}`}
                      checked={formData.associatedImaging.includes(img._id)}
                      onChange={() => handleCheckboxChange(img._id, 'associatedImaging')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`img-${img._id}`} className="ml-3 block">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(img.date).toLocaleDateString()} - {img.imagingType}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        Body Part: {img.bodyPart}
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePreview(img, 'imaging');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No imaging studies available for this patient.</p>
          )}
        </div>
      </div>
      
      {/* Procedures Section */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-700">Associated Procedures</h3>
          <p className="text-sm text-gray-500">Select procedures related to this hospitalization</p>
        </div>
        
        <div className="p-4">
          {procedures.length > 0 ? (
            <div className="space-y-3">
              {procedures.map((proc) => (
                <div key={proc._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                  <div className="flex items-start">
                    <input
                      type="checkbox"
                      id={`proc-${proc._id}`}
                      checked={formData.associatedProcedures.includes(proc._id)}
                      onChange={() => handleCheckboxChange(proc._id, 'associatedProcedures')}
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`proc-${proc._id}`} className="ml-3 block">
                      <span className="text-sm font-medium text-gray-700">
                        {new Date(proc.date).toLocaleDateString()} - {proc.procedureName}
                      </span>
                      <span className="text-xs text-gray-500 block mt-1">
                        Category: {proc.category}
                      </span>
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handlePreview(proc, 'procedure');
                    }}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Details
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No procedures available for this patient.</p>
          )}
        </div>
      </div>

      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => setActiveTab('procedures')}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue to Documents
        </button>
      </div>
    </div>
  );
};

export default AssociationsTab; 