import React, { useState, useEffect } from 'react';
import { 
  FaArrowLeft, 
  FaNotesMedical, 
  FaFlask, 
  FaXRay, 
  FaFileMedical, 
  FaDownload, 
  FaRegFilePdf,
  FaRegImage,
  FaPrint,
  FaUserMd,
  FaHospital
} from 'react-icons/fa';
import axios from 'axios';

function getFileUrl(path) {
  if (!path) return '';
  // Remove any leading slashes and ensure proper path construction
  const cleanPath = path.replace(/^\/+/, '');
  return `http://localhost:5000/Backend/${cleanPath}`;
}

function HospitalizationDetails({ hospitalization, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedImage, setSelectedImage] = useState(null);
  const [labResults, setLabResults] = useState([]);
  const [imagingResults, setImagingResults] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAssociatedData = async () => {
      if (!hospitalization) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Hospitalization data:', hospitalization);
        console.log('Associated lab:', hospitalization.labResults);
        console.log('Associated imaging:', hospitalization.imagingStudies);
        console.log('Associated procedures:', hospitalization.procedures);
        // Fetch lab results
        if (hospitalization.labResults && hospitalization.labResults.length > 0) {
          console.log('entering:', hospitalization.labResults);
          const labPromises = hospitalization.labResults.map(id => 
            axios.get(`http://localhost:5000/api/lab-results/${id}`)
          );
          const labResponses = await Promise.all(labPromises);
          setLabResults(labResponses.map(res => res.data.data));
        }

        // Fetch imaging results
        if (hospitalization.imagingStudies && hospitalization.imagingStudies.length > 0) {
          const imagingPromises = hospitalization.imagingStudies.map(id => 
            axios.get(`http://localhost:5000/api/imaging/${id}`)
          );
          const imagingResponses = await Promise.all(imagingPromises);
          setImagingResults(imagingResponses.map(res => res.data.data));
        }

        if (hospitalization.procedures && hospitalization.procedures.length > 0) {
          const procedurePromises = hospitalization.procedures.map(id => 
            axios.get(`http://localhost:5000/api/procedures/${id}`)
          );
          const procedureResponses = await Promise.all(procedurePromises);
          setProcedures(procedureResponses.map(res => res.data.data));
        }

        // Fetch procedures
        
      } catch (err) {
        console.error('Error fetching associated data:', err);
        setError('Failed to load some associated data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssociatedData();
  }, [hospitalization]);

  if (!hospitalization) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const closeImageViewer = () => {
    setSelectedImage(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg">
      {/* Image Viewer Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button 
              onClick={closeImageViewer}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
              aria-label="Close image viewer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <img 
              src={selectedImage} 
              alt="Enlarged view" 
              className="max-h-[80vh] max-w-full object-contain" 
            />
          </div>
        </div>
      )}

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
              aria-label="Print hospitalization details"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 bg-sky-600 rounded-lg text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              aria-label="Download hospitalization details"
            >
              <FaDownload className="mr-2" /> Download
            </button>
          </div>
        </div>
        
        {/* Hospitalization Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-50 to-cyan-50 border-t border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Hospitalization</h2>
              <div className="mt-1 flex items-center text-sm text-slate-600">
                <span className="font-medium">{formatDate(hospitalization.date)}</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                {hospitalization.status}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Hospital:</span>
              <div className="font-semibold text-slate-900 mt-1">{hospitalization.hospital}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Admission Type:</span>
              <div className="font-semibold text-slate-900 mt-1">{hospitalization.admissionType}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Attending Physician:</span>
              <div className="font-semibold text-slate-900 mt-1">{hospitalization.attendingPhysician}</div>
            </div>
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
            >
              <div className="flex items-center">
                <FaNotesMedical className="mr-2" />
                Summary
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'imaging'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('imaging')}
            >
              <div className="flex items-center">
                <FaXRay className="mr-2" />
                Imaging
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'lab'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('lab')}
            >
              <div className="flex items-center">
                <FaFlask className="mr-2" />
                Lab Results
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'procedures'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('procedures')}
            >
              <div className="flex items-center">
                <FaUserMd className="mr-2" />
                Procedures
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'files'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('files')}
            >
              <div className="flex items-center">
                <FaFileMedical className="mr-2" />
                Files
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
                  <h3 className="text-sm font-semibold text-sky-700">Reason for Admission</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{hospitalization.reason || 'No reason recorded.'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Procedures Done</h3>
                </div>
                <div className="p-5">
                  {hospitalization.proceduresDone && hospitalization.proceduresDone.length > 0 ? (
                    <ul className="list-disc list-inside space-y-2">
                      {hospitalization.proceduresDone.map((proc, idx) => (
                        <li key={idx} className="text-slate-700">{proc}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-700">No procedures recorded.</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Duration of Stay</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{hospitalization.durationOfStay || 'Not specified'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Outcome</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{hospitalization.outcome || 'No outcome recorded.'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Discharge Summary</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{hospitalization.dischargeSummary || 'No discharge summary.'}</p>
                </div>
              </div>

              {hospitalization.notes && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">Notes</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-slate-700 leading-relaxed">{hospitalization.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'imaging' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading imaging results...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-red-200">
                <div className="mx-auto h-12 w-12 text-red-400">
                  <FaXRay className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-red-900">Error loading imaging results</h3>
                <p className="mt-1 text-sm text-red-500">{error}</p>
              </div>
            ) : imagingResults.length > 0 ? (
              imagingResults.map((imaging, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">{imaging.type}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(imaging.date)} • {imaging.facility}
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Doctor</p>
                        <p className="text-sm text-slate-600">{imaging.doctor || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Status</p>
                        <p className="text-sm text-slate-600">{imaging.status || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
                        <p className="text-sm text-slate-600">{imaging.description || 'Not provided'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Findings</p>
                        <p className="text-sm text-slate-600">{imaging.findings || 'No findings recorded'}</p>
                      </div>

                      {imaging.notes && (
                      <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                          <p className="text-sm text-slate-600">{imaging.notes}</p>
                      </div>
                      )}
                    </div>

                    {imaging.imageUrl && (
                      <div className="mt-4 space-y-4">
                        <div className="relative group cursor-pointer" onClick={() => setSelectedImage(getFileUrl(imaging.imageUrl))}>
                          <img 
                            src={getFileUrl(imaging.imageUrl)}
                            alt={`${imaging.type} image`}
                            className="w-full h-64 object-contain rounded-lg bg-slate-100"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                            <button 
                              className="opacity-0 group-hover:opacity-100 text-white bg-sky-600 px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"
                            >
                              View Full Image
                            </button>
                          </div>
                        </div>
                        <div className="flex justify-end space-x-3">
                          <a 
                            href={getFileUrl(imaging.imageUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-sky-50 border border-sky-200 rounded-lg text-sm font-medium text-sky-700 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
                          >
                            <FaRegImage className="mr-2" /> View Image
                          </a>
                          <a 
                            href={getFileUrl(imaging.imageUrl)}
                            download
                            className="inline-flex items-center px-4 py-2 bg-sky-50 border border-sky-200 rounded-lg text-sm font-medium text-sky-700 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
                          >
                            <FaDownload className="mr-2" /> Download Image
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-sky-400">
                  <FaXRay className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No imaging results available</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Imaging results from this hospitalization will appear here when they are available.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'lab' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading lab results...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-red-200">
                <div className="mx-auto h-12 w-12 text-red-400">
                  <FaFlask className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-red-900">Error loading lab results</h3>
                <p className="mt-1 text-sm text-red-500">{error}</p>
              </div>
            ) : labResults.length > 0 ? (
              labResults.map((labResult, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">{labResult.testName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(labResult.date)} • {labResult.facility}
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Test Type</p>
                        <p className="text-sm text-slate-600">{labResult.testType || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Ordering Physician</p>
                        <p className="text-sm text-slate-600">{labResult.orderingPhysician || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-700">Test Results</h4>
                      {labResult.results && labResult.results.map((result, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
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

                    {labResult.reportUrl && (
                      <div className="mt-4 flex justify-end space-x-3">
                        <a 
                          href={getFileUrl(labResult.reportUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-sky-50 border border-sky-200 rounded-lg text-sm font-medium text-sky-700 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
                        >
                          <FaRegFilePdf className="mr-2" /> View Report
                        </a>
                        <a 
                          href={getFileUrl(labResult.reportUrl)}
                          download
                          className="inline-flex items-center px-4 py-2 bg-sky-50 border border-sky-200 rounded-lg text-sm font-medium text-sky-700 hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
                        >
                          <FaDownload className="mr-2" /> Download Report
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-sky-400">
                  <FaFlask className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No lab results available</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Lab results from this hospitalization will appear here when they are available.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'procedures' && (
          <div className="space-y-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
                <p className="mt-4 text-slate-600">Loading procedures...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-red-200">
                <div className="mx-auto h-12 w-12 text-red-400">
                  <FaUserMd className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-red-900">Error loading procedures</h3>
                <p className="mt-1 text-sm text-red-500">{error}</p>
              </div>
            ) : procedures.length > 0 ? (
              procedures.map((procedure, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">{procedure.procedureName}</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {formatDate(procedure.date)} • {procedure.hospital}
                    </p>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Physician</p>
                        <p className="text-sm text-slate-600">{procedure.physician || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Status</p>
                        <p className="text-sm text-slate-600">{procedure.status || 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Indication</p>
                        <p className="text-sm text-slate-600">{procedure.indication || 'Not specified'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Findings</p>
                        <p className="text-sm text-slate-600">{procedure.findings || 'Not specified'}</p>
                      </div>

                      {procedure.complications && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">Complications</p>
                          <p className="text-sm text-slate-600">{procedure.complications}</p>
                        </div>
                      )}

                      {procedure.followUpPlan && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">Follow-up Plan</p>
                          <p className="text-sm text-slate-600">{procedure.followUpPlan}</p>
                        </div>
                      )}

                      {procedure.notes && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                          <p className="text-sm text-slate-600">{procedure.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-sky-400">
                  <FaUserMd className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No procedures available</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Procedures from this hospitalization will appear here when they are available.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Discharge Report */}
            {hospitalization.dischargeReportUrl && (
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Discharge Report</h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center">
                      <FaRegFilePdf className="h-5 w-5 text-red-500 mr-3" />
                      <span className="text-sm text-slate-700">Discharge Report</span>
                    </div>
                    <div className="flex space-x-2">
                      <a 
                        href={getFileUrl(hospitalization.dischargeReportUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-600 hover:text-sky-800 px-2 py-1 rounded hover:bg-sky-50"
                      >
                        <FaRegFilePdf />
                      </a>
                      <a 
                        href={getFileUrl(hospitalization.dischargeReportUrl)}
                        download
                        className="text-sky-600 hover:text-sky-800 px-2 py-1 rounded hover:bg-sky-50"
                      >
                        <FaDownload />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Documents */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-sky-700">Additional Documents</h3>
              </div>
              <div className="p-5">
                {hospitalization.additionalDocuments && hospitalization.additionalDocuments.length > 0 ? (
                  <div className="space-y-4">
                    {hospitalization.additionalDocuments.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <FaRegFilePdf className="h-5 w-5 text-red-500 mr-3" />
                          <span className="text-sm text-slate-700">{doc.name || `Document ${index + 1}`}</span>
                        </div>
                        <div className="flex space-x-2">
                          <a 
                            href={getFileUrl(doc.url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:text-sky-800 px-2 py-1 rounded hover:bg-sky-50"
                          >
                            <FaRegFilePdf />
                          </a>
                          <a 
                            href={getFileUrl(doc.url)}
                            download
                            className="text-sky-600 hover:text-sky-800 px-2 py-1 rounded hover:bg-sky-50"
                          >
                            <FaDownload />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <div className="mx-auto h-10 w-10 text-sky-400">
                      <FaRegFilePdf className="h-10 w-10" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No additional documents available</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Additional documents from this hospitalization will appear here when they are available.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HospitalizationDetails; 