import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Added missing import
import { useAuthStore } from "../../store/authStore";
import { X, Search, Plus, FileText, Send, ArrowRight, Check, User, Calendar, Clock, Clipboard, Pill, Users, ChevronLeft } from 'lucide-react';

export default function PrescriptionUI() {
  const { user } = useAuthStore();
  const [activeStep, setActiveStep] = useState(1);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [medications, setMedications] = useState([]);
  const [selectedMedications, setSelectedMedications] = useState([]);
  const [searchMedQuery, setSearchMedQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Added the useNavigate hook from React Router
  const navigate = useNavigate();
    
  // Handle navigation back to dashboard
  const handleBackToDashboard = () => navigate('/dashboard');

  // Simulate loading patients
  useEffect(() => {
    // Mock patient data
    const mockPatients = [
      { id: 1, name: 'Emma Johnson', age: 34, gender: 'Female', lastVisit: '2025-04-20' },
      { id: 2, name: 'James Smith', age: 42, gender: 'Male', lastVisit: '2025-04-28' },
      { id: 3, name: 'Sophia Williams', age: 29, gender: 'Female', lastVisit: '2025-05-01' },
      { id: 4, name: 'Michael Brown', age: 53, gender: 'Male', lastVisit: '2025-04-15' },
      { id: 5, name: 'Olivia Davis', age: 38, gender: 'Female', lastVisit: '2025-05-03' },
    ];
    setPatients(mockPatients);
  }, []);

  // Simulate loading medications
  useEffect(() => {
    // Mock medication data
    const mockMedications = [
      { id: 1, name: 'Amoxicillin', dosage: '500mg', type: 'Antibiotic' },
      { id: 2, name: 'Lisinopril', dosage: '10mg', type: 'ACE Inhibitor' },
      { id: 3, name: 'Atorvastatin', dosage: '20mg', type: 'Statin' },
      { id: 4, name: 'Metformin', dosage: '850mg', type: 'Antidiabetic' },
      { id: 5, name: 'Sertraline', dosage: '50mg', type: 'SSRI' },
      { id: 6, name: 'Ibuprofen', dosage: '400mg', type: 'NSAID' },
      { id: 7, name: 'Omeprazole', dosage: '20mg', type: 'PPI' },
      { id: 8, name: 'Albuterol', dosage: '90mcg', type: 'Bronchodilator' },
    ];
    setMedications(mockMedications);
  }, []);

  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMedications = medications.filter(med => 
    med.name.toLowerCase().includes(searchMedQuery.toLowerCase()) ||
    med.type.toLowerCase().includes(searchMedQuery.toLowerCase())
  );

  const addMedication = (medication) => {
    if (!selectedMedications.some(med => med.id === medication.id)) {
      setSelectedMedications([...selectedMedications, {
        ...medication,
        frequency: '1-0-1',
        duration: '7 days',
        instructions: 'Take after meals'
      }]);
      setSearchMedQuery('');
    }
  };

  const removeMedication = (id) => {
    setSelectedMedications(selectedMedications.filter(med => med.id !== id));
  };

  const updateMedication = (id, field, value) => {
    setSelectedMedications(selectedMedications.map(med => 
      med.id === id ? { ...med, [field]: value } : med
    ));
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setShowSuccess(true);
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setSelectedPatient(null);
        setSelectedMedications([]);
        setNotes('');
        setActiveStep(1);
      }, 3000);
    }, 1500);
  };

  const isStepComplete = (step) => {
    switch (step) {
      case 1:
        return selectedPatient !== null;
      case 2:
        return selectedMedications.length > 0;
      case 3:
        return true; // Notes are optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (activeStep < 3 && isStepComplete(activeStep)) {
      setActiveStep(activeStep + 1);
    }
  };

  const prevStep = () => {
    if (activeStep > 1) {
      setActiveStep(activeStep - 1);
    }
  };

  // Sidebar menu items
  const menuItems = [
    // You can add menu items here if needed
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className={`bg-gradient-to-b from-blue-800 to-indigo-900 text-white transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-64' : 'w-20'} flex flex-col`}>
        {/* Logo */}
        <div className="p-4 flex items-center justify-center">
          <div className="font-bold text-xl">
            {isSidebarOpen ? (
              <div className="flex items-center space-x-2">
                <Clipboard className="h-8 w-8 text-emerald-400" />
                <span className="text-white">MedScript</span>
              </div>
            ) : (
              <Clipboard className="h-8 w-8 text-emerald-400" />
            )}
          </div>
        </div>
        
        {/* Menu Items */}
        <div className="flex-1 mt-8">
          {menuItems.map((item, index) => (
            <div 
              key={index} 
              className={`flex items-center px-4 py-3 mb-1 mx-2 rounded-lg cursor-pointer hover:bg-blue-700 transition-all duration-200 ${index === 1 ? 'bg-blue-700' : ''}`}
            >
              <div className="text-emerald-400">{item.icon}</div>
              {isSidebarOpen && <span className="ml-3 whitespace-nowrap">{item.title}</span>}
            </div>
          ))}
        </div>  
        
        {/* User Profile */}
        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
            {isSidebarOpen && (
              <div className="ml-3">
                <div className="font-medium">Dr. {user?.name || 'Doctor'}</div>
                <div className="text-xs text-blue-300">Online</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b shadow-sm h-16 flex items-center justify-between px-6">
          <div className="flex items-center">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex items-center">
              <button 
                onClick={handleBackToDashboard}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <ChevronLeft className="text-gray-600 group-hover:text-emerald-500" size={24} />
              </button>
              <h1 className="text-xl font-semibold text-gray-800">Create Prescription</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-sm bg-blue-50 text-blue-800 py-1 px-3 rounded-full">
              <div className="h-2 w-2 bg-green-500 rounded-full"></div>
              <span>Online</span>
            </div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <User className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress Steps */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center w-full">
                <div className={`flex items-center justify-center rounded-full w-10 h-10 transition-all duration-300 ${
                  activeStep >= 1 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  1
                </div>
                <div className={`h-1 flex-1 mx-2 transition-all duration-500 ${
                  activeStep > 1 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center rounded-full w-10 h-10 transition-all duration-300 ${
                  activeStep >= 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  2
                </div>
                <div className={`h-1 flex-1 mx-2 transition-all duration-500 ${
                  activeStep > 2 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gray-200'
                }`}></div>
                <div className={`flex items-center justify-center rounded-full w-10 h-10 transition-all duration-300 ${
                  activeStep >= 3 ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'
                }`}>
                  3
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-3 text-sm font-medium px-2">
              <div className={activeStep === 1 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                Select Patient
              </div>
              <div className={activeStep === 2 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                Add Medications
              </div>
              <div className={activeStep === 3 ? 'text-emerald-600 font-medium' : 'text-gray-500'}>
                Review & Submit
              </div>
            </div>
          </div>

          {/* Content Box */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all duration-300 ease-in-out transform hover:shadow-md">
            {/* Step Content */}
            <div className="p-6">
              {activeStep === 1 && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Users className="mr-2 h-5 w-5 text-emerald-500" />
                    Select Patient
                  </h2>
                  <div className="relative mb-6 group">
                    <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="Search patients by name..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all duration-200"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                    {filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        className={`border rounded-xl p-4 cursor-pointer transition-all duration-300 hover:shadow-md transform hover:-translate-y-1 ${
                          selectedPatient?.id === patient.id 
                            ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-green-50 shadow' 
                            : 'border-gray-200 hover:border-emerald-200'
                        }`}
                        onClick={() => setSelectedPatient(patient)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white mr-3">
                              {patient.name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-800">{patient.name}</h3>
                              <div className="text-sm text-gray-600 mt-1 flex items-center">
                                <span className="mr-2">{patient.age} years</span>
                                <span className="h-1 w-1 rounded-full bg-gray-400"></span>
                                <span className="ml-2">{patient.gender}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-2 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                Last visit: {patient.lastVisit}
                              </div>
                            </div>
                          </div>
                          {selectedPatient?.id === patient.id && (
                            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full text-white">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredPatients.length === 0 && (
                    <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 animate-pulse">
                      <Search className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                      <div className="text-gray-500 font-medium">No patients found</div>
                      <div className="text-sm text-gray-400 mt-1">Try a different search term</div>
                    </div>
                  )}
                </div>
              )}

              {activeStep === 2 && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <Pill className="mr-2 h-5 w-5 text-emerald-500" />
                    Add Medications
                  </h2>
                  
                  <div className="mb-6">
                    <div className="relative group">
                      <Search className="absolute left-4 top-3 h-5 w-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        placeholder="Search medications..."
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        value={searchMedQuery}
                        onChange={(e) => setSearchMedQuery(e.target.value)}
                      />
                    </div>
                    
                    {searchMedQuery && (
                      <div className="mt-2 border rounded-lg shadow-sm max-h-48 overflow-y-auto">
                        {filteredMedications.map(medication => (
                          <div 
                            key={medication.id}
                            className="p-3 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center transition-colors duration-200"
                            onClick={() => addMedication(medication)}
                          >
                            <div>
                              <div className="font-medium text-gray-800">{medication.name}</div>
                              <div className="text-sm text-gray-600 flex items-center">
                                <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs mr-2">{medication.dosage}</span>
                                <span className="text-gray-500">{medication.type}</span>
                              </div>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors duration-300">
                              <Plus className="h-5 w-5" />
                            </div>
                          </div>
                        ))}
                        {filteredMedications.length === 0 && (
                          <div className="p-6 text-center text-gray-500">
                            <Search className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                            <div>No medications found</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-700 mb-2 flex items-center">
                      <Clipboard className="mr-2 h-4 w-4 text-emerald-500" />
                      Selected Medications
                    </h3>
                    {selectedMedications.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <Pill className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                        <div className="text-gray-500 font-medium">No medications added yet</div>
                        <div className="text-sm text-gray-400 mt-1">Search and add medications above</div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedMedications.map((med, index) => (
                          <div 
                            key={med.id} 
                            className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                            style={{ animationDelay: `${index * 100}ms` }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center text-blue-700">
                                  <Pill className="h-5 w-5" />
                                </div>
                                <div className="ml-3">
                                  <div className="font-medium text-blue-700">{med.name}</div>
                                  <div className="text-sm text-gray-600 flex items-center">
                                    <span className="font-medium text-gray-800">{med.dosage}</span>
                                    <span className="mx-2">•</span>
                                    <span className="text-gray-500">{med.type}</span>
                                  </div>
                                </div>
                              </div>
                              <button 
                                onClick={() => removeMedication(med.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 rounded-full flex items-center justify-center transition-colors"
                              >
                                <X size={18} />
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                              <div className="group">
                                <label className="block text-xs font-medium text-gray-700 mb-1 group-hover:text-emerald-600 transition-colors">Frequency</label>
                                <select 
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                  value={med.frequency}
                                  onChange={(e) => updateMedication(med.id, 'frequency', e.target.value)}
                                >
                                  <option value="1-0-0">Once daily (Morning)</option>
                                  <option value="0-1-0">Once daily (Afternoon)</option>
                                  <option value="0-0-1">Once daily (Evening)</option>
                                  <option value="1-0-1">Twice daily (Morning-Evening)</option>
                                  <option value="1-1-1">Three times daily</option>
                                </select>
                              </div>
                              <div className="group">
                                <label className="block text-xs font-medium text-gray-700 mb-1 group-hover:text-emerald-600 transition-colors">Duration</label>
                                <select 
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                  value={med.duration}
                                  onChange={(e) => updateMedication(med.id, 'duration', e.target.value)}
                                >
                                  <option value="3 days">3 days</option>
                                  <option value="5 days">5 days</option>
                                  <option value="7 days">7 days</option>
                                  <option value="10 days">10 days</option>
                                  <option value="14 days">14 days</option>
                                  <option value="30 days">30 days</option>
                                </select>
                              </div>
                              <div className="group">
                                <label className="block text-xs font-medium text-gray-700 mb-1 group-hover:text-emerald-600 transition-colors">Instructions</label>
                                <input 
                                  type="text" 
                                  className="w-full p-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                  value={med.instructions}
                                  onChange={(e) => updateMedication(med.id, 'instructions', e.target.value)}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="animate-fadeIn">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-emerald-500" />
                    Review & Submit
                  </h2>
                  
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-5 mb-6 transform transition-all duration-300 hover:shadow-md">
                    <h3 className="font-medium text-blue-800 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Patient Information
                    </h3>
                    <div className="mt-3 flex items-center">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white mr-4">
                        {selectedPatient?.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-lg font-medium">{selectedPatient?.name}</div>
                        <div className="text-gray-600 text-sm flex items-center mt-1">
                          <span>{selectedPatient?.age} years</span>
                          <span className="mx-2">•</span>
                          <span>{selectedPatient?.gender}</span>
                          <span className="mx-2">•</span>
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            Last visit: {selectedPatient?.lastVisit}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden mb-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-4 py-3 border-b">
                      <h3 className="font-medium flex items-center">
                        <Clipboard className="h-4 w-4 mr-2 text-emerald-500" />
                        Prescription Details
                      </h3>
                    </div>
                    <div className="divide-y">
                      {selectedMedications.map((med, index) => (
                        <div 
                          key={med.id} 
                          className="p-4 flex items-start hover:bg-gray-50 transition-colors duration-200"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full mr-3 mt-1 shadow-sm">
                            {index + 1}
                          </div>
                          <div className="flex-grow">
                            <div className="flex justify-between">
                              <div className="font-medium">{med.name} <span className="text-blue-600">({med.dosage})</span></div>
                              <div className="text-sm px-2 py-0.5 bg-blue-100 text-blue-700 rounded">{med.type}</div>
                            </div>
                            <div className="text-sm mt-2 text-gray-600 flex flex-wrap gap-2">
                              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {med.frequency}
                              </span>
                              <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full flex items-center">
                                <Calendar className="h-3 w-3 mr-1" />
                                {med.duration}
                              </span>
                            </div>
                            <div className="text-sm italic text-gray-600 mt-2 bg-gray-50 p-2 rounded border-l-2 border-emerald-500">
                              "{med.instructions}"
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <FileText className="h-4 w-4 mr-2 text-emerald-500" />
                      Additional Notes
                    </label>
                    <textarea
                      rows="3"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      placeholder="Add any additional instructions or notes for the patient or pharmacist..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                  </div>
                </div>
              )}
            </div>

            {/* Footer/Actions */}
            <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-t flex justify-between items-center">
              <button
                onClick={prevStep}
                disabled={activeStep === 1}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200 ${
                  activeStep === 1 
                    ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                    : 'text-gray-700 hover:bg-white hover:shadow-sm border border-gray-200'
                }`}
              >
                <ArrowRight className="h-4 w-4 transform rotate-180" />
                <span>Back</span>
              </button>
              
              {activeStep < 3 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepComplete(activeStep)}
                  className={`px-5 py-2 rounded-lg flex items-center space-x-2 shadow-sm transition-all duration-300 ${
                    isStepComplete(activeStep)
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white transform hover:-translate-y-0.5 hover:shadow-md' 
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-sm transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      <span>Send to Pharmacy</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 animate-scaleIn">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
                <Check className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Prescription Sent!</h3>
              <p className="text-gray-600 mt-2">
                The prescription has been successfully sent to the pharmacy for processing.
              </p>
              <div className="w-full h-2 bg-gray-200 rounded-full mt-6 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-emerald-600 rounded-full animate-progress"></div>
              </div>
              <div className="mt-2 text-sm text-gray-500">
                This window will close automatically...
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes progress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
        .animate-progress {
          animation: progress 3s linear forwards;
        }
      `}</style>
    </div>
  );
}