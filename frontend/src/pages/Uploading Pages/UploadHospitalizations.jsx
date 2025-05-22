import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// Components
import TabNavigation from '../../components/DoctorComponents/EHR/Hospitalizations/TabNavigation';
import BasicInfoTab from '../../components/DoctorComponents/EHR/Hospitalizations/BasicInfoTab';
import ClinicalDetailsTab from '../../components/DoctorComponents/EHR/Hospitalizations/ClinicalDetailsTab';
import ProceduresTab from '../../components/DoctorComponents/EHR/Hospitalizations/ProceduresTab';
import AssociationsTab from '../../components/DoctorComponents/EHR/Hospitalizations/AssociationsTab';
import DocumentsTab from '../../components/DoctorComponents/EHR/Hospitalizations/DocumentsTab';
import PreviewModal from '../../components/DoctorComponents/EHR/Modals/PreviewModal';

const UploadHospitalizations = () => {
  const { patientId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [labResults, setLabResults] = useState([]);
  const [imaging, setImaging] = useState([]);
  const [procedures, setProcedures] = useState([]);
  const [activeTab, setActiveTab] = useState('basicInfo');
  const [previewItem, setPreviewItem] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    patientId: patientId,
    date: '',
    hospital: '',
    reason: '',
    admissionType: '',
    attendingPhysician: '',
    proceduresDone: [],
    durationOfStay: '',
    outcome: '',
    dischargeSummary: '',
    status: 'Active',
    notes: '',
    associatedLabResults: [],
    associatedImaging: [],
    associatedProcedures: []
  });

  // Fetch available lab results, imaging, and procedures for this patient
  useEffect(() => {
    const fetchAssociatedData = async () => {
      try {
        const [labRes, imgRes, procRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/lab-results/patient/${patientId}`),
          axios.get(`http://localhost:5000/api/imaging/patient/${patientId}`),
          axios.get(`http://localhost:5000/api/procedures/patient/${patientId}`)
        ]);
        
        setLabResults(labRes.data.data || []);
        setImaging(imgRes.data.data || []);
        setProcedures(procRes.data.data || []);
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

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      dischargeReport: files[0]
    }));
  };

  const handlePreview = async (item, type) => {
    try {
      setPreviewLoading(true);
      
      // Create a copy of the item with the type property
      let previewData = { ...item, type };
      
      // Fetch full details for the item based on type
      if (type === 'lab' && item._id) {
        try {
          const response = await axios.get(`http://localhost:5000/api/lab-results/${item._id}`);
          if (response.data && response.data.success) {
            previewData = { ...response.data.data, type };
          }
        } catch (err) {
          console.error('Error fetching lab result details:', err);
        }
      } 
      else if (type === 'imaging' && item._id) {
        try {
          const response = await axios.get(`http://localhost:5000/api/imaging/${item._id}`);
          if (response.data && response.data.success) {
            previewData = { ...response.data.data, type };
          }
        } catch (err) {
          console.error('Error fetching imaging details:', err);
        }
      } 
      else if (type === 'procedure' && item._id) {
        try {
          const response = await axios.get(`http://localhost:5000/api/procedures/${item._id}`);
          if (response.data && response.data.success) {
            previewData = { ...response.data.data, type };
          }
        } catch (err) {
          console.error('Error fetching procedure details:', err);
        }
      }
      
      // Set the preview item and show the modal
      setPreviewItem(previewData);
    setShowPreviewModal(true);
    } catch (err) {
      console.error('Error preparing preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      
      // Append all form fields except arrays
      Object.keys(formData).forEach(key => {
        if (!Array.isArray(formData[key]) && key !== 'dischargeReport') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Handle arrays by converting to JSON strings
      formDataToSend.append('proceduresDone', JSON.stringify(formData.proceduresDone));
      formDataToSend.append('associatedLabResults', JSON.stringify(formData.associatedLabResults));
      formDataToSend.append('associatedImaging', JSON.stringify(formData.associatedImaging));
      formDataToSend.append('associatedProcedures', JSON.stringify(formData.associatedProcedures));

      // Append discharge report if exists
      if (formData.dischargeReport) {
        formDataToSend.append('dischargeReport', formData.dischargeReport);
      }

      const response = await axios.post('http://localhost:5000/api/hospitalizations', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        navigate(`/patient/${patientId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred while uploading the hospitalization record');
    } finally {
      setLoading(false);
    }
  };

  // Progress calculation
  const calculateProgress = () => {
    const requiredFields = ['date', 'hospital', 'reason', 'admissionType', 'attendingPhysician', 'durationOfStay', 'outcome', 'dischargeSummary'];
    const filledFields = requiredFields.filter(field => formData[field] !== '');
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
          <h1 className="text-2xl font-bold">Upload Hospitalization Record</h1>
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
        
        {error && (
          <div className="mx-6 mt-4 bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <form onSubmit={handleSubmit} className="p-6">
          {activeTab === 'basicInfo' && (
            <BasicInfoTab 
              formData={formData} 
              handleChange={handleChange} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'details' && (
            <ClinicalDetailsTab 
              formData={formData} 
              handleChange={handleChange} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'procedures' && (
            <ProceduresTab 
              formData={formData} 
              setFormData={setFormData} 
              setActiveTab={setActiveTab} 
            />
          )}

          {activeTab === 'associations' && (
            <AssociationsTab 
              formData={formData} 
              setFormData={setFormData} 
              setActiveTab={setActiveTab} 
              labResults={labResults} 
              imaging={imaging} 
              procedures={procedures} 
              handlePreview={handlePreview} 
            />
          )}

          {activeTab === 'documents' && (
            <DocumentsTab 
              formData={formData} 
              handleFileChange={handleFileChange} 
              setActiveTab={setActiveTab} 
              patientId={patientId} 
              loading={loading} 
              handleSubmit={handleSubmit}
            />
          )}
        </form>
      </div>
      
      {/* Preview Modal */}
      {showPreviewModal && (
        <PreviewModal 
          item={previewItem} 
          onClose={() => setShowPreviewModal(false)} 
        />
      )}
      
      {/* Loading Indicator for Preview */}
      {previewLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg shadow-lg flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <p>Loading preview...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadHospitalizations;