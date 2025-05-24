import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { usePatient } from '../../context/PatientContext';

const UploadProcedures = () => {
  const navigate = useNavigate();
  const { getActivePatientId } = usePatient();
  const patientId = getActivePatientId();

  const [formData, setFormData] = useState({
    procedureName: '',
    date: '',
    hospital: '',
    physician: '',
    indication: '',
    findings: '',
    complications: '',
    followUpPlan: '',
    status: 'Scheduled',
  });
  const [documents, setDocuments] = useState([]);
  const [images, setImages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect to patient list if no patient is selected
  useEffect(() => {
    if (!patientId) {
      console.log('No patient selected, redirecting to patient procedures list');
      navigate('/patient-procedures');
      return;
    }
  }, [patientId, navigate]);

  // Return early if no patient is selected
  if (!patientId) {
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    if (type === 'documents') {
      setDocuments(prev => [...prev, ...files]);
    } else {
      setImages(prev => [...prev, ...files]);
    }
    setMessage(`${files.length} ${type} selected`);
  };

  const removeFile = (index, type) => {
    if (type === 'documents') {
      setDocuments(prev => prev.filter((_, i) => i !== index));
    } else {
      setImages(prev => prev.filter((_, i) => i !== index));
    }
    setMessage(`${type.slice(0, -1)} removed`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add patientId and form fields
      formDataToSend.append('patientId', patientId);
      
      // Append all other form fields
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      // Append documents
      documents.forEach((file, index) => {
        formDataToSend.append('documents', file);
      });

      // Append images
      images.forEach((file, index) => {
        formDataToSend.append('images', file);
      });

      // Log what we're sending (for debugging)
      console.log('Submitting form data...');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}: ${value instanceof File ? value.name : value}`);
      }

      const response = await axios.post('http://localhost:5000/api/procedures', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.data.success) {
        setMessage('Procedure uploaded successfully!');
        setFormData({
          procedureName: '',
          date: '',
          hospital: '',
          physician: '',
          indication: '',
          findings: '',
          complications: '',
          followUpPlan: '',
          status: 'Scheduled',
        });
        setDocuments([]);
        setImages([]);
        // Navigate back to patient procedures list after successful upload
        setTimeout(() => {
          navigate('/patient-procedures');
        }, 2000);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage(error.response?.data?.error || 'Error uploading procedure. Please check file formats and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const calculateProgress = () => {
    const requiredFields = ['procedureName', 'date', 'hospital', 'physician', 'indication'];
    const filledFields = requiredFields.filter(field => formData[field] !== '');
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Upload Medical Procedure</h1>
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
              {message.includes('success') ? 'Success' : 'Note'}
            </p>
            <p>{message}</p>
                  </div>
                )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Procedure Name</label>
                    <input
                      type="text"
                      name="procedureName"
                      value={formData.procedureName}
                      onChange={handleChange}
                      required
                placeholder="Enter procedure name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Hospital</label>
                    <input
                      type="text"
                      name="hospital"
                      value={formData.hospital}
                      onChange={handleChange}
                      required
                placeholder="Enter hospital name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Physician</label>
                    <input
                      type="text"
                      name="physician"
                      value={formData.physician}
                      onChange={handleChange}
                      required
                placeholder="Enter physician name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
                  </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Indication</label>
                    <textarea
                      name="indication"
                      value={formData.indication}
                      onChange={handleChange}
                      required
                      rows="3"
              placeholder="Enter the reason for this procedure"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Findings</label>
                    <textarea
                      name="findings"
                      value={formData.findings}
                      onChange={handleChange}
                      rows="3"
              placeholder="Enter the findings from the procedure"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Complications</label>
                    <textarea
                      name="complications"
                      value={formData.complications}
                      onChange={handleChange}
              rows="2"
              placeholder="Enter any complications (if applicable)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Follow-Up Plan</label>
                    <textarea
                      name="followUpPlan"
                      value={formData.followUpPlan}
                      onChange={handleChange}
              rows="2"
              placeholder="Enter follow-up instructions"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Documents</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-7">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                      Upload procedure documents
                    </p>
                  </div>
                    <input
                      type="file"
                    multiple 
                      onChange={(e) => handleFileChange(e, 'documents')}
                    className="opacity-0" 
                    />
                </label>
              </div>
                    {documents.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Documents:</h4>
                  <ul className="space-y-2">
                          {documents.map((doc, index) => (
                      <li key={index} className="flex items-center justify-between bg-white p-2 rounded-md border border-gray-200">
                        <span className="text-sm truncate max-w-xs">{doc.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(index, 'documents')}
                          className="text-red-500 hover:text-red-700"
                              >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <label className="block text-sm font-medium text-gray-700 mb-2">Upload Images</label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-all cursor-pointer">
                  <div className="flex flex-col items-center justify-center pt-7">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-400 group-hover:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="pt-1 text-sm tracking-wider text-gray-400 group-hover:text-gray-600">
                      Upload procedure images
                    </p>
                  </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                    onChange={(e) => handleFileChange(e, 'images')} 
                    className="opacity-0" 
                    />
                </label>
              </div>
                    {images.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Images:</h4>
                  <div className="grid grid-cols-2 gap-2">
                          {images.map((img, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={URL.createObjectURL(img)} 
                          alt={`Preview ${index}`} 
                          className="h-20 w-full object-cover rounded-md" 
                        />
                              <button
                                type="button"
                                onClick={() => removeFile(index, 'images')}
                          className="absolute top-1 right-1 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                              </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
                  </div>

          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => navigate('/patient-procedures')}
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
              ) : 'Upload Procedure'}
                    </button>
                  </div>
                </form>
      </div>
    </div>
  );
};

export default UploadProcedures; 