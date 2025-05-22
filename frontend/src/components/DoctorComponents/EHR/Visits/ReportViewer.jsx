import React from 'react';
import { FaDownload, FaPrint, FaExpand, FaCompress } from 'react-icons/fa';

function ReportViewer({ report, onClose }) {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (!report) return null;

  return (
    <div 
      className={`bg-gray-800 text-white ${
        isFullscreen ? 'fixed inset-0 z-50' : 'relative rounded-lg overflow-hidden'
      }`}
    >
      <div className="flex justify-between items-center p-4 bg-gray-900">
        <h3 className="font-medium">{report.title || 'Medical Report'}</h3>
        <div className="flex items-center space-x-2">
          <button 
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white"
            title="Print Report"
          >
            <FaPrint />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white"
            title="Download Report"
          >
            <FaDownload />
          </button>
          <button 
            className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
          </button>
          {isFullscreen && (
            <button 
              className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white"
              title="Close"
              onClick={onClose}
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-white p-4" style={{ height: isFullscreen ? 'calc(100vh - 72px)' : '500px' }}>
        <div className="w-full h-full flex justify-center items-center bg-gray-100 rounded border border-gray-200">
          <div className="text-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Document Preview Area</p>
            <p className="mt-1">Report documents would be displayed here when available</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportViewer;