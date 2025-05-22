import React from 'react';
import { FaDownload, FaPrint, FaTimes } from 'react-icons/fa';

function ReportViewer({ report, onClose }) {
  if (!report) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Lab Report</h2>
            <div className="flex space-x-3">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              >
                <FaPrint className="mr-2" /> Print
              </button>
              <button
                onClick={() => window.open(report.url, '_blank')}
                className="inline-flex items-center px-4 py-2 bg-sky-600 rounded-lg text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              >
                <FaDownload className="mr-2" /> Download
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              >
                <FaTimes className="mr-2" /> Close
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {/* Report Header */}
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.testName}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(report.date)} • {report.facility}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Report ID</p>
                  <p className="text-sm font-medium text-gray-900">{report.id}</p>
                </div>
              </div>
            </div>

            {/* Report Content */}
            <div className="space-y-6">
              {/* Test Information */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Test Information</h4>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">Test Type</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.type}</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">Provider</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.provider}</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">Date & Time</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(report.date)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Results */}
              {report.results && report.results.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Test Results</h4>
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Parameter
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Value
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Reference Range
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {report.results.map((result, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {result.parameter}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {result.value} {result.unit}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {result.referenceRange}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs font-medium rounded-full ${
                                result.status === 'Normal' ? 'bg-green-100 text-green-800' :
                                result.status === 'High' ? 'bg-red-100 text-red-800' :
                                result.status === 'Low' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-orange-100 text-orange-800'
                              }`}>
                                {result.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Notes */}
              {report.notes && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Notes</h4>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{report.notes}</p>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="border-t border-gray-200 pt-6">
                <p className="text-xs text-gray-500">
                  This report was generated on {formatDate(new Date())}. Please contact your healthcare provider if you have any questions about these results.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportViewer; 