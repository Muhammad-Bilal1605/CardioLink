import React from 'react';

const DoctorPrescriptions = () => {
  const prescriptions = [
    {
      id: 1,
      patientName: 'John Doe',
      medicine: 'Paracetamol 500mg',
      notes: 'Take twice a day after meals.',
    },
    {
      id: 2,
      patientName: 'Jane Smith',
      medicine: 'Ibuprofen 200mg',
      notes: 'Take once a day before bedtime.',
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h2>Doctor's Prescriptions</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {prescriptions.map((prescription) => (
          <li key={prescription.id} style={{ border: '1px solid #ccc', marginBottom: '10px', padding: '10px' }}>
            <p><strong>Patient:</strong> {prescription.patientName}</p>
            <p><strong>Medicine:</strong> {prescription.medicine}</p>
            <p><strong>Notes:</strong> {prescription.notes}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DoctorPrescriptions;
