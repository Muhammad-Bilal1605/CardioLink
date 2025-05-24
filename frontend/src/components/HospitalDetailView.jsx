import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Calendar,
  User,
  FileText,
  Download,
  Check,
  X,
  AlertTriangle,
  Globe,
  Bed,
  Star,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import HospitalContactInfo from './HospitalContactInfo';
import HospitalDocuments from './HospitalDocuments';
import ApprovalActions from './ApprovalActions';

const HospitalDetailView = ({ hospital: initialHospital, onClose, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [hospital, setHospital] = useState(initialHospital);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch complete hospital data including documents
  useEffect(() => {
    const fetchCompleteHospitalData = async () => {
      if (!initialHospital?._id) return;
      
      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching complete hospital data for ID:', initialHospital._id);
        const response = await axios.get(`http://localhost:5000/api/hospitals/${initialHospital._id}`);
        
        if (response.data.success) {
          console.log('Complete hospital data received:', response.data.data);
          setHospital(response.data.data);
        } else {
          setError('Failed to fetch complete hospital data');
        }
      } catch (error) {
        console.error('Error fetching complete hospital data:', error);
        setError('Error loading hospital details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompleteHospitalData();
  }, [initialHospital?._id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Building2 },
    { id: 'contact', label: 'Contact & Location', icon: MapPin },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'admin', label: 'Administrative Contact', icon: User }
  ];

  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    'Under Review': 'bg-blue-100 text-blue-800 border-blue-200',
    'Approved': 'bg-green-100 text-green-800 border-green-200',
    'Rejected': 'bg-red-100 text-red-800 border-red-200',
    'Suspended': 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const handleAction = (type) => {
    setActionType(type);
    setShowConfirmation(true);
  };

  const confirmAction = () => {
    onStatusUpdate(hospital._id, actionType, rejectionReason);
    setShowConfirmation(false);
    setRejectionReason('');
  };

  // Show loading state while fetching complete data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading hospital details...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If no hospital data, show error
  if (!hospital) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Hospital data not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const OverviewTab = () => (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Name</label>
            <p className="text-gray-900">{hospital.hospitalName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hospital Type</label>
            <p className="text-gray-900">{hospital.hospitalType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <p className="text-gray-900">{hospital.registrationNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Established</label>
            <p className="text-gray-900">{hospital.yearEstablished}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Number of Beds</label>
            <div className="flex items-center">
              <Bed className="w-4 h-4 text-gray-500 mr-2" />
              <p className="text-gray-900">{hospital.numberOfBeds}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Type</label>
            <p className="text-gray-900">{hospital.ownershipType}</p>
          </div>
        </div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Specialties Offered</h3>
        <div className="flex flex-wrap gap-2">
          {hospital.specialtiesOffered.map((specialty, index) => (
            <span key={index} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
              {specialty}
            </span>
          ))}
        </div>
      </div>

      {/* Application Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[hospital.status]}`}>
              {hospital.status === 'Approved' && <CheckCircle className="w-4 h-4 mr-2" />}
              {hospital.status === 'Rejected' && <XCircle className="w-4 h-4 mr-2" />}
              {hospital.status === 'Pending' && <Clock className="w-4 h-4 mr-2" />}
              {hospital.status}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
            <p className="text-gray-900">{formatDate(hospital.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
            <p className="text-gray-900">{hospital.verificationStatus}</p>
          </div>
        </div>
        
        {hospital.rejectionReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Rejection Reason</h4>
                <p className="text-sm text-red-700 mt-1">{hospital.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={onClose}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
          </div>
          <ApprovalActions 
            hospital={hospital}
            onAction={handleAction}
          />
        </div>

        {/* Hospital Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Building2 className="w-12 h-12 text-blue-600 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{hospital.hospitalName}</h1>
                <p className="text-gray-600">{hospital.hospitalType} • {hospital.address.city}, {hospital.address.state}</p>
                <p className="text-sm text-gray-500">Registration: {hospital.registrationNumber}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${statusColors[hospital.status]}`}>
              <span className="text-sm font-medium">{hospital.status}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                  >
                    <Icon className="w-5 h-5 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'overview' && <OverviewTab />}
            {activeTab === 'contact' && <HospitalContactInfo hospital={hospital} />}
            {activeTab === 'documents' && <HospitalDocuments hospital={hospital} />}
            {activeTab === 'admin' && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <p className="text-gray-900">{hospital.administrativeContact?.fullName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                    <p className="text-gray-900">{hospital.administrativeContact?.designation}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                    <p className="text-gray-900">{hospital.administrativeContact?.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <p className="text-gray-900">{hospital.administrativeContact?.emailAddress}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
                    <p className="text-gray-900">{hospital.administrativeContact?.idProof?.documentType}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Document Number</label>
                    <p className="text-gray-900">{hospital.administrativeContact?.idProof?.documentNumber}</p>
                  </div>
                </div>
                
                {hospital.administrativeContact?.idProof?.documentUrl && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof Document</label>
                    <a
                      href={`http://localhost:5000${hospital.administrativeContact.idProof.documentUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View Document
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'Approved' ? 'Approve Hospital' : 'Reject Hospital'}
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to {actionType.toLowerCase()} this hospital application?
              </p>
              
              {actionType === 'Rejected' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Please provide a reason for rejection..."
                    required
                  />
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={actionType === 'Rejected' && !rejectionReason.trim()}
                  className={`px-4 py-2 text-white rounded-md ${
                    actionType === 'Approved' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {actionType === 'Approved' ? 'Approve' : 'Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalDetailView; 