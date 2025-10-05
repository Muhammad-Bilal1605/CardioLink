import React, { useState } from 'react';
import DoctorChatInterface from './components/DoctorChatInterface';
import './App.css';

function App() {
  // Mock doctor and patient data - replace with real authentication
  const [currentDoctor] = useState({
    id: 'doctor_67890',
    name: 'Dr. Muhammad Bilal',
    type: 'doctor'
  });

  const [currentPatient] = useState({
    id: 'patient_12345', 
    name: 'Millie Johnson',
    type: 'patient'
  });

  return (
    <div className="App">
      <DoctorChatInterface
        doctorId={currentDoctor.id}
        patientId={currentPatient.id}
        doctorName={currentDoctor.name}
        patientName={currentPatient.name}
      />
    </div>
  );
}

export default App;
