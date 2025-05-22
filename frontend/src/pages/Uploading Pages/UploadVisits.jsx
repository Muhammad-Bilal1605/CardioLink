import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const UploadVisits = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labResults, setLabResults] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [medications, setMedications] = useState([]);
  const [currentMedication, setCurrentMedication] = useState({
    name: '',
    dosage: '',
    frequency: '',
    startDate: '',
    endDate: '',
    prescribedBy: '',
    reason: '',
    status: 'Active',
    sideEffects: [],
    notes: ''
  });
  const [newSideEffect, setNewSideEffect] = useState('');

  const [formData, setFormData] = useState({
    patientId: patientId,
    date: '',
    type: '',
    provider: '',
    reason: '',
    diagnosis: '',
    treatment: '',
    followUpDate: '',
    status: 'scheduled',
    documents: [],
    images: [],
    associatedLabResults: [],
    associatedImaging: [],
    prescribedMedicines: []
  });

  // Fetch available lab results and imaging for this patient
  useEffect(() => {
    const fetchAssociatedData = async () => {
      try {
        const [labRes, imgRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/lab-results/patient/${patientId}`),
          axios.get(`http://localhost:5000/api/imaging/patient/${patientId}`)
        ]);
        
        setLabResults(labRes.data.data || []);
        setImaging(imgRes.data.data || []);
      } catch (err) {
        console.error('Error fetching associated data:', err);
      }
    };
    
    fetchAssociatedData();
  }, [patientId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e, type) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      [type]: [...prev[type], ...files]
    }));
  };

  const removeFile = (index, type) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleMultiSelect = (e, field) => {
    const options = e.target.options;
    const values = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        values.push(options[i].value);
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: values
    }));
  };

  const handleMedicationChange = (e) => {
    const { name, value } = e.target;
    setCurrentMedication(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addMedication = () => {
    if (currentMedication.name && currentMedication.dosage && currentMedication.frequency) {
      setMedications(prev => [...prev, currentMedication]);
      setFormData(prev => ({
        ...prev,
        prescribedMedicines: [...prev.prescribedMedicines, currentMedication]
      }));
      setCurrentMedication({
        name: '',
        dosage: '',
        frequency: '',
        startDate: '',
        endDate: '',
        prescribedBy: '',
        reason: '',
        status: 'Active',
        sideEffects: [],
        notes: ''
      });
      setNewSideEffect('');
    }
  };

  const removeMedication = (index) => {
    setMedications(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      prescribedMedicines: prev.prescribedMedicines.filter((_, i) => i !== index)
    }));
  };

  const addSideEffect = () => {
    if (newSideEffect.trim()) {
      setCurrentMedication(prev => ({
        ...prev,
        sideEffects: [...prev.sideEffects, newSideEffect.trim()]
      }));
      setNewSideEffect('');
    }
  };

  const removeSideEffect = (index) => {
    setCurrentMedication(prev => ({
      ...prev,
      sideEffects: prev.sideEffects.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Format dates properly
      const visitDate = new Date(formData.date);
      if (isNaN(visitDate.getTime())) {
        throw new Error('Invalid visit date');
      }

      const followUpDate = formData.followUpDate ? new Date(formData.followUpDate) : null;
      if (followUpDate && isNaN(followUpDate.getTime())) {
        throw new Error('Invalid follow-up date');
      }

      // Create FormData
      const formDataToSend = new FormData();
      
      // Add all required fields
      formDataToSend.append('patientId', patientId);
      formDataToSend.append('date', visitDate.toISOString());
      formDataToSend.append('type', formData.type);
      formDataToSend.append('provider', formData.provider);
      formDataToSend.append('reason', formData.reason);
      formDataToSend.append('status', formData.status);

      // Add optional fields if they exist
      if (formData.diagnosis) {
        formDataToSend.append('diagnosis', formData.diagnosis);
        }
      if (formData.treatment) {
        formDataToSend.append('treatment', formData.treatment);
      }
      if (followUpDate) {
        formDataToSend.append('followUpDate', followUpDate.toISOString());
      }

      // Add arrays
      if (formData.associatedLabResults.length > 0) {
        formData.associatedLabResults.forEach(id => {
          formDataToSend.append('associatedLabResults', id);
        });
      }
      
      if (formData.associatedImaging.length > 0) {
        formData.associatedImaging.forEach(id => {
          formDataToSend.append('associatedImaging', id);
        });
      }

      // Add prescribedMedicines
      if (formData.prescribedMedicines.length > 0) {
        formDataToSend.append('prescribedMedicines', JSON.stringify(formData.prescribedMedicines));
      }

      // Add files
      formData.documents.forEach(file => {
        formDataToSend.append('documents', file);
      });

      formData.images.forEach(file => {
        formDataToSend.append('images', file);
      });

      // Log the data being sent
      console.log('Sending form data:', {
        patientId,
        date: visitDate.toISOString(),
        type: formData.type,
        provider: formData.provider,
        reason: formData.reason,
        status: formData.status
      });

      // Log the actual FormData contents
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ' + pair[1]);
      }

      const response = await axios.post('http://localhost:5000/api/visits', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        navigate(`/patient/${patientId}`);
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.response?.data?.error || 'An error occurred while uploading the visit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Visit Details</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select Type</option>
              <option value="routine">Routine Checkup</option>
              <option value="followup">Follow-up</option>
              <option value="emergency">Emergency</option>
              <option value="specialist">Specialist Consultation</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Provider</label>
            <input
              type="text"
              name="provider"
              value={formData.provider}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no-show">No Show</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Reason for Visit</label>
          <textarea
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Diagnosis</label>
          <textarea
            name="diagnosis"
            value={formData.diagnosis}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Treatment</label>
          <textarea
            name="treatment"
            value={formData.treatment}
            onChange={handleChange}
            rows="3"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Follow-up Date</label>
          <input
            type="date"
            name="followUpDate"
            value={formData.followUpDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Associated Lab Results</label>
          <select
            multiple
            value={formData.associatedLabResults}
            onChange={(e) => handleMultiSelect(e, 'associatedLabResults')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-32"
          >
            {labResults.map((lab) => (
              <option key={lab._id} value={lab._id}>
                {new Date(lab.date).toLocaleDateString()} - {lab.testName}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Associated Imaging</label>
          <select
            multiple
            value={formData.associatedImaging}
            onChange={(e) => handleMultiSelect(e, 'associatedImaging')}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 h-32"
          >
            {imaging.map((img) => (
              <option key={img._id} value={img._id}>
                {new Date(img.date).toLocaleDateString()} - {img.imagingType}
              </option>
            ))}
          </select>
          <p className="text-sm text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Documents</label>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileChange(e, 'documents')}
            accept=".pdf,.doc,.docx"
            className="mt-1 block w-full"
          />
          <div className="mt-2 space-y-2">
            {formData.documents.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index, 'documents')}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Images</label>
          <input
            type="file"
            multiple
            onChange={(e) => handleFileChange(e, 'images')}
            accept="image/*"
            className="mt-1 block w-full"
          />
          <div className="mt-2 space-y-2">
            {formData.images.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <span className="text-sm">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index, 'images')}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Medications Section */}
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Prescribed Medications</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Medication Name</label>
                <input
                  type="text"
                  name="name"
                  value={currentMedication.name}
                  onChange={handleMedicationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Dosage</label>
                <input
                  type="text"
                  name="dosage"
                  value={currentMedication.dosage}
                  onChange={handleMedicationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Frequency</label>
                <select
                  name="frequency"
                  value={currentMedication.frequency}
                  onChange={handleMedicationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Select frequency</option>
                  <option value="Once daily">Once daily</option>
                  <option value="Twice daily">Twice daily</option>
                  <option value="Three times daily">Three times daily</option>
                  <option value="Four times daily">Four times daily</option>
                  <option value="Every 6 hours">Every 6 hours</option>
                  <option value="Every 8 hours">Every 8 hours</option>
                  <option value="Every 12 hours">Every 12 hours</option>
                  <option value="As needed">As needed</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prescribed By</label>
                <input
                  type="text"
                  name="prescribedBy"
                  value={currentMedication.prescribedBy}
                  onChange={handleMedicationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={currentMedication.startDate}
                  onChange={handleMedicationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={currentMedication.endDate}
                  onChange={handleMedicationChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason</label>
              <textarea
                name="reason"
                value={currentMedication.reason}
                onChange={handleMedicationChange}
                rows="2"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Side Effects</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSideEffect}
                  onChange={(e) => setNewSideEffect(e.target.value)}
                  placeholder="Enter side effect"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={addSideEffect}
                  className="mt-1 px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add
                </button>
              </div>
              {currentMedication.sideEffects.length > 0 && (
                <div className="mt-2">
                  <ul className="space-y-1">
                    {currentMedication.sideEffects.map((effect, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span>{effect}</span>
                        <button
                          type="button"
                          onClick={() => removeSideEffect(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={currentMedication.notes}
                onChange={handleMedicationChange}
                rows="2"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              onClick={addMedication}
              className="w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Add Medication
            </button>
          </div>

          {/* List of added medications */}
          {medications.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-2">Added Medications</h3>
              <div className="space-y-2">
                {medications.map((med, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                    <div>
                      <p className="font-medium">{med.name}</p>
                      <p className="text-sm text-gray-600">{med.dosage} - {med.frequency}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/patient/${patientId}`)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Upload Visit'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadVisits; 