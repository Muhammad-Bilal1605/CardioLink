import React, { useState } from 'react';
import { 
  FaFileMedical, 
  FaFilePrescription, 
  FaNotesMedical, 
  FaUserMd, 
  FaFlask, 
  FaArrowLeft,
  FaDownload,
  FaRegFilePdf,
  FaRegImage,
  FaPrint,
  FaXRay
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
    switch (status) {
      case 'scheduled':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'completed':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      <div className="border-b border-slate-200">
        <div className="px-6 py-4 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="inline-flex items-center text-sky-600 hover:text-sky-800 focus:outline-none focus:ring-2 focus:ring-sky-500 rounded-md transition-colors"
            aria-label="Back to list"
          >
            <FaArrowLeft className="mr-2" /> Back to list
          </button>
          <div className="flex space-x-3">
            <button 
              className="inline-flex items-center px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              aria-label="Print lab results"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 bg-sky-600 rounded-lg text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              aria-label="Download lab results"
            >
              <FaDownload className="mr-2" /> Download
            </button>
          </div>
        </div>
        
        {/* Lab Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-50 to-cyan-50 border-t border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{lab.testName}</h2>
              <div className="mt-1 flex items-center text-sm text-slate-600">
                <span className="font-medium">{formatDate(lab.date)}</span>
                <span className="mx-2">•</span>
                <span>{formatTime(lab.date)}</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full border ${getStatusBadgeClass(lab.status)}`}>
                {lab.status.charAt(0).toUpperCase() + lab.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Provider:</span>
              <div className="font-semibold text-slate-900 mt-1">{lab.provider}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Test Type:</span>
              <div className="font-semibold text-slate-900 mt-1">{lab.type}</div>
            </div>
            {lab.followUpDate && (
              <div>
                <span className="text-slate-500 font-medium">Follow-up Date:</span>
                <div className="font-semibold text-slate-900 mt-1">{formatDate(lab.followUpDate)}</div>
              </div>
            )}
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="border-b border-slate-200 bg-white">
          <nav className="flex -mb-px px-6 overflow-x-auto">
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'summary'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('summary')}
              aria-current={activeTab === 'summary' ? 'page' : undefined}
              aria-label="View lab summary"
            >
              <div className="flex items-center">
                <FaNotesMedical className="mr-2" />
                Summary
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'results'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('results')}
              aria-current={activeTab === 'results' ? 'page' : undefined}
              aria-label="View lab results"
            >
              <div className="flex items-center">
                <FaFlask className="mr-2" />
                Results
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'imaging'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('imaging')}
              aria-current={activeTab === 'imaging' ? 'page' : undefined}
              aria-label="View associated imaging"
            >
              <div className="flex items-center">
                <FaXRay className="mr-2" />
                Imaging
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'documents'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('documents')}
              aria-current={activeTab === 'documents' ? 'page' : undefined}
              aria-label="View documents"
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
      <div className="p-6 bg-slate-50">
        {activeTab === 'summary' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Test Information</h3>
                </div>
                <div className="p-5">
                  <dl className="grid grid-cols-1 gap-4">
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Test Name</dt>
                      <dd className="mt-1 text-sm text-slate-900">{lab.testName}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Test Type</dt>
                      <dd className="mt-1 text-sm text-slate-900">{lab.type}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Provider</dt>
                      <dd className="mt-1 text-sm text-slate-900">{lab.provider}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-slate-500">Date & Time</dt>
                      <dd className="mt-1 text-sm text-slate-900">
                        {formatDate(lab.date)} at {formatTime(lab.date)}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Notes</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{lab.notes || 'No notes recorded.'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Test Results Overview</h3>
                </div>
                <div className="p-5">
                  {lab.results && lab.results.length > 0 ? (
                    <div className="space-y-4">
                      {lab.results.map((result, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{result.parameter}</p>
                            <p className="text-xs text-slate-500">Reference Range: {result.referenceRange}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-slate-900">{result.value} {result.unit}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                              result.status === 'High' ? 'bg-red-100 text-red-800' :
                              result.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {result.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-700">No results available.</p>
                  )}
                </div>
              </div>
              
              {lab.followUpDate && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">Follow-up Information</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-slate-700 leading-relaxed">
                      Follow-up scheduled for {formatDate(lab.followUpDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="space-y-6">
            {lab.results && lab.results.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Detailed Results</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {lab.results.map((result, index) => (
                      <div key={index} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{result.parameter}</p>
                          <p className="text-xs text-slate-500">Reference Range: {result.referenceRange}</p>
                          {result.notes && (
                            <p className="text-xs text-slate-600 mt-1">{result.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-slate-900">{result.value} {result.unit}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                            result.status === 'High' ? 'bg-red-100 text-red-800' :
                            result.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {result.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No results available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'imaging' && (
          <div className="space-y-6">
            {lab.associatedImaging && lab.associatedImaging.length > 0 ? (
              lab.associatedImaging.map((imaging, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">{imaging.type}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(imaging.date)} • {imaging.facility}
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-slate-700">Findings</p>
                        <p className="text-sm text-slate-600 mt-1">{imaging.findings}</p>
                      </div>
                      {imaging.impression && (
                        <div>
                          <p className="text-sm font-medium text-slate-700">Impression</p>
                          <p className="text-sm text-slate-600 mt-1">{imaging.impression}</p>
                        </div>
                      )}
                      {imaging.images && imaging.images.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-slate-700 mb-2">Images</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {imaging.images.map((image, idx) => (
                              <div key={idx} className="relative aspect-square">
                                <img
                                  src={image.url}
                                  alt={`${imaging.type} image ${idx + 1}`}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No associated imaging available.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {lab.documents && lab.documents.length > 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Documents</h3>
                </div>
                <div className="p-5">
                  <div className="space-y-4">
                    {lab.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <FaRegFilePdf className="text-red-500 text-xl mr-3" />
                          <div>
                            <p className="text-sm font-medium text-slate-700">{doc.name}</p>
                            <p className="text-xs text-slate-500">
                              {formatDate(doc.date)} • {doc.size}
                            </p>
                          </div>
                        </div>
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors text-sm font-medium"
                          onClick={() => window.open(doc.url, '_blank')}
                        >
                          <FaDownload className="mr-1.5" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No documents available.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LabDetails; 