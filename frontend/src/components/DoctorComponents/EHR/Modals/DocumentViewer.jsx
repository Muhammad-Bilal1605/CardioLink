import React, { useState, useEffect } from 'react';

const DocumentViewer = ({ document, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [documentSource, setDocumentSource] = useState(null);
  const [documentType, setDocumentType] = useState('');

  useEffect(() => {
    if (document) {
      // Determine the document source
      let source = null;
      if (document.url) {
        source = document.url;
      } else if (document.path) {
        source = `http://localhost:5000/${document.path.replace(/\\/g, '/')}`;
      } else if (document.imageUrl) {
        source = document.imageUrl;
      }
      
      setDocumentSource(source);
      
      // Determine document type
      let type = '';
      if (document.type === 'image' || document.url?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i) || document.path?.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
        type = 'image';
      } else if (document.type === 'report' || document.type === 'additional' || document.url?.match(/\.(pdf|doc|docx)$/i) || document.path?.match(/\.(pdf|doc|docx)$/i)) {
        type = 'document';
      }
      
      setDocumentType(type);
    }
  }, [document]);

  if (!document) return null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Helper function to get the document URL or name
  const getDocumentSource = () => {
    if (documentSource) return documentSource;
    if (typeof document === 'string') return document;
    return document.name || document.originalname || 'Document file';
  };

  // Handle different document types
  const renderDocumentContent = () => {
    // Handle image viewing
    if (documentType === 'image' && documentSource) {
      return (
        <div className="flex justify-center items-center h-full">
          <img 
            src={documentSource} 
            alt="Medical image" 
            className="max-h-full max-w-full object-contain" 
          />
        </div>
      );
    } else if (documentType === 'document' || document.type === 'report' || document.type === 'additional') {
      // This would handle PDF or other document types
      // In a real app, you'd use a PDF viewer library like react-pdf
      return (
        <div className="flex flex-col items-center justify-center h-full">
          <div className="bg-gray-100 rounded-lg p-8 max-w-md text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Document Viewer</h3>
            <p className="text-gray-500 mb-4">
              {getDocumentSource()}
            </p>
            <p className="text-sm text-gray-500">
              In a production environment, a proper document viewer would be implemented here.
            </p>
            <div className="mt-6">
              <button 
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                onClick={(e) => {
                  e.preventDefault();
                  if (documentSource) {
                    window.open(documentSource, '_blank');
                  } else {
                    alert('Document URL not available');
                  }
                }}
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Open Document
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex justify-center items-center h-full">
        <p className="text-gray-500">Document preview not available</p>
      </div>
    );
  };

  return (
    <div 
      className={`bg-gray-900 text-white ${
        isFullscreen ? 'fixed inset-0 z-50' : 'fixed inset-0 z-50'
      }`}
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="font-medium text-lg">
            {documentType === 'image' ? 'Image Viewer' : 'Document Viewer'}
          </h3>
          <div className="flex items-center space-x-2">
            {documentSource && (
              <a 
                href={documentSource}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white flex items-center"
                title="Open in New Tab"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                  <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                </svg>
              </a>
            )}
            <button 
              className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white flex items-center"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              onClick={(e) => {
                e.preventDefault();
                toggleFullscreen();
              }}
            >
              {isFullscreen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 10a1 1 0 011-1h3a1 1 0 010 2H7.414l2.293 2.293a1 1 0 01-1.414 1.414L6 12.414V14a1 1 0 01-2 0v-4zm14 0a1 1 0 01-1 1h-3a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L18 7.586V6a1 1 0 012 0v4z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            <button 
              className="p-2 rounded-full hover:bg-gray-700 text-gray-300 hover:text-white flex items-center"
              title="Close"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto bg-gray-800 p-4">
          {renderDocumentContent()}
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer; 