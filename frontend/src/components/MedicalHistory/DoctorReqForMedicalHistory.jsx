import { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { Search, ArrowRight, FileText, Image, FileSpreadsheet, Download, Calendar, Clock, X, ChevronDown, ChevronUp } from "lucide-react";

// Dummy data for radiologist responses
const dummyPatients = [
  { id: 1, name: "Sarah Johnson", dob: "1985-04-12", mrn: "MRN23456" },
  { id: 2, name: "Michael Chen", dob: "1972-09-28", mrn: "MRN34567" },
  { id: 3, name: "Emma Rodriguez", dob: "1990-11-03", mrn: "MRN45678" },
  { id: 4, name: "David Williams", dob: "1964-02-17", mrn: "MRN56789" },
  { id: 5, name: "Olivia Thompson", dob: "1995-07-22", mrn: "MRN67890" }
];

const dummyResponses = {
  "Sarah Johnson": {
    patientInfo: {
      name: "Sarah Johnson",
      dob: "1985-04-12",
      mrn: "MRN23456",
      gender: "Female",
      age: "40"
    },
    records: [
      { 
        id: 1, 
        type: "image", 
        name: "Chest X-Ray", 
        date: "2025-04-12", 
        time: "14:30",
        radiologist: "Dr. James Wilson",
        notes: "Normal chest radiograph. No evidence of active disease."
      },
      { 
        id: 2, 
        type: "pdf", 
        name: "MRI Report - Lower Back", 
        date: "2025-03-28", 
        time: "10:15",
        radiologist: "Dr. Elena Martinez",
        notes: "Minor disc bulging at L4-L5. No significant stenosis identified."
      },
      { 
        id: 3, 
        type: "image", 
        name: "Abdominal Ultrasound", 
        date: "2025-02-15", 
        time: "09:45",
        radiologist: "Dr. Thomas Lee",
        notes: "Normal liver, gallbladder, pancreas, and kidneys. No abnormalities detected."
      }
    ]
  },
  "Michael Chen": {
    patientInfo: {
      name: "Michael Chen",
      dob: "1972-09-28",
      mrn: "MRN34567",
      gender: "Male",
      age: "53"
    },
    records: [
      { 
        id: 1, 
        type: "pdf", 
        name: "Brain CT Scan Report", 
        date: "2025-04-02", 
        time: "11:20",
        radiologist: "Dr. Samantha Brown",
        notes: "No acute intracranial abnormality. Normal brain CT scan."
      },
      { 
        id: 2, 
        type: "xlsx", 
        name: "Lab Results History", 
        date: "2025-03-15", 
        time: "08:30",
        radiologist: "N/A",
        notes: "Comprehensive 5-year lab value tracking spreadsheet."
      }
    ]
  }
};

export default function RadiologyRequestComponent() {
  const { user } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [openRecordId, setOpenRecordId] = useState(null);
  const [filteredPatients, setFilteredPatients] = useState([]);

  // Filter patients based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients([]);
    } else {
      const filtered = dummyPatients.filter(patient => 
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.mrn.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPatients(filtered);
    }
  }, [searchQuery]);

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setSearchQuery(patient.name);
    setFilteredPatients([]);
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    setIsSubmitting(true);
    
    // Simulate API request delay
    setTimeout(() => {
      setPatientRecords(dummyResponses[selectedPatient.name] || null);
      setIsSubmitting(false);
      setShowResults(true);
    }, 1500);
  };

  const toggleRecordDetails = (id) => {
    if (openRecordId === id) {
      setOpenRecordId(null);
    } else {
      setOpenRecordId(id);
    }
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "pdf":
        return <FileText className="text-red-500" />;
      case "image":
        return <Image className="text-blue-500" />;
      case "xlsx":
        return <FileSpreadsheet className="text-green-500" />;
      default:
        return <FileText className="text-gray-500" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-emerald-800 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Radiology Records Request
          </h1>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center text-white font-medium shadow-sm">
                  {user.name?.charAt(0)}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">Dr. {user.name}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-emerald-100 transition-all duration-300 hover:shadow-xl">
          {/* Request Form */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-emerald-800 mb-4 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Request Patient Records
            </h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="relative">
                <div className="flex items-center border-2 border-emerald-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all duration-300">
                  <Search className="ml-3 h-5 w-5 text-emerald-500" />
                  <input
                    type="text"
                    className="block w-full px-3 py-3 border-0 focus:outline-none placeholder-gray-400 text-gray-700"
                    placeholder="Search patient by name or MRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
                      onClick={() => {
                        setSearchQuery("");
                        setSelectedPatient(null);
                      }}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  )}
                </div>
                
                {filteredPatients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-emerald-200 max-h-60 overflow-y-auto animate-fadeIn">
                    <ul className="py-1">
                      {filteredPatients.map((patient) => (
                        <li
                          key={patient.id}
                          className="px-4 py-3 hover:bg-emerald-50 cursor-pointer transition-colors duration-200"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="font-medium text-emerald-800">{patient.name}</div>
                          <div className="text-sm text-gray-500 flex items-center mt-1">
                            <Calendar className="h-3 w-3 mr-1 text-emerald-500" />
                            DOB: {patient.dob} | 
                            <span className="ml-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {patient.mrn}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!selectedPatient || isSubmitting}
                  className={`px-6 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-all duration-300 ${
                    !selectedPatient || isSubmitting 
                      ? "bg-gray-300 text-gray-500" 
                      : "bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 transform hover:-translate-y-1"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Requesting Records...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Records</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {showResults && patientRecords && (
            <div className="mt-8 border-t border-emerald-200 pt-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-emerald-800 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Radiologist Response
                </h2>
                <button 
                  onClick={() => setShowResults(false)}
                  className="text-sm text-emerald-600 hover:text-emerald-800 flex items-center transition-colors duration-200"
                >
                  <X className="h-4 w-4 mr-1" />
                  Close Results
                </button>
              </div>

              {/* Patient Information Card */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-5 mb-6 border border-emerald-200 shadow-sm">
                <h3 className="font-medium text-emerald-800 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Patient Information
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs text-emerald-600 font-medium">Name</p>
                    <p className="font-medium text-gray-800">{patientRecords.patientInfo.name}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs text-emerald-600 font-medium">MRN</p>
                    <p className="text-gray-800">{patientRecords.patientInfo.mrn}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs text-emerald-600 font-medium">DOB</p>
                    <p className="text-gray-800">{patientRecords.patientInfo.dob}</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-emerald-100 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs text-emerald-600 font-medium">Gender</p>
                    <p className="text-gray-800">{patientRecords.patientInfo.gender}</p>
                  </div>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-4">
                <h3 className="font-medium text-emerald-800 mb-3 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                  Available Records ({patientRecords.records.length})
                </h3>
                
                {patientRecords.records.map((record) => (
                  <div key={record.id} className="bg-white border border-emerald-200 rounded-lg overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-emerald-50 transition-colors duration-200"
                      onClick={() => toggleRecordDetails(record.id)}
                    >
                      <div className="flex items-center">
                        <div className="p-2 rounded-lg bg-emerald-100 text-emerald-800">
                          {getFileIcon(record.type)}
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-emerald-800">{record.name}</p>
                          <div className="flex text-xs text-gray-500 mt-1">
                            <span className="flex items-center mr-3">
                              <Calendar className="h-3 w-3 mr-1 text-emerald-500" /> {record.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1 text-emerald-500" /> {record.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button className="px-3 py-1 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md flex items-center text-sm transition-colors duration-200">
                          <Download className="h-4 w-4 mr-1" /> Download
                        </button>
                        <div className="ml-2 p-1 rounded-full hover:bg-emerald-100 transition-colors duration-200">
                          {openRecordId === record.id ? (
                            <ChevronUp className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    {openRecordId === record.id && (
                      <div className="border-t border-emerald-200 p-4 bg-emerald-50 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-3 rounded-lg border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium">Radiologist</p>
                            <p className="font-medium text-gray-800">{record.radiologist}</p>
                          </div>
                          <div className="bg-white p-3 rounded-lg border border-emerald-100">
                            <p className="text-xs text-emerald-600 font-medium">Notes</p>
                            <p className="text-gray-800">{record.notes}</p>
                          </div>
                        </div>
                        
                        {/* Preview placeholder */}
                        {record.type === "image" && (
                          <div className="mt-4 bg-white border border-emerald-200 rounded-lg p-4 flex items-center justify-center h-48 shadow-sm">
                            <div className="text-center">
                              <div className="bg-emerald-100 p-4 rounded-full mx-auto inline-flex">
                                <Image className="h-12 w-12 text-emerald-600" />
                              </div>
                              <p className="mt-2 text-sm text-gray-500">Preview available</p>
                              <button className="mt-2 px-4 py-1 text-sm text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-md hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm">
                                Open image in viewer
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {showResults && !patientRecords && (
            <div className="mt-8 border-t border-emerald-200 pt-6 text-center py-12 animate-fadeIn">
              <div className="bg-emerald-100 p-6 rounded-full mx-auto inline-flex">
                <Image className="h-16 w-16 text-emerald-600" />
              </div>
              <h3 className="mt-4 text-lg font-medium text-emerald-800">No records found</h3>
              <p className="mt-2 text-gray-600">
                No radiology records were found for this patient.
              </p>
              <button className="mt-4 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm mx-auto">
                <ArrowRight className="h-4 w-4 mr-1" />
                <span>Search Another Patient</span>
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Add a nice little global style for fadeIn animation */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}