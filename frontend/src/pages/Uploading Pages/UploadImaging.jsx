import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';

const UploadImaging = () => {
  const navigate = useNavigate();
  const { getActivePatientId } = usePatient();
  const patientId = getActivePatientId();

  const [formData, setFormData] = useState({
    type: '',
    date: '',
    facility: '',
    doctor: '',
    description: '',
    findings: '',
    image: null
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

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('patientId', patientId);
      data.append('type', formData.type);
      data.append('date', formData.date);
      data.append('facility', formData.facility);
      data.append('doctor', formData.doctor);
      data.append('description', formData.description);
      data.append('findings', formData.findings);
      if (formData.image) {
        data.append('image', formData.image);
      }

      const response = await axios.post('http://localhost:5000/api/imaging', data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage('Imaging uploaded successfully!');
        setFormData({
          type: '',
          date: '',
          facility: '',
          doctor: '',
          description: '',
          findings: '',
          image: null
        });
      }
    } catch (error) {
      console.error(error.response || error);
      setMessage(error.response?.data?.message || 'Error uploading imaging');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    const requiredFields = ['type', 'date', 'facility', 'doctor', 'description', 'findings'];
    const filledFields = requiredFields.filter(field => formData[field] !== '');
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Upload Medical Imaging</h1>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Imaging Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select type</option>
                <option value="X-Ray">X-Ray</option>
                <option value="MRI">MRI</option>
                <option value="CT Scan">CT Scan</option>
                <option value="Ultrasound">Ultrasound</option>
                <option value="Mammogram">Mammogram</option>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Enter a detailed description of the imaging study"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
            <textarea
              name="findings"
              value={formData.findings}
              onChange={handleChange}
              required
              rows="3"
              placeholder="Enter the findings from the imaging study"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all cursor-pointer">
                <div className="flex flex-col items-center justify-center pt-7">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                    {formData.image ? formData.image.name : 'Attach an image file'}
                  </p>
                </div>
                <input 
                  type="file" 
                  name="image" 
                  onChange={handleFileChange} 
                  required 
                  accept="image/*" 
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
              ) : 'Upload Imaging'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UploadImaging; 