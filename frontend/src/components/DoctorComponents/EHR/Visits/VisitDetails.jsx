import React, { useState, useEffect } from 'react';
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
  FaXRay,
  FaCapsules,
  FaFileAlt
} from 'react-icons/fa';
import axios from 'axios';

function getFileUrl(path) {
  if (!path) return '';
  // Remove any leading slashes and ensure proper path construction
  const cleanPath = path.replace(/^\/+/, '');
  return `http://localhost:5000/Backend/${cleanPath}`;
}

function VisitDetails({ visit, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  const [selectedImage, setSelectedImage] = useState(null);
  const [labResults, setLabResults] = useState([]);
  const [imagingResults, setImagingResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Debug logging for visit data
  useEffect(() => {
    if (visit) {
      console.log('=== VisitDetails Debug ===');
      console.log('Full visit object:', visit);
      console.log('Visit prescribed medicines:', visit.prescribedMedicines);
      console.log('Visit prescribed medicines type:', typeof visit.prescribedMedicines);
      console.log('Visit prescribed medicines length:', visit.prescribedMedicines?.length);
      console.log('========================');
    }
  }, [visit]);

  useEffect(() => {
    const fetchAssociatedData = async () => {
      if (!visit) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('Visit data:', visit);
        console.log('Associated lab results:', visit.associatedLabResults);
        console.log('Associated imaging:', visit.associatedImaging);
        console.log('Prescribed medicines:', visit.prescribedMedicines);

        // Fetch lab results
        if (visit.associatedLabResults && visit.associatedLabResults.length > 0) {
          const labPromises = visit.associatedLabResults.map(item => {
            // Handle both string IDs and object IDs
            const id = typeof item === 'string' ? item : (item._id || item.id);
            console.log('Lab result ID:', id);
            return axios.get(`http://localhost:5000/api/lab-results/${id}`);
          });
          const labResponses = await Promise.all(labPromises);
          setLabResults(labResponses.map(res => res.data.data));
        }

        // Fetch imaging results
        if (visit.associatedImaging && visit.associatedImaging.length > 0) {
          const imagingPromises = visit.associatedImaging.map(item => {
            // Handle both string IDs and object IDs
            const id = typeof item === 'string' ? item : (item._id || item.id);
            console.log('Imaging ID:', id);
            return axios.get(`http://localhost:5000/api/imaging/${id}`);
          });
          const imagingResponses = await Promise.all(imagingPromises);
          setImagingResults(imagingResponses.map(res => res.data.data));
        }
      } catch (err) {
        console.error('Error fetching associated data:', err);
        setError('Failed to load some associated data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssociatedData();
  }, [visit]);

  if (!visit) return null;

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
      case 'no-show':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const getMedicationStatusClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completed':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'Discontinued':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
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
              aria-label="Print visit details"
            >
              <FaPrint className="mr-2" /> Print
            </button>
            <button 
              className="inline-flex items-center px-4 py-2 bg-sky-600 rounded-lg text-sm font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors shadow-sm"
              aria-label="Download visit details"
            >
              <FaDownload className="mr-2" /> Download
            </button>
          </div>
        </div>
        
        {/* Visit Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-50 to-cyan-50 border-t border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">{visit.type.charAt(0).toUpperCase() + visit.type.slice(1)} Visit</h2>
              <div className="mt-1 flex items-center text-sm text-slate-600">
                <span className="font-medium">{formatDate(visit.date)}</span>
                <span className="mx-2">•</span>
                <span>{formatTime(visit.date)}</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <span className={`px-3 py-1 inline-flex text-sm font-medium rounded-full border ${getStatusBadgeClass(visit.status)}`}>
                {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Provider:</span>
              <div className="font-semibold text-slate-900 mt-1">{visit.provider}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Visit Type:</span>
              <div className="font-semibold text-slate-900 mt-1">{visit.type.charAt(0).toUpperCase() + visit.type.slice(1)}</div>
            </div>
            {visit.followUpDate && (
              <div>
                <span className="text-slate-500 font-medium">Follow-up Date:</span>
                <div className="font-semibold text-slate-900 mt-1">{formatDate(visit.followUpDate)}</div>
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
              aria-label="View visit summary"
            >
              <div className="flex items-center">
                <FaNotesMedical className="mr-2" />
                Summary
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'medications'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('medications')}
              aria-current={activeTab === 'medications' ? 'page' : undefined}
              aria-label="View prescribed medications"
            >
              <div className="flex items-center">
                <FaCapsules className="mr-2" />
                Medications
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'lab'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('lab')}
              aria-current={activeTab === 'lab' ? 'page' : undefined}
              aria-label="View lab results"
            >
              <div className="flex items-center">
                <FaFlask className="mr-2" />
                Lab Results
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
              aria-label="View imaging results"
            >
              <div className="flex items-center">
                <FaXRay className="mr-2" />
                Imaging
              </div>
            </button>
            <button
              className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${
                activeTab === 'files'
                  ? 'border-sky-500 text-sky-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}
              onClick={() => setActiveTab('files')}
              aria-current={activeTab === 'files' ? 'page' : undefined}
              aria-label="View all files"
            >
              <div className="flex items-center">
                <FaFileAlt className="mr-2" />
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
                  <h3 className="text-sm font-semibold text-sky-700">Reason for Visit</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{visit.reason || 'No reason recorded.'}</p>
                </div>
              </div>
              
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Diagnosis</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{visit.diagnosis || 'No diagnosis recorded.'}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Treatment</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{visit.treatment || 'No treatment recorded.'}</p>
                </div>
              </div>
              
              {visit.followUpDate && (
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">Follow-up Information</h3>
                  </div>
                  <div className="p-5">
                    <p className="text-slate-700 leading-relaxed">
                      Follow-up scheduled for {formatDate(visit.followUpDate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'medications' && (
          <div className="space-y-6">
            {visit.prescribedMedicines && visit.prescribedMedicines.length > 0 ? (
              visit.prescribedMedicines.map((medication, index) => (
                <div key={index} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-sky-700">{medication.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Prescribed by: {medication.prescribedBy} • {formatDate(medication.startDate)}
                      </p>
                    </div>
                    <span className={`px-3 py-1 inline-flex text-xs font-medium rounded-full border ${getMedicationStatusClass(medication.status)}`}>
                      {medication.status}
                    </span>
                  </div>
                  <div className="p-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Dosage</p>
                        <p className="text-sm text-slate-600">{medication.dosage}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Frequency</p>
                        <p className="text-sm text-slate-600">{medication.frequency}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Start Date</p>
                        <p className="text-sm text-slate-600">{formatDate(medication.startDate)}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">End Date</p>
                        <p className="text-sm text-slate-600">{medication.endDate ? formatDate(medication.endDate) : 'Ongoing'}</p>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">Reason</p>
                      <p className="text-sm text-slate-600">{medication.reason}</p>
                    </div>
                    {medication.sideEffects && medication.sideEffects.length > 0 && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Potential Side Effects</p>
                        <ul className="list-disc pl-5 text-sm text-slate-600">
                          {medication.sideEffects.map((effect, idx) => (
                            <li key={idx}>{effect}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {medication.notes && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                        <p className="text-sm text-slate-600">{medication.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-sky-400">
                  <FaCapsules className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No medications prescribed</h3>
                <p className="mt-1 text-sm text-slate-500">
                  No medications were prescribed during this visit.
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
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Specimen Type</p>
                        <p className="text-sm text-slate-600">{labResult.specimenType || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Collection Date</p>
                        <p className="text-sm text-slate-600">{labResult.collectionDate ? formatDate(labResult.collectionDate) : 'Not specified'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-sm font-semibold text-slate-700">Test Results</h4>
                      {labResult.results.map((result, idx) => (
                        <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-slate-700">{result.parameter}</p>
                            <p className="text-xs text-slate-500">Reference Range: {result.referenceRange}</p>
                            {result.unit && <p className="text-xs text-slate-500">Unit: {result.unit}</p>}
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

                    {labResult.interpretation && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Interpretation</p>
                        <p className="text-sm text-slate-600">{labResult.interpretation}</p>
                      </div>
                    )}

                    {labResult.notes && (
                      <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Notes</p>
                        <p className="text-sm text-slate-600">{labResult.notes}</p>
                      </div>
                    )}

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
                  Lab results from this visit will appear here when they are available.
                </p>
              </div>
            )}
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
                        <p className="text-sm font-medium text-slate-700 mb-1">Modality</p>
                        <p className="text-sm text-slate-600">{imaging.modality || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Radiologist</p>
                        <p className="text-sm text-slate-600">{imaging.radiologist || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Body Part</p>
                        <p className="text-sm text-slate-600">{imaging.bodyPart || 'Not specified'}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-1">Contrast Used</p>
                        <p className="text-sm text-slate-600">{imaging.contrastUsed ? 'Yes' : 'No'}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Clinical Information</p>
                        <p className="text-sm text-slate-600">{imaging.clinicalInformation || 'Not provided'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Technique</p>
                        <p className="text-sm text-slate-600">{imaging.technique || 'Not specified'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Findings</p>
                        <p className="text-sm text-slate-600">{imaging.findings || 'No findings recorded'}</p>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Impression</p>
                        <p className="text-sm text-slate-600">{imaging.impression || 'No impression recorded'}</p>
                      </div>

                      {imaging.recommendations && (
                        <div className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm font-medium text-slate-700 mb-2">Recommendations</p>
                          <p className="text-sm text-slate-600">{imaging.recommendations}</p>
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
                  Imaging results from this visit will appear here when they are available.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && (
          <div className="space-y-6">
            {/* Images Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-sky-700">Images</h3>
              </div>
              <div className="p-5">
                {visit.images && visit.images.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {visit.images.map((image, index) => (
                      <div 
                        key={index} 
                        className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                        onClick={() => setSelectedImage(getFileUrl(image))}
                      >
                        <img 
                          src={getFileUrl(image)}
                          alt={`Visit image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                          <button className="opacity-0 group-hover:opacity-100 text-white bg-sky-600 px-3 py-1 rounded-lg text-sm hover:bg-sky-700 transition-colors">
                            View
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <div className="mx-auto h-10 w-10 text-sky-400">
                      <FaRegImage className="h-10 w-10" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No images available</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Images from this visit will appear here when they are available.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documents Section */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-sky-700">Documents</h3>
              </div>
              <div className="p-5">
                {visit.documents && visit.documents.length > 0 ? (
                  <div className="space-y-4">
                    {visit.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <FaRegFilePdf className="h-5 w-5 text-red-500 mr-3" />
                          <span className="text-sm text-slate-700">{doc.split('/').pop() || `Document ${index + 1}`}</span>
                        </div>
                        <div className="flex space-x-2">
                          <a 
                            href={getFileUrl(doc)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sky-600 hover:text-sky-800 px-2 py-1 rounded hover:bg-sky-50"
                            aria-label="View document"
                          >
                            <FaRegFilePdf />
                          </a>
                          <a 
                            href={getFileUrl(doc)}
                            download
                            className="text-sky-600 hover:text-sky-800 px-2 py-1 rounded hover:bg-sky-50"
                            aria-label="Download document"
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
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No documents available</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Documents from this visit will appear here when they are available.
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

export default VisitDetails;