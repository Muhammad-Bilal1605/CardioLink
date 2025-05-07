import { useState, useEffect } from 'react';
import { useAuthStore } from "../../store/authStore";
import { X, Search, Plus, FileText, Send, ArrowRight, Check } from 'lucide-react';

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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen p-6 flex justify-center">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">Create Prescription</h1>
              <p className="text-blue-100">Dr. {user?.name || 'Doctor'}</p>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-3 w-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Online</span>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-indigo-50 px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center w-full">
              <div className={`flex items-center justify-center rounded-full w-8 h-8 ${
                activeStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                1
              </div>
              <div className={`h-1 flex-1 mx-2 ${
                activeStep > 1 ? 'bg-blue-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center rounded-full w-8 h-8 ${
                activeStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                2
              </div>
              <div className={`h-1 flex-1 mx-2 ${
                activeStep > 2 ? 'bg-blue-600' : 'bg-gray-200'
              }`}></div>
              <div className={`flex items-center justify-center rounded-full w-8 h-8 ${
                activeStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-sm font-medium">
            <div className={activeStep === 1 ? 'text-blue-600' : 'text-gray-500'}>
              Select Patient
            </div>
            <div className={activeStep === 2 ? 'text-blue-600' : 'text-gray-500'}>
              Add Medications
            </div>
            <div className={activeStep === 3 ? 'text-blue-600' : 'text-gray-500'}>
              Review & Submit
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6">
          {activeStep === 1 && (
            <div className="animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Select Patient</h2>
              <div className="relative mb-6">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search patients by name..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto pr-2">
                {filteredPatients.map(patient => (
                  <div
                    key={patient.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                      selectedPatient?.id === patient.id 
                        ? 'border-blue-500 bg-blue-50 shadow' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => setSelectedPatient(patient)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{patient.name}</h3>
                        <div className="text-sm text-gray-600 mt-1">
                          {patient.age} years • {patient.gender}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Last visit: {patient.lastVisit}
                        </div>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-white">
                          <Check size={14} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {filteredPatients.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No patients found matching your search criteria
                </div>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className="animate-fadeIn">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Medications</h2>
              
              <div className="mb-6">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search medications..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={searchMedQuery}
                    onChange={(e) => setSearchMedQuery(e.target.value)}
                  />
                </div>
                
                {searchMedQuery && (
                  <div className="mt-2 border rounded-lg shadow-sm max-h-48 overflow-y-auto">
                    {filteredMedications.map(medication => (
                      <div 
                        key={medication.id}
                        className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-b-0 flex justify-between items-center"
                        onClick={() => addMedication(medication)}
                      >
                        <div>
                          <div className="font-medium">{medication.name}</div>
                          <div className="text-sm text-gray-600">{medication.dosage} • {medication.type}</div>
                        </div>
                        <Plus className="h-5 w-5 text-blue-600" />
                      </div>
                    ))}
                    {filteredMedications.length === 0 && (
                      <div className="p-3 text-center text-gray-500">
                        No medications found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mb-4">
                <h3 className="font-medium text-gray-700 mb-2">Selected Medications</h3>
                {selectedMedications.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                    <div className="text-gray-500">No medications added yet</div>
                    <div className="text-sm text-gray-400 mt-1">Search and add medications above</div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedMedications.map(med => (
                      <div key={med.id} className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div className="font-medium text-blue-700">{med.name} ({med.dosage})</div>
                          <button 
                            onClick={() => removeMedication(med.id)}
                            className="text-gray-400 hover:text-red-500"
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">{med.type}</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Frequency</label>
                            <select 
                              className="w-full p-2 border border-gray-300 rounded text-sm"
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
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Duration</label>
                            <select 
                              className="w-full p-2 border border-gray-300 rounded text-sm"
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
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Instructions</label>
                            <input 
                              type="text" 
                              className="w-full p-2 border border-gray-300 rounded text-sm"
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Review & Submit</h2>
              
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-blue-800">Patient Information</h3>
                <div className="mt-2">
                  <div className="text-lg">{selectedPatient?.name}</div>
                  <div className="text-gray-600 text-sm">
                    {selectedPatient?.age} years • {selectedPatient?.gender}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden mb-6">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <h3 className="font-medium">Prescription Details</h3>
                </div>
                <div className="divide-y">
                  {selectedMedications.map((med, index) => (
                    <div key={med.id} className="p-4 flex items-start">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-700 rounded-full mr-3 mt-1">
                        {index + 1}
                      </div>
                      <div className="flex-grow">
                        <div className="flex justify-between">
                          <div className="font-medium">{med.name} ({med.dosage})</div>
                          <div className="text-sm text-gray-500">{med.type}</div>
                        </div>
                        <div className="text-sm mt-1 text-gray-600">
                          <span className="mr-3">✓ {med.frequency}</span>
                          <span className="mr-3">✓ {med.duration}</span>
                        </div>
                        <div className="text-sm italic text-gray-600 mt-1">
                          "{med.instructions}"
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  rows="3"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any additional instructions or notes for the patient or pharmacist..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                ></textarea>
              </div>
            </div>
          )}
        </div>

        {/* Footer/Actions */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
          <button
            onClick={prevStep}
            disabled={activeStep === 1}
            className={`px-4 py-2 rounded-lg flex items-center space-x-1 transition-colors ${
              activeStep === 1 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <ArrowRight className="h-4 w-4 transform rotate-180" />
            <span>Back</span>
          </button>
          
          {activeStep < 3 ? (
            <button
              onClick={nextStep}
              disabled={!isStepComplete(activeStep)}
              className={`px-4 py-2 rounded-lg flex items-center space-x-1 ${
                isStepComplete(activeStep)
                  ? 'bg-blue-600 hover:bg-blue-700 text-white transition-colors'
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
              className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm"
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

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-xl shadow-xl p-6 w-96 animate-scaleIn">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800">Prescription Sent!</h3>
              <p className="text-gray-600 mt-2">
                The prescription has been successfully sent to the pharmacy for processing.
              </p>
              <div className="mt-6 text-sm text-gray-500">
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
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}