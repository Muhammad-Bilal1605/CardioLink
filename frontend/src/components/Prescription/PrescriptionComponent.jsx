// PrescriptionComponent.jsx - Updated
import React, { useState, useEffect } from 'react';
import './PrescriptionComponent.css';

const PrescriptionComponent = ({ patientName, onSavePrescription, onClose, isLoading = false }) => {
  const [prescription, setPrescription] = useState({
    patientName: patientName || '',
    date: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: '',
    medicines: [],
    tests: [],
    advice: '',
    followUpDate: '',
    doctorNotes: ''
  });

  const [currentMedicine, setCurrentMedicine] = useState({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: ''
  });

  const [currentTest, setCurrentTest] = useState('');

  // Update patient name when prop changes
  useEffect(() => {
    if (patientName) {
      setPrescription(prev => ({
        ...prev,
        patientName: patientName
      }));
    }
  }, [patientName]);

  const addMedicine = () => {
    if (currentMedicine.name.trim()) {
      setPrescription(prev => ({
        ...prev,
        medicines: [...prev.medicines, { ...currentMedicine, id: Date.now() }]
      }));
      setCurrentMedicine({
        name: '',
        dosage: '',
        frequency: '',
        duration: '',
        instructions: ''
      });
    }
  };

  const removeMedicine = (id) => {
    setPrescription(prev => ({
      ...prev,
      medicines: prev.medicines.filter(med => med.id !== id)
    }));
  };

  const addTest = () => {
    if (currentTest.trim()) {
      setPrescription(prev => ({
        ...prev,
        tests: [...prev.tests, { name: currentTest, id: Date.now() }]
      }));
      setCurrentTest('');
    }
  };

  const removeTest = (id) => {
    setPrescription(prev => ({
      ...prev,
      tests: prev.tests.filter(test => test.id !== id)
    }));
  };

  const handleSave = () => {
    if (!prescription.patientName.trim()) {
      alert('Please enter patient name');
      return;
    }

    if (!prescription.diagnosis.trim()) {
      alert('Please enter diagnosis');
      return;
    }

    // Call the parent save function
    onSavePrescription(prescription);
  };

  const handleKeyPress = (e, type) => {
    if (e.key === 'Enter') {
      if (type === 'medicine') {
        addMedicine();
      } else if (type === 'test') {
        addTest();
      }
    }
  };

  return (
    <div className="prescription-container">
      <div className="prescription-header">
        <h2>Medical Prescription</h2>
        <div className="header-actions">
          <button 
            className="btn-secondary" 
            onClick={onClose}
            disabled={isLoading}
          >
            Close
          </button>
          <button 
            className="btn-primary" 
            onClick={handleSave}
            disabled={isLoading || !prescription.patientName.trim() || !prescription.diagnosis.trim()}
          >
            {isLoading ? 'Generating PDF...' : 'Download PDF Prescription'}
          </button>
        </div>
      </div>

      <div className="prescription-form">
        {/* Patient Information */}
        <div className="form-section">
          <h3>Patient Information</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Patient Name *</label>
              <input
                type="text"
                value={prescription.patientName}
                onChange={(e) => setPrescription(prev => ({ ...prev, patientName: e.target.value }))}
                placeholder="Enter patient name"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={prescription.date}
                onChange={(e) => setPrescription(prev => ({ ...prev, date: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        {/* Diagnosis & Symptoms */}
        <div className="form-section">
          <h3>Medical Assessment</h3>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Diagnosis *</label>
              <input
                type="text"
                value={prescription.diagnosis}
                onChange={(e) => setPrescription(prev => ({ ...prev, diagnosis: e.target.value }))}
                placeholder="Enter diagnosis"
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label>Symptoms & Observations</label>
            <textarea
              value={prescription.symptoms}
              onChange={(e) => setPrescription(prev => ({ ...prev, symptoms: e.target.value }))}
              placeholder="Describe symptoms and clinical observations"
              rows="3"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Medicines Section */}
        <div className="form-section">
          <h3>Medications</h3>
          <div className="medicine-form">
            <div className="form-row">
              <div className="form-group">
                <label>Medicine Name</label>
                <input
                  type="text"
                  value={currentMedicine.name}
                  onChange={(e) => setCurrentMedicine(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Medicine name"
                  onKeyPress={(e) => handleKeyPress(e, 'medicine')}
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Dosage</label>
                <input
                  type="text"
                  value={currentMedicine.dosage}
                  onChange={(e) => setCurrentMedicine(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 500mg"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Frequency</label>
                <input
                  type="text"
                  value={currentMedicine.frequency}
                  onChange={(e) => setCurrentMedicine(prev => ({ ...prev, frequency: e.target.value }))}
                  placeholder="e.g., Once daily"
                  disabled={isLoading}
                />
              </div>
              <div className="form-group">
                <label>Duration</label>
                <input
                  type="text"
                  value={currentMedicine.duration}
                  onChange={(e) => setCurrentMedicine(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 7 days"
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="form-group full-width">
              <label>Instructions</label>
              <input
                type="text"
                value={currentMedicine.instructions}
                onChange={(e) => setCurrentMedicine(prev => ({ ...prev, instructions: e.target.value }))}
                placeholder="Special instructions"
                disabled={isLoading}
              />
            </div>
            <button 
              type="button" 
              className="btn-add" 
              onClick={addMedicine}
              disabled={isLoading || !currentMedicine.name.trim()}
            >
              Add Medicine
            </button>
          </div>

          {/* Medicine List */}
          {prescription.medicines.length > 0 && (
            <div className="medicine-list">
              <h4>Prescribed Medicines</h4>
              {prescription.medicines.map(medicine => (
                <div key={medicine.id} className="medicine-item">
                  <div className="medicine-info">
                    <strong>{medicine.name}</strong>
                    <span>{medicine.dosage} - {medicine.frequency} - {medicine.duration}</span>
                    {medicine.instructions && <small>Instructions: {medicine.instructions}</small>}
                  </div>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeMedicine(medicine.id)}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tests Section */}
        <div className="form-section">
          <h3>Recommended Tests</h3>
          <div className="test-form">
            <div className="form-row">
              <div className="form-group full-width">
                <input
                  type="text"
                  value={currentTest}
                  onChange={(e) => setCurrentTest(e.target.value)}
                  placeholder="Enter test name"
                  onKeyPress={(e) => handleKeyPress(e, 'test')}
                  disabled={isLoading}
                />
              </div>
              <button 
                type="button" 
                className="btn-add" 
                onClick={addTest}
                disabled={isLoading || !currentTest.trim()}
              >
                Add Test
              </button>
            </div>
          </div>

          {/* Test List */}
          {prescription.tests.length > 0 && (
            <div className="test-list">
              <h4>Recommended Tests</h4>
              {prescription.tests.map(test => (
                <div key={test.id} className="test-item">
                  <span>{test.name}</span>
                  <button
                    type="button"
                    className="btn-remove"
                    onClick={() => removeTest(test.id)}
                    disabled={isLoading}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Advice & Follow-up Section */}
        <div className="form-section">
          <h3>Medical Advice & Follow-up</h3>
          <div className="form-group full-width">
            <label>Medical Advice</label>
            <textarea
              value={prescription.advice}
              onChange={(e) => setPrescription(prev => ({ ...prev, advice: e.target.value }))}
              placeholder="Provide medical advice and lifestyle recommendations"
              rows="3"
              disabled={isLoading}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Follow-up Date</label>
              <input
                type="date"
                value={prescription.followUpDate}
                onChange={(e) => setPrescription(prev => ({ ...prev, followUpDate: e.target.value }))}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="form-group full-width">
            <label>Doctor's Notes</label>
            <textarea
              value={prescription.doctorNotes}
              onChange={(e) => setPrescription(prev => ({ ...prev, doctorNotes: e.target.value }))}
              placeholder="Additional notes and observations"
              rows="3"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="prescription-actions">
        <button 
          className="btn-secondary" 
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </button>
        <button 
          className="btn-primary" 
          onClick={handleSave}
          disabled={isLoading || !prescription.patientName.trim() || !prescription.diagnosis.trim()}
        >
          {isLoading ? 'Generating PDF...' : 'Download PDF Prescription'}
        </button>
      </div>
    </div>
  );
};

export default PrescriptionComponent;