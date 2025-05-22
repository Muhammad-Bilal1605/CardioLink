import React, { useState, useEffect } from 'react';
import DocumentViewer from './DocumentViewer';

const PreviewModal = ({ item, onClose }) => {
  const [showDocumentViewer, setShowDocumentViewer] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [hasImage, setHasImage] = useState(false);
  const [hasReportFile, setHasReportFile] = useState(false);
  const [hasAdditionalFiles, setHasAdditionalFiles] = useState(false);

  useEffect(() => {
    // Check if the item has images or documents
    if (item) {
      // Check for image URL
      setHasImage(Boolean(item.imageUrl || (item.type === 'imaging' && item.image)));
      
      // Check for report file
      setHasReportFile(Boolean(item.reportFile || item.reportUrl || item.report));
      
      // Check for additional files
      setHasAdditionalFiles(Boolean(item.additionalFiles && item.additionalFiles.length > 0));
    }
  }, [item]);

  if (!item) return null;

  const handleViewDocument = (doc, type) => {
    const documentToView = { type };
    
    // Handle different document sources
    if (typeof doc === 'string') {
      documentToView.url = doc;
    } else if (doc.url) {
      documentToView.url = doc.url;
    } else if (doc.path) {
      // If it's a path from the server, construct the full URL
      documentToView.url = `http://localhost:5000/${doc.path.replace(/\\/g, '/')}`;
    } else if (typeof doc === 'object') {
      // For objects with file information
      documentToView.name = doc.name || doc.originalname || 'Document';
      documentToView.url = doc.url || (doc.path ? `http://localhost:5000/${doc.path.replace(/\\/g, '/')}` : null);
    }
    
    setSelectedDocument(documentToView);
    setShowDocumentViewer(true);
  };

  // Helper function to render a field only if it exists
  const renderField = (label, value, span = false) => {
    if (value === undefined || value === null || value === '') return null;
    
    // Handle case when value is an object (like lab results)
    let displayValue = value;
    if (typeof value === 'object' && value !== null) {
      // If it's an array, join the values
      if (Array.isArray(value)) {
        displayValue = value.map((item, index) => {
          if (typeof item === 'object') {
            return (
              <div key={index} className="mb-2 pb-2 border-b border-gray-100">
                {Object.entries(item).map(([key, val]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}: </span>
                    {String(val)}
                  </div>
                ))}
              </div>
            );
          }
          return String(item);
        });
      } else {
        // If it's a regular object, format it nicely
        displayValue = (
          <div>
            {Object.entries(value).map(([key, val]) => (
              <div key={key} className="text-sm mb-1">
                <span className="font-medium">{key}: </span>
                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
              </div>
            ))}
          </div>
        );
      }
    }
    
    return (
      <div className={span ? "col-span-2" : ""}>
        <p className="text-sm text-gray-500">{label}</p>
        <div className="font-medium">{displayValue}</div>
      </div>
    );
  };

  // Format date if it's a valid date string
  const formatDate = (dateString) => {
    if (!dateString) return null;
    
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Get image URL based on item type
  const getImageUrl = () => {
    if (item.type === 'imaging') {
      return item.imageUrl || (item.image && item.image.path ? 
        `http://localhost:5000/${item.image.path.replace(/\\/g, '/')}` : null);
    }
    return null;
  };

  // Get report file based on item type
  const getReportFile = () => {
    if (item.reportFile) return item.reportFile;
    if (item.report) return item.report;
    if (item.reportUrl) return { url: item.reportUrl };
    
    // For different record types
    if (item.type === 'lab' && item.report) {
      return item.report;
    } else if (item.type === 'procedure' && item.report) {
      return item.report;
    } else if (item.type === 'imaging' && item.report) {
      return item.report;
    }
    
    return null;
  };

  // Get report file name
  const getReportFileName = () => {
    const report = getReportFile();
    if (!report) return null;
    
    if (typeof report === 'string') return report;
    return report.name || report.originalname || 'Report Document';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {showDocumentViewer ? (
        <DocumentViewer 
          document={selectedDocument} 
          onClose={() => setShowDocumentViewer(false)}
        />
      ) : (
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800">
                {item.type === 'lab' && `Lab Result: ${item.testName || 'Unknown'}`}
                {item.type === 'imaging' && `Imaging: ${item.imagingType || 'Unknown'}`}
                {item.type === 'procedure' && `Procedure: ${item.procedureName || 'Unknown'}`}
              </h3>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-2 gap-4">
                {renderField("Date", formatDate(item.date))}

                {/* Lab Result Specific Details */}
                {item.type === 'lab' && (
                  <>
                    {renderField("Test Name", item.testName)}
                    {renderField("Category", item.category)}
                    {renderField("Tested By", item.testedBy)}
                    {renderField("Lab", item.lab)}
                    {renderField("Results", item.results, true)}
                    {renderField("Normal Range", item.normalRange, true)}
                    {renderField("Interpretation", item.interpretation, true)}
                    {renderField("Test Method", item.testMethod)}
                    {renderField("Specimen Type", item.specimenType)}
                    {renderField("Collection Date", formatDate(item.collectionDate))}
                    {renderField("Report Date", formatDate(item.reportDate))}
                    {renderField("Notes", item.notes, true)}
                  </>
                )}

                {/* Imaging Specific Details */}
                {item.type === 'imaging' && (
                  <>
                    {renderField("Imaging Type", item.imagingType)}
                    {renderField("Body Part", item.bodyPart)}
                    {renderField("Radiologist", item.radiologist)}
                    {renderField("Imaging Center", item.imagingCenter)}
                    {renderField("Findings", item.findings, true)}
                    {renderField("Impression", item.impression, true)}
                    {renderField("Recommendations", item.recommendations, true)}
                    {renderField("Modality", item.modality)}
                    {renderField("Contrast Used", item.contrastUsed ? "Yes" : "No")}
                    {renderField("Notes", item.notes, true)}
                  </>
                )}

                {/* Procedure Specific Details */}
                {item.type === 'procedure' && (
                  <>
                    {renderField("Procedure Name", item.procedureName)}
                    {renderField("Category", item.category)}
                    {renderField("Performed By", item.performedBy)}
                    {renderField("Facility", item.facility)}
                    {renderField("Description", item.description, true)}
                    {renderField("Outcome", item.outcome, true)}
                    {renderField("Complications", item.complications, true)}
                    {renderField("Follow-up Instructions", item.followUpInstructions, true)}
                    {renderField("Anesthesia", item.anesthesia)}
                    {renderField("Duration", item.duration)}
                    {renderField("Notes", item.notes, true)}
                  </>
                )}
              </div>
            </div>

            {/* Documents & Files Section */}
            <div className="space-y-4">
              {/* Report Document */}
              {getReportFile() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Report Document</p>
                  <div className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span className="text-blue-700">{getReportFileName()}</span>
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewDocument(getReportFile(), 'report');
                      }} 
                      className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              )}

              {/* For imaging, show the image with larger view option */}
              {item.type === 'imaging' && getImageUrl() && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Image</p>
                  <div className="bg-gray-100 rounded p-2">
                    <div className="relative">
                      <img 
                        src={getImageUrl()} 
                        alt="Medical image" 
                        className="w-full max-h-64 object-contain cursor-pointer" 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewDocument({ url: getImageUrl() }, 'image');
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewDocument({ url: getImageUrl() }, 'image');
                          }}
                          className="p-1 bg-white bg-opacity-70 rounded-full hover:bg-opacity-100"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 8a1 1 0 011-1h1V6a1 1 0 012 0v1h1a1 1 0 110 2H9v1a1 1 0 11-2 0V9H6a1 1 0 01-1-1z" />
                            <path fillRule="evenodd" d="M2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8zm6-4a4 4 0 100 8 4 4 0 000-8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional files if available */}
              {item.additionalFiles && item.additionalFiles.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Additional Documents</p>
                  <div className="space-y-2">
                    {item.additionalFiles.map((file, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded p-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-blue-700">
                          {typeof file === 'string' ? file : file.name || file.originalname || `File ${index + 1}`}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleViewDocument(file, 'additional');
                          }} 
                          className="ml-auto text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          View
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* If no files or images are available */}
              {!getReportFile() && !getImageUrl() && (!item.additionalFiles || item.additionalFiles.length === 0) && (
                <div className="bg-gray-50 p-4 rounded-lg text-center text-gray-500">
                  No documents or images available for this record.
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  onClose();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PreviewModal; 