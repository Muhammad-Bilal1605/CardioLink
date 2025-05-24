import React, { useState } from 'react';
import { FaArrowLeft, FaPrint, FaDownload, FaFileAlt, FaImage, FaInfoCircle } from 'react-icons/fa';
import ImagingStatusBadge from './ImagingStatusBadge';

function ImagingDetails({ imaging, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    
    console.log('Original imageUrl from database:', imageUrl);
    
    // Extract filename from the imageUrl (remove /uploads/ prefix)
    const filename = imageUrl.replace('/uploads/', '');
    console.log('Extracted filename:', filename);
    
    // Use the dedicated imaging file route with URL encoding
    const encodedFilename = encodeURIComponent(filename);
    console.log('Encoded filename:', encodedFilename);
    
    const fullUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/imaging/file/${encodedFilename}`;
    console.log('Final URL using dedicated route:', fullUrl);
    
    return fullUrl;
  };

  const handleDownload = () => {
    if (imaging.imageUrl) {
      const fullUrl = getImageUrl(imaging.imageUrl);
      console.log('Download URL:', fullUrl);
      
      // Extract original filename for download
      const pathParts = imaging.imageUrl.split('/');
      const filename = pathParts.pop();
      
      const link = document.createElement('a');
      link.href = fullUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleViewImage = () => {
    if (imaging.imageUrl) {
      const fullUrl = getImageUrl(imaging.imageUrl);
      console.log('View Image URL:', fullUrl);
      window.open(fullUrl, '_blank');
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
              onClick={handleDownload}
              disabled={!imaging.imageUrl}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            onClick={() => setActiveTab('overview')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'overview'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaInfoCircle className="inline-block mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'details'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaFileAlt className="inline-block mr-2" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('imaging')}
            className={`py-4 px-6 text-sm font-medium border-b-2 ${
              activeTab === 'imaging'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaImage className="inline-block mr-2" />
            Imaging
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
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
                    <dt className="text-sm font-medium text-gray-500">Doctor</dt>
                    <dd className="mt-1 text-sm text-gray-900">{imaging.doctor}</dd>
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
                </dl>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {imaging.description || 'No description available.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'details' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Clinical Findings</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">
                    {imaging.findings || 'No findings recorded.'}
                  </p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Information</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(imaging.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {formatDate(imaging.updatedAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Imaging ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{imaging.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Patient ID</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-mono">{imaging.patientId}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'imaging' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Imaging Study</h3>
              {imaging.imageUrl && (
                <button
                  onClick={handleViewImage}
                  className="text-green-600 hover:text-green-800 text-sm font-medium"
                >
                  View Full Size
                </button>
              )}
            </div>
            
            {imaging.imageUrl ? (
              <div className="relative">
                <div className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                  <img
                    src={getImageUrl(imaging.imageUrl)}
                    alt={`${imaging.type} imaging study`}
                    className="w-full h-auto max-h-96 object-contain mx-auto"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDNIMTlWMUg1VjNIM1Y1SDFWMTlIMTdWMTFIMTlWMTlIMjFWM1oiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTkgN0g3VjlIOVY3WiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNMTUgMTFIMTNWMTNIMTVWMTFaIiBmaWxsPSIjOUNBM0FGIi8+CjxwYXRoIGQ9Ik0xMSAxM0g5VjE1SDExVjEzWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                      e.target.alt = 'Image not available';
                      e.target.className = 'w-full h-48 object-contain mx-auto opacity-50';
                    }}
                  />
                </div>
                
                <div className="mt-4 flex justify-center space-x-4">
                  <button
                    onClick={handleViewImage}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaImage className="mr-2" />
                    View Full Size
                  </button>
                  <button
                    onClick={handleDownload}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FaDownload className="mr-2" />
                    Download
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <FaImage className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No imaging available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This imaging study does not have any associated images.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ImagingDetails; 