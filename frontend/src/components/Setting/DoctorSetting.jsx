import React, { useState } from 'react';

const DoctorSetting = () => {
  const [formData, setFormData] = useState({
    name: 'Dr. John Doe',
    email: 'johndoe@example.com',
    specialization: 'Cardiologist',
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setSaved(false);
  };

  const handleSave = () => {
    console.log('Saved settings:', formData);
    setSaved(true);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: 'auto' }}>
      <h2>Doctor Settings</h2>
      <label>
        Name:
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
      </label>

      <label>
        Email:
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
      </label>

      <label>
        Specialization:
        <input
          type="text"
          name="specialization"
          value={formData.specialization}
          onChange={handleChange}
          style={{ width: '100%', marginBottom: '10px', padding: '8px' }}
        />
      </label>

      <button onClick={handleSave} style={{ padding: '10px 20px' }}>Save</button>

      {saved && <p style={{ color: 'green', marginTop: '10px' }}>Settings saved successfully!</p>}
    </div>
  );
};

export default DoctorSetting;
