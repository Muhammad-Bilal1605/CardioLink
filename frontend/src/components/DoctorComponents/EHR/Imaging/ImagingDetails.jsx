import React, { useState } from 'react';
import { FaArrowLeft, FaPrint, FaDownload, FaFileAlt, FaImage, FaFileMedical, FaNotesMedical } from 'react-icons/fa';
import ImagingStatusBadge from './ImagingStatusBadge';
import ReportViewer from './ReportViewer';

function ImagingDetails({ imaging, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedReport, setSelectedReport] = useState(null);

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getStatusBadgeClass = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{imaging.type}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {formatDate(imaging.date)} at {formatTime(imaging.date)}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaArrowLeft className="mr-2" />
              Back to list
            </button>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaPrint className="mr-2" />
              Print
            </button>
            <button
              onClick={() => {/* Handle download */}}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaDownload className="mr-2" />
              Download
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'summary'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaFileAlt className="inline-block mr-2" />
            Summary
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'images'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaImage className="inline-block mr-2" />
            Images
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'reports'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaFileMedical className="inline-block mr-2" />
            Reports
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'notes'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaNotesMedical className="inline-block mr-2" />
            Notes
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Imaging Information</h3>
                <dl className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Type</dt>
                    <dd className="mt-1 text-sm text-gray-900">{imaging.type}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Date & Time</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(imaging.date)} at {formatTime(imaging.date)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Provider</dt>
                    <dd className="mt-1 text-sm text-gray-900">{imaging.provider}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Facility</dt>
                    <dd className="mt-1 text-sm text-gray-900">{imaging.facility}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="mt-1">
                      <ImagingStatusBadge status={imaging.status} />
                    </dd>
                  </div>
                  {imaging.followUpDate && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Follow-up Date</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(imaging.followUpDate)}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Findings & Impression</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Findings</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{imaging.findings}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Impression</h4>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{imaging.impression}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'images' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Imaging Studies</h3>
            {imaging.images && imaging.images.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imaging.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image.url}
                      alt={`Imaging study ${index + 1}`}
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => window.open(image.url, '_blank')}
                        className="opacity-0 group-hover:opacity-100 text-white bg-green-600 px-4 py-2 rounded-lg text-sm font-medium transition-opacity"
                      >
                        View Full Size
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No images available for this study.</p>
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Imaging Reports</h3>
            {imaging.documents && imaging.documents.length > 0 ? (
              <div className="space-y-4">
                {imaging.documents.map((doc, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center">
                      <FaFileMedical className="text-green-600 text-xl mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                        <p className="text-sm text-gray-500">{formatDate(doc.date)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedReport(doc)}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      View Report
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No reports available for this study.</p>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Clinical Notes</h3>
            {imaging.notes ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{imaging.notes}</p>
              </div>
            ) : (
              <p className="text-gray-500">No clinical notes available for this study.</p>
            )}
          </div>
        )}
      </div>

      {/* Report Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <ReportViewer report={selectedReport} onClose={() => setSelectedReport(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default ImagingDetails; 