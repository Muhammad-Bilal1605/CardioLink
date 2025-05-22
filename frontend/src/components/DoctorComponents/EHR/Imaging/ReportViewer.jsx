import React from 'react';
import { FaTimes, FaPrint, FaDownload } from 'react-icons/fa';

function ReportViewer({ report, onClose }) {
  if (!report) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{report.title}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Generated on {formatDate(report.date)}
            </p>
          </div>
          <div className="flex space-x-3">
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
            <button
              onClick={onClose}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <FaTimes className="mr-2" />
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Report Content */}
      <div className="p-6">
        <div className="space-y-6">
          {/* Report Details */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Report Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Report ID</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.id}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Date</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(report.date)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Radiologist</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.radiologist}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Facility</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.facility}</dd>
                </div>
              </dl>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Study Information</h3>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Study Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.studyType}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Body Part</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.bodyPart}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Technique</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.technique}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Clinical History</dt>
                  <dd className="mt-1 text-sm text-gray-900">{report.clinicalHistory}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Findings */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Findings</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.findings}</p>
            </div>
          </div>

          {/* Impression */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Impression</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.impression}</p>
            </div>
          </div>

          {/* Recommendations */}
          {report.recommendations && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Recommendations</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{report.recommendations}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              This report was generated on {formatDate(report.date)} at {new Date(report.date).toLocaleTimeString()}.
              Please contact the facility for any questions or concerns.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportViewer; 