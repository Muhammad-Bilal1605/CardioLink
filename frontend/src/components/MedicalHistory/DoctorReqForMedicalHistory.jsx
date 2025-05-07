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
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900">Radiology Records Request</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium">
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
        <div className="bg-white rounded-lg shadow p-6">
          {/* Request Form */}
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Request Patient Records</h2>
            <form onSubmit={handleRequestSubmit} className="space-y-4">
              <div className="relative">
                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500">
                  <Search className="ml-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    className="block w-full px-3 py-3 border-0 focus:outline-none placeholder-gray-400"
                    placeholder="Search patient by name or MRN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="p-2 text-gray-400 hover:text-gray-500"
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
                  <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
                    <ul className="py-1">
                      {filteredPatients.map((patient) => (
                        <li
                          key={patient.id}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handlePatientSelect(patient)}
                        >
                          <div className="font-medium text-gray-900">{patient.name}</div>
                          <div className="text-sm text-gray-500">
                            DOB: {patient.dob} | {patient.mrn}
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
                  className={`flex items-center px-4 py-2 rounded-md text-white font-medium ${
                    !selectedPatient || isSubmitting ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Requesting Records...
                    </>
                  ) : (
                    <>
                      Request Records <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Results Section */}
          {showResults && patientRecords && (
            <div className="mt-8 border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-medium text-gray-900">Radiologist Response</h2>
                <button 
                  onClick={() => setShowResults(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Close Results
                </button>
              </div>

              {/* Patient Information Card */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <h3 className="font-medium text-gray-900 mb-2">Patient Information</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Name</p>
                    <p className="font-medium">{patientRecords.patientInfo.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">MRN</p>
                    <p>{patientRecords.patientInfo.mrn}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">DOB</p>
                    <p>{patientRecords.patientInfo.dob}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Gender</p>
                    <p>{patientRecords.patientInfo.gender}</p>
                  </div>
                </div>
              </div>

              {/* Records List */}
              <div className="space-y-3">
                <h3 className="font-medium text-gray-900 mb-3">Available Records ({patientRecords.records.length})</h3>
                
                {patientRecords.records.map((record) => (
                  <div key={record.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div 
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
                      onClick={() => toggleRecordDetails(record.id)}
                    >
                      <div className="flex items-center">
                        {getFileIcon(record.type)}
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{record.name}</p>
                          <div className="flex text-xs text-gray-500 mt-1">
                            <span className="flex items-center mr-3">
                              <Calendar className="h-3 w-3 mr-1" /> {record.date}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" /> {record.time}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <button className="text-indigo-600 hover:text-indigo-800 mr-4 flex items-center text-sm">
                          <Download className="h-4 w-4 mr-1" /> Download
                        </button>
                        {openRecordId === record.id ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    {openRecordId === record.id && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500">Radiologist</p>
                            <p className="font-medium">{record.radiologist}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500">Notes</p>
                            <p>{record.notes}</p>
                          </div>
                        </div>
                        
                        {/* Preview placeholder */}
                        {record.type === "image" && (
                          <div className="mt-4 bg-white border border-gray-200 rounded p-4 flex items-center justify-center h-48">
                            <div className="text-center">
                              <Image className="h-12 w-12 mx-auto text-gray-400" />
                              <p className="mt-2 text-sm text-gray-500">Preview available</p>
                              <button className="mt-2 text-sm text-indigo-600 hover:text-indigo-800">
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
            <div className="mt-8 border-t border-gray-200 pt-6 text-center py-12">
              <Image className="h-16 w-16 mx-auto text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">No records found</h3>
              <p className="mt-1 text-gray-500">
                No radiology records were found for this patient.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}