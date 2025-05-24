import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';

const UploadLabResults = () => {
  const navigate = useNavigate();
  const { getActivePatientId } = usePatient();
  const patientId = getActivePatientId();

  const [formData, setFormData] = useState({
    testName: '',
    testType: '',
    date: '',
    facility: '',
    doctor: '',
    results: [{
      parameter: '',
      value: '',
      unit: '',
      referenceRange: '',
      status: 'Normal'
    }],
    status: 'Pending',
    notes: '',
    document: null
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to patient list if no patient is selected
  useEffect(() => {
    if (!patientId) {
      console.log('No patient selected, redirecting to patient list');
      navigate('/patients');
      return;
    }
  }, [patientId, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResultChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      results: prev.results.map((result, i) => 
        i === index ? { ...result, [field]: value } : result
      )
    }));
  };

  const addResult = () => {
    setFormData(prev => ({
      ...prev,
      results: [...prev.results, {
        parameter: '',
        value: '',
        unit: '',
        referenceRange: '',
        status: 'Normal'
      }]
    }));
  };

  const removeResult = (index) => {
    if (formData.results.length > 1) {
    setFormData(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index)
    }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      document: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('patientId', patientId);
      data.append('testName', formData.testName);
      data.append('testType', formData.testType);
      data.append('date', formData.date);
      data.append('facility', formData.facility);
      data.append('doctor', formData.doctor);
      data.append('results', JSON.stringify(formData.results));
      data.append('status', formData.status);
      data.append('notes', formData.notes);
      if (formData.document) {
        data.append('document', formData.document);
      }

      const response = await axios.post('http://localhost:5000/api/lab-results', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage('Lab results uploaded successfully!');
        setFormData({
          testName: '',
          testType: '',
          date: '',
          facility: '',
          doctor: '',
          results: [{
            parameter: '',
            value: '',
            unit: '',
            referenceRange: '',
            status: 'Normal'
          }],
          status: 'Pending',
          notes: '',
          document: null
        });
      }
    } catch (error) {
      console.error(error.response || error);
      setMessage(error.response?.data?.message || 'Error uploading lab results');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    const requiredFields = ['testName', 'testType', 'date', 'facility', 'doctor'];
    const filledFields = requiredFields.filter(field => formData[field] !== '');
    
    // Check if at least one result has parameter and value filled
    const hasValidResult = formData.results.some(result => 
      result.parameter.trim() !== '' && result.value.trim() !== ''
    );
    
    const totalFields = requiredFields.length + (hasValidResult ? 1 : 0);
    const filledTotal = filledFields.length + (hasValidResult ? 1 : 0);
    
    return Math.round((filledTotal / totalFields) * 100);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Upload Lab Results</h1>
          <div className="mt-2 flex items-center">
            <div className="w-full bg-white bg-opacity-30 rounded-full h-2.5">
              <div 
                className="bg-white h-2.5 rounded-full" 
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
            <span className="ml-3 text-sm">{calculateProgress()}% complete</span>
          </div>
        </div>

        {message && (
          <div className={`mx-6 mt-4 p-4 rounded-md ${message.includes('success') 
            ? 'bg-green-100 border-l-4 border-green-500 text-green-700' 
            : 'bg-red-100 border-l-4 border-red-500 text-red-700'}`}>
            <p className={message.includes('success') ? 'font-bold text-green-700' : 'font-bold text-red-700'}>
              {message.includes('success') ? 'Success' : 'Error'}
            </p>
            <p>{message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Name</label>
                    <input
                      type="text"
                      name="testName"
                      value={formData.testName}
                      onChange={handleChange}
                      required
                placeholder="Enter test name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Test Type</label>
                    <select
                      name="testType"
                      value={formData.testType}
                      onChange={handleChange}
                      required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select test type</option>
                      <option value="Blood Test">Blood Test</option>
                      <option value="Urine Test">Urine Test</option>
                      <option value="Stool Test">Stool Test</option>
                      <option value="Culture">Culture</option>
                      <option value="Biopsy">Biopsy</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Facility</label>
                    <input
                      type="text"
                      name="facility"
                      value={formData.facility}
                      onChange={handleChange}
                      required
                placeholder="Enter facility name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ordering Doctor</label>
                    <input
                      type="text"
                      name="doctor"
                      value={formData.doctor}
                      onChange={handleChange}
                      required
                placeholder="Enter doctor's name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-700">Test Results</h3>
              <button
                type="button"
                onClick={addResult}
                className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Result
              </button>
            </div>

            <div className="space-y-4">
              {formData.results.map((result, index) => (
                <div key={index} className="p-4 border rounded-md bg-white">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Result #{index + 1}</h4>
                    {formData.results.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeResult(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Parameter</label>
                            <input
                              type="text"
                              value={result.parameter}
                              onChange={(e) => handleResultChange(index, 'parameter', e.target.value)}
                              required
                        placeholder="e.g., Hemoglobin"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                            <input
                              type="text"
                              value={result.value}
                              onChange={(e) => handleResultChange(index, 'value', e.target.value)}
                              required
                        placeholder="e.g., 14.2"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                            <input
                              type="text"
                              value={result.unit}
                              onChange={(e) => handleResultChange(index, 'unit', e.target.value)}
                        placeholder="e.g., g/dL"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                          <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reference Range</label>
                            <input
                              type="text"
                              value={result.referenceRange}
                              onChange={(e) => handleResultChange(index, 'referenceRange', e.target.value)}
                        placeholder="e.g., 12.0-16.0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                          </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select
                              value={result.status}
                              onChange={(e) => handleResultChange(index, 'status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="Normal">Normal</option>
                        <option value="Abnormal">Abnormal</option>
                              <option value="Critical">Critical</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
            </div>
                  </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
              rows="3"
              placeholder="Enter any additional notes or observations"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Report Document (optional)</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-7">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                    {formData.document ? formData.document.name : 'Attach a document (PDF, DOC, etc.)'}
                  </p>
                </div>
                    <input
                      type="file"
                      name="document"
                      onChange={handleFileChange}
                  className="opacity-0" 
                    />
              </label>
            </div>
                  </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/ehr')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
                    <button
                      type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </>
              ) : 'Upload Lab Results'}
                    </button>
                  </div>
                </form>
      </div>
    </div>
  );
};

export default UploadLabResults; 