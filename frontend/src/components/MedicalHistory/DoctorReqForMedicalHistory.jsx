import React, { useState } from 'react';

const DoctorReqForMedicalHistory = () => {
  const [patientId, setPatientId] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (patientId.trim() === '') {
      alert('Please enter a Patient ID or Name.');
      return;
    }

    // Simulate request
    console.log(`Request sent for medical history of patient: ${patientId}`);
    setRequestSent(true);
    setPatientId('');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Request Medical History</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Patient ID or Name"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          style={{ padding: '8px', width: '250px', marginRight: '10px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Request</button>
      </form>

      {requestSent && (
        <p style={{ color: 'green', marginTop: '15px' }}>
          Request has been sent successfully.
        </p>
      )}
    </div>
  );
};

export default DoctorReqForMedicalHistory;
