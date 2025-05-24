import React, { useState } from 'react';
import { 
  FaFileMedical, 
  FaNotesMedical, 
  FaFlask, 
  FaArrowLeft,
  FaDownload,
  FaRegFilePdf,
  FaPrint,
  FaFileAlt,
  FaExternalLinkAlt
} from 'react-icons/fa';

function LabDetails({ lab, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');

  if (!lab) return null;

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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileUrl = (reportUrl) => {
    if (!reportUrl) return '';
    
    // Extract filename from the reportUrl (remove /uploads/ prefix)
    const filename = reportUrl.replace('/uploads/', '');
    
    // Use the dedicated lab file route with URL encoding
    const encodedFilename = encodeURIComponent(filename);
    
    return `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/lab-results/file/${encodedFilename}`;
  };

  const handleViewDocument = () => {
    if (lab.reportUrl) {
      const fileUrl = getFileUrl(lab.reportUrl);
      window.open(fileUrl, '_blank');
    }
  };

  const handleDownloadDocument = () => {
    if (lab.reportUrl) {
      const fileUrl = getFileUrl(lab.reportUrl);
      const filename = lab.reportUrl.replace('/uploads/', '');
      
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="border-b border-gray-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="inline-flex items-center text-green-600 hover:text-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-md transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to list
          </button>
          <div className="flex space-x-3">
            <button 
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            {lab.reportUrl && (
            <button 
                onClick={handleDownloadDocument}
                className="inline-flex items-center px-4 py-2 bg-green-600 rounded-lg text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors shadow-sm"
            >
                <FaDownload className="mr-2" /> Download Report
            </button>
            )}
          </div>
        </div>
        
        {/* Lab Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-blue-50 border-t border-b border-gray-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{lab.testName}</h2>
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <span className="font-medium">{formatDate(lab.date)}</span>
                <span className="mx-2">•</span>
                <span>{formatTime(lab.date)}</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full ${getStatusBadgeClass(lab.status)}`}>
                {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 font-medium">Doctor:</span>
              <div className="font-semibold text-gray-900 mt-1">{lab.doctor}</div>
            </div>
            <div>
              <span className="text-gray-500 font-medium">Test Type:</span>
              <div className="font-semibold text-gray-900 mt-1">{lab.testType}</div>
            </div>
              <div>
              <span className="text-gray-500 font-medium">Facility:</span>
              <div className="font-semibold text-gray-900 mt-1">{lab.facility}</div>
              </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 bg-white">
          <nav className="flex -mb-px px-6 overflow-x-auto">
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'summary'
                  ? 'border-green-500 text-green-600'
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
                activeTab === 'results'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('results')}
            >
              <div className="flex items-center">
                <FaFlask className="mr-2" />
                Results
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'documents'
                  ? 'border-green-500 text-green-600'
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
                <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-green-700">Test Information</h3>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Test Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{lab.testName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Test Type</dt>
                      <dd className="mt-1 text-sm text-gray-900">{lab.testType}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Doctor</dt>
                      <dd className="mt-1 text-sm text-gray-900">{lab.doctor}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Facility</dt>
                      <dd className="mt-1 text-sm text-gray-900">{lab.facility}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {formatDate(lab.date)} at {formatTime(lab.date)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-green-700">Notes</h3>
                </div>
                <div className="p-5">
                  <p className="text-gray-700 leading-relaxed">{lab.notes || 'No notes recorded.'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-green-700">Test Results Overview</h3>
                </div>
                <div className="p-5">
                  {lab.results && lab.results.length > 0 ? (
                    <div className="space-y-4">
                      {lab.results.map((result, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-gray-700">{result.parameter}</p>
                            <p className="text-xs text-gray-500">Reference Range: {result.referenceRange}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{result.value} {result.unit}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                              result.status === 'Abnormal' ? 'bg-red-100 text-red-800' :
                              result.status === 'Critical' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-700">No results available.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {lab.results && lab.results.length > 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-green-700">Detailed Results</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {lab.results.map((result, index) => (
                      <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">{result.parameter}</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <p><span className="font-medium">Reference Range:</span> {result.referenceRange || 'Not specified'}</p>
                              <p><span className="font-medium">Unit:</span> {result.unit || 'Not specified'}</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-lg font-bold text-gray-900 mb-1">
                              {result.value} {result.unit}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                              result.status === 'Abnormal' ? 'bg-red-100 text-red-800' :
                              result.status === 'Critical' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                          }`}>
                            {result.status}
                          </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaFlask className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No results available</h3>
                <p className="mt-1 text-sm text-gray-500">Test results will appear here once available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {lab.reportUrl ? (
              <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-green-50 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-green-700">Lab Report Document</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center">
                      <FaRegFilePdf className="text-red-500 text-2xl mr-4" />
                          <div>
                        <h4 className="text-sm font-medium text-gray-900">Lab Report</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {lab.reportUrl.split('/').pop().replace(/-\d+/, '')} • PDF Document
                        </p>
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(lab.createdAt)}
                            </p>
                          </div>
                        </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleViewDocument}
                        className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                      >
                        <FaExternalLinkAlt className="mr-2" />
                        View
                      </button>
                        <button
                        onClick={handleDownloadDocument}
                        className="inline-flex items-center px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                        >
                        <FaDownload className="mr-2" />
                        Download
                        </button>
                      </div>
                  </div>
                  
                  {/* PDF Preview */}
                  <div className="mt-4 border border-gray-300 rounded-lg overflow-hidden bg-gray-100">
                    <iframe
                      src={getFileUrl(lab.reportUrl)}
                      className="w-full h-96"
                      title="Lab Report Preview"
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
              </div>
            ) : (
              <div className="text-center py-12">
                <FaFileMedical className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No documents available</h3>
                <p className="mt-1 text-sm text-gray-500">Lab report documents will appear here when available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LabDetails; 