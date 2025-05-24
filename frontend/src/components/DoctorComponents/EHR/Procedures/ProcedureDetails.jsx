import React, { useState } from 'react';
import { 
  FaArrowLeft, 
  FaNotesMedical, 
  FaImages, 
  FaFileMedical, 
  FaDownload, 
  FaRegFilePdf,
  FaPrint,
  FaFileAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';

function ProcedureDetails({ procedure, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!procedure) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileUrl = (filePath) => {
    if (!filePath) return '';
    
    // Extract filename from the filePath (remove /uploads/ prefix)
    const filename = filePath.replace('/uploads/', '');
    
    // Use the dedicated procedure file route with URL encoding
    const encodedFilename = encodeURIComponent(filename);
    
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/procedures/file/${encodedFilename}`;
  };

  const handleViewFile = (filePath) => {
    if (filePath) {
      const fileUrl = getFileUrl(filePath);
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownloadFile = (filePath) => {
    if (filePath) {
      const fileUrl = getFileUrl(filePath);
      const filename = filePath.replace('/uploads/', '');
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isImageFile = (filePath) => {
    const ext = filePath.toLowerCase().split('.').pop();
    return ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext);
  };

  const isPdfFile = (filePath) => {
    return filePath.toLowerCase().endsWith('.pdf');
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to list
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
            >
              <FaPrint className="mr-2" /> Print
            </button>
          </div>
        </div>
        
        {/* Procedure Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{procedure.procedureName}</h2>
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <span className="font-medium">{formatDate(procedure.date)}</span>
                <span className="mx-2">•</span>
                <span>{formatTime(procedure.date)}</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${getStatusBadgeClass(procedure.status)}`}>
                {procedure.status.charAt(0).toUpperCase() + procedure.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-medium">Physician:</span>
              <div className="font-semibold text-gray-900 mt-1">{procedure.physician}</div>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Hospital:</span>
              <div className="font-semibold text-gray-900 mt-1">{procedure.hospital}</div>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Status:</span>
              <div className="font-semibold text-gray-900 mt-1">{procedure.status}</div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex -mb-px px-6 overflow-x-auto">
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('summary')}
            >
              <div className="flex items-center">
                <FaNotesMedical className="mr-2" />
                Summary
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'images'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('images')}
            >
              <div className="flex items-center">
                <FaImages className="mr-2" />
                Images
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'documents'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('documents')}
            >
              <div className="flex items-center">
                <FaFileMedical className="mr-2" />
                Documents
              </div>
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 bg-gray-50">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-blue-700">Procedure Information</h3>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Procedure Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{procedure.procedureName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Physician</dt>
                      <dd className="mt-1 text-sm text-gray-900">{procedure.physician}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Hospital</dt>
                      <dd className="mt-1 text-sm text-gray-900">{procedure.hospital}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(procedure.date)} at {formatTime(procedure.date)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="mt-1 text-sm text-gray-900">{procedure.status}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-blue-700">Indication</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 leading-relaxed">{procedure.indication || 'No indication recorded.'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-blue-700">Findings</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 leading-relaxed">{procedure.findings || 'No findings recorded.'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-blue-700">Complications</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 leading-relaxed">{procedure.complications || 'No complications recorded.'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-blue-700">Follow-up Plan</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 leading-relaxed">{procedure.followUpPlan || 'No follow-up plan recorded.'}</p>
                </div>
              </div>
              
              {procedure.notes && (
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-blue-700">Additional Notes</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-gray-700 leading-relaxed">{procedure.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            {procedure.images && procedure.images.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {procedure.images.map((imagePath, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                      <h3 className="text-sm font-semibold text-blue-700">Procedure Image {index + 1}</h3>
                    </div>
                    <div className="p-5">
                      <div className="aspect-w-16 aspect-h-9 mb-4">
                        <img
                          src={getFileUrl(imagePath)}
                          alt={`Procedure image ${index + 1}`}
                          className="w-full h-48 object-cover rounded-lg bg-gray-100"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden w-full h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                          <FaImages className="h-12 w-12 text-gray-400" />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">
                          {imagePath.split('/').pop().replace(/-\d+/, '')}
                        </p>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewFile(imagePath)}
                            className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <FaExternalLinkAlt className="mr-1" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadFile(imagePath)}
                            className="inline-flex items-center px-3 py-1 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <FaDownload className="mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FaImages className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No images available</h3>
                <p className="mt-1 text-sm text-gray-500">Procedure images will appear here when available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {procedure.documents && procedure.documents.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-blue-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-blue-700">Procedure Documents</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {procedure.documents.map((documentPath, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                          <FaRegFilePdf className="text-red-500 text-2xl mr-4" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">Document {index + 1}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              {documentPath.split('/').pop().replace(/-\d+/, '')} • PDF Document
                            </p>
                            <p className="text-xs text-gray-500">
                              Created: {formatDate(procedure.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewFile(documentPath)}
                            className="inline-flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <FaExternalLinkAlt className="mr-2" />
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadFile(documentPath)}
                            className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                          >
                            <FaDownload className="mr-2" />
                            Download
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* PDF Preview for first document */}
                  {procedure.documents.length > 0 && isPdfFile(procedure.documents[0]) && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Document Preview</h4>
                      <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                        <iframe
                          src={getFileUrl(procedure.documents[0])}
                          className="w-full h-96"
                          title="Document Preview"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden p-8 text-center bg-gray-50">
                          <FaFileAlt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                          <p className="text-sm text-gray-600">Preview not available. Click "View" to open in new tab.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaFileMedical className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents available</h3>
                <p className="mt-1 text-sm text-gray-500">Procedure documents will appear here when available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProcedureDetails; 