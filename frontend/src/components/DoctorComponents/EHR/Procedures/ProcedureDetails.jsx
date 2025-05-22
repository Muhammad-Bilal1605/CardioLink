import React, { useState } from 'react';
import { FaArrowLeft, FaNotesMedical, FaFlask, FaXRay, FaFileMedical, FaDownload, FaRegFilePdf } from 'react-icons/fa';

function ProcedureDetails({ procedure, onClose }) {
  const [activeTab, setActiveTab] = useState('summary');
  if (!procedure) return null;
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString();
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
        </div>
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-sky-50 to-cyan-50 border-t border-b border-slate-200">
          <div className="flex flex-col md:flex-row justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Procedure</h2>
              <div className="mt-1 flex items-center text-sm text-slate-600">
                <span className="font-medium">{formatDate(procedure.date)}</span>
              </div>
            </div>
            <div className="mt-2 md:mt-0 flex items-center">
              <span className="px-3 py-1 inline-flex text-sm font-medium rounded-full border bg-blue-100 text-blue-800 border-blue-200">
                {procedure.status}
              </span>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-slate-500 font-medium">Hospital:</span>
              <div className="font-semibold text-slate-900 mt-1">{procedure.hospital}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Procedure Name:</span>
              <div className="font-semibold text-slate-900 mt-1">{procedure.name}</div>
            </div>
            <div>
              <span className="text-slate-500 font-medium">Physician:</span>
              <div className="font-semibold text-slate-900 mt-1">{procedure.physician}</div>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="border-b border-slate-200 bg-white">
          <nav className="flex -mb-px px-6 overflow-x-auto">
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'summary' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`} onClick={() => setActiveTab('summary')}> <div className="flex items-center"><FaNotesMedical className="mr-2" />Summary</div></button>
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'lab' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`} onClick={() => setActiveTab('lab')}> <div className="flex items-center"><FaFlask className="mr-2" />Lab Results</div></button>
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'imaging' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`} onClick={() => setActiveTab('imaging')}> <div className="flex items-center"><FaXRay className="mr-2" />Imaging</div></button>
            <button className={`mr-8 py-4 px-1 border-b-2 font-medium text-sm focus:outline-none ${activeTab === 'documents' ? 'border-sky-500 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`} onClick={() => setActiveTab('documents')}> <div className="flex items-center"><FaFileMedical className="mr-2" />Documents</div></button>
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
                  <h3 className="text-sm font-semibold text-sky-700">Procedure ID</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.id}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Date</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{formatDate(procedure.date)}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Procedure Name</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.name}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Hospital</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.hospital}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Physician</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.physician}</p>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Indication</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.indication || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Findings</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.findings || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Complications</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.complications || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Follow Up Plan</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.followUpPlan || 'N/A'}</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                  <h3 className="text-sm font-semibold text-sky-700">Status</h3>
                </div>
                <div className="p-5">
                  <p className="text-slate-700 leading-relaxed">{procedure.status}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'lab' && (
          <div className="space-y-6">
            {procedure.associatedRecords && procedure.associatedRecords.labResults && procedure.associatedRecords.labResults.length > 0 ? (
              procedure.associatedRecords.labResults.map((lab, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">{lab.testName}</h3>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(lab.date)} • {lab.facility}</p>
                  </div>
                  <div className="p-5">
                    <div className="space-y-4">
                      {/* Add lab result details here */}
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Result</p>
                        <p className="text-sm text-slate-600">{lab.result}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-sky-400">
                  <FaFlask className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No lab results available</h3>
                <p className="mt-1 text-sm text-slate-500">Lab results from this procedure will appear here when they are available.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'imaging' && (
          <div className="space-y-6">
            {procedure.associatedRecords && procedure.associatedRecords.imaging && procedure.associatedRecords.imaging.length > 0 ? (
              procedure.associatedRecords.imaging.map((imaging, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                    <h3 className="text-sm font-semibold text-sky-700">{imaging.type}</h3>
                    <p className="text-xs text-slate-500 mt-1">{formatDate(imaging.date)} • {imaging.facility}</p>
                  </div>
                  <div className="p-5">
                    <div className="space-y-4">
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Description</p>
                        <p className="text-sm text-slate-600">{imaging.description}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-lg">
                        <p className="text-sm font-medium text-slate-700 mb-2">Findings</p>
                        <p className="text-sm text-slate-600">{imaging.findings}</p>
                      </div>
                      {imaging.imageUrl && (
                        <div className="relative group">
                          <img src={imaging.imageUrl} alt={`${imaging.type} image`} className="w-full h-64 object-contain rounded-lg bg-slate-100" />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                            <a href={imaging.imageUrl} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-white bg-sky-600 px-4 py-2 rounded-lg hover:bg-sky-700 transition-colors"><FaDownload className="mr-2 inline" /> Download Image</a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 px-4 bg-white rounded-lg border border-dashed border-slate-300">
                <div className="mx-auto h-12 w-12 text-sky-400">
                  <FaXRay className="h-12 w-12" />
                </div>
                <h3 className="mt-2 text-sm font-medium text-slate-900">No imaging results available</h3>
                <p className="mt-1 text-sm text-slate-500">Imaging results from this procedure will appear here when they are available.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="px-4 py-3 bg-sky-50 border-b border-slate-200">
                <h3 className="text-sm font-semibold text-sky-700">Uploaded Documents</h3>
              </div>
              <div className="p-5">
                {procedure.documents && procedure.documents.length > 0 ? (
                  <div className="space-y-4">
                    {procedure.documents.map((doc, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center">
                          <FaRegFilePdf className="h-5 w-5 text-red-500 mr-3" />
                          <span className="text-sm text-slate-700">Document {index + 1}</span>
                        </div>
                        <a href={doc} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:text-sky-800"><FaDownload /></a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                    <div className="mx-auto h-12 w-12 text-sky-400">
                      <FaRegFilePdf className="h-12 w-12" />
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-slate-900">No documents available</h3>
                    <p className="mt-1 text-sm text-slate-500">Documents from this procedure will appear here when they are available.</p>
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

export default ProcedureDetails; 