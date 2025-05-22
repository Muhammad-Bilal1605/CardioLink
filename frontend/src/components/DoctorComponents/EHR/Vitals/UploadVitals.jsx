import React, { useState } from 'react';
import axios from 'axios';

const VitalTypeOptions = [
  { value: 'blood_pressure', label: 'Blood Pressure' },
  { value: 'heart_rate', label: 'Heart Rate' },
  { value: 'respiratory_rate', label: 'Respiratory Rate' },
  { value: 'temperature', label: 'Temperature' },
  { value: 'oxygen_saturation', label: 'Oxygen Saturation' },
  { value: 'weight', label: 'Weight' },
  { value: 'height', label: 'Height' },
  { value: 'blood_glucose', label: 'Blood Glucose' }
];

// Validation ranges for vital signs
const validationRanges = {
  blood_pressure: {
    systolic: { min: 60, max: 250 },
    diastolic: { min: 40, max: 150 }
  },
  heart_rate: { min: 30, max: 220 },
  respiratory_rate: { min: 8, max: 40 },
  temperature: { min: 34, max: 42 },
  oxygen_saturation: { min: 70, max: 100 },
  weight: { min: 1, max: 500 },
  height: { min: 30, max: 250 },
  blood_glucose: { min: 30, max: 500 }
};

const UploadVitals = ({ patientId, onSuccess }) => {
  const [formData, setFormData] = useState({
    vitalType: 'blood_pressure',
    value: '',
    unit: 'mmHg',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().split(' ')[0].slice(0, 5),
    notes: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  
  // Set default unit based on vital type
  const getDefaultUnit = (vitalType) => {
    switch (vitalType) {
      case 'blood_pressure':
        return 'mmHg';
      case 'heart_rate':
      case 'respiratory_rate':
        return 'bpm';
      case 'temperature':
        return '°C';
      case 'oxygen_saturation':
        return '%';
      case 'weight':
        return 'kg';
      case 'height':
        return 'cm';
      case 'blood_glucose':
        return 'mg/dL';
      default:
        return '';
    }
  };
  
  // Change form field handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'vitalType') {
      setFormData({
        ...formData,
        [name]: value,
        unit: getDefaultUnit(value),
        value: '' // Reset value when type changes
      });
      setValidationError(null);
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
      
      // Validate value when it changes
      if (name === 'value') {
        validateValue(value, formData.vitalType);
      }
    }
  };
  
  // Validate vital sign values
  const validateValue = (value, vitalType) => {
    setValidationError(null);
    
    if (!value) return;
    
    if (vitalType === 'blood_pressure') {
      if (!value.includes('/')) {
        setValidationError('Blood pressure must be in format systolic/diastolic (e.g., 120/80)');
        return;
      }
      
      const [systolic, diastolic] = value.split('/').map(v => parseInt(v.trim()));
      
      if (isNaN(systolic) || isNaN(diastolic)) {
        setValidationError('Blood pressure values must be numbers');
        return;
      }
      
      const { systolic: sysRange, diastolic: diaRange } = validationRanges.blood_pressure;
      
      if (systolic < sysRange.min || systolic > sysRange.max) {
        setValidationError(`Systolic value must be between ${sysRange.min} and ${sysRange.max}`);
        return;
      }
      
      if (diastolic < diaRange.min || diastolic > diaRange.max) {
        setValidationError(`Diastolic value must be between ${diaRange.min} and ${diaRange.max}`);
        return;
      }
      
      if (diastolic >= systolic) {
        setValidationError('Systolic value must be higher than diastolic value');
        return;
      }
    } else {
      const numValue = parseFloat(value);
      
      if (isNaN(numValue)) {
        setValidationError('Value must be a number');
        return;
      }
      
      const range = validationRanges[vitalType];
      if (range && (numValue < range.min || numValue > range.max)) {
        setValidationError(`Value must be between ${range.min} and ${range.max} ${formData.unit}`);
        return;
      }
    }
  };
  
  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!patientId) {
      setError('Patient ID is required');
      return;
    }
    
    // Validate the value
    validateValue(formData.value, formData.vitalType);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Get datetime from form data
      const dateTime = `${formData.date}T${formData.time}:00`;
      
      // Create base data object
      const vitalData = {
        patientId,
        date: dateTime,
        notes: formData.notes,
        recordedBy: 'System User' // Adding required field
      };
      
      // Add specific vital sign data based on type
      if (formData.vitalType === 'blood_pressure' && formData.value.includes('/')) {
        const [systolic, diastolic] = formData.value.split('/').map(v => parseInt(v.trim()));
        vitalData.bloodPressure = {
          systolic,
          diastolic,
          unit: 'mmHg'
        };
      } else {
        // Handle other vital types
        const vitalField = {
          heart_rate: 'heartRate',
          respiratory_rate: 'respiratoryRate',
          temperature: 'temperature',
          oxygen_saturation: 'oxygenSaturation',
          weight: 'weight',
          height: 'height',
          blood_glucose: 'bloodGlucose'
        }[formData.vitalType];
        
        if (vitalField) {
          vitalData[vitalField] = {
            value: parseFloat(formData.value),
            unit: formData.unit
          };
        }
      }
      
      // Make API request
      const response = await axios.post(
        'http://localhost:5000/api/vital-signs', 
        vitalData,
        { headers: { 'Content-Type': 'application/json' }}
      );
      
      if (response.data.success) {
        setSuccess(true);
        // Reset form after successful submission
        setFormData({
          ...formData,
          value: '',
          notes: ''
        });
        
        // Call onSuccess callback if provided
        if (typeof onSuccess === 'function') {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(response.data.message || 'Failed to save vital sign');
      }
    } catch (err) {
      console.error('Error uploading vital sign:', err);
      setError(err.response?.data?.message || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancel = () => {
    setFormData({
      vitalType: 'blood_pressure',
      value: '',
      unit: getDefaultUnit('blood_pressure'),
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].slice(0, 5),
      notes: ''
    });
    setError(null);
    setValidationError(null);
    setSuccess(false);
  };
  
  const getPlaceholder = () => {
    switch (formData.vitalType) {
      case 'blood_pressure':
        return 'e.g., 120/80';
      case 'heart_rate':
        return 'e.g., 75';
      case 'respiratory_rate':
        return 'e.g., 16';
      case 'temperature':
        return 'e.g., 37.2';
      case 'oxygen_saturation':
        return 'e.g., 98';
      case 'weight':
        return 'e.g., 70.5';
      case 'height':
        return 'e.g., 175';
      case 'blood_glucose':
        return 'e.g., 95';
      default:
        return 'Enter value';
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 w-full max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-green-800 mb-4">Upload Vital Signs</h2>
      
      {success && (
        <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
          Vital sign uploaded successfully!
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
      
      {validationError && !error && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          Warning: {validationError}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Vital Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vital Type*
            </label>
            <select
              name="vitalType"
              value={formData.vitalType}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              {VitalTypeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Value and Unit */}
          <div className="flex space-x-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value*
              </label>
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleChange}
                placeholder={getPlaceholder()}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div className="w-24">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit
              </label>
              <input
                type="text"
                name="unit"
                value={formData.unit}
                readOnly
                className="w-full p-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
              />
            </div>
          </div>
          
          {/* Date and Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date*
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Time*
            </label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
        </div>
        
        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows="3"
            placeholder="Any additional information about this measurement"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        {/* Submit buttons */}
        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || validationError}
            className={`px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 ${
              (loading || validationError) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Saving...' : 'Save Vital Sign'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadVitals; 