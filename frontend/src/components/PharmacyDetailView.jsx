import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ArrowLeft, 
  Pill, 
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
  Clock,
  CheckCircle,
  XCircle,
  Building2,
  CreditCard
} from 'lucide-react';

const PharmacyDetailView = ({ pharmacy: initialPharmacy, onClose, onStatusUpdate }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [actionType, setActionType] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [pharmacy, setPharmacy] = useState(initialPharmacy);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch complete pharmacy data including documents
  useEffect(() => {
    const fetchCompletePharmacyData = async () => {
      if (!initialPharmacy?._id) return;
      
      setLoading(true);
      setError('');
      
      try {
        console.log('Fetching complete pharmacy data for ID:', initialPharmacy._id);
        const response = await axios.get(`http://localhost:5000/api/pharmacies/${initialPharmacy._id}`);
        
        if (response.data.success) {
          console.log('Complete pharmacy data received:', response.data.data);
          setPharmacy(response.data.data);
        } else {
          setError('Failed to fetch complete pharmacy data');
        }
      } catch (error) {
        console.error('Error fetching complete pharmacy data:', error);
        setError('Error loading pharmacy details');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletePharmacyData();
  }, [initialPharmacy?._id]);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Pill },
    { id: 'contact', label: 'Contact & Location', icon: MapPin },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'admin', label: 'Administrative Contact', icon: User },
    { id: 'bank', label: 'Bank Details', icon: CreditCard }
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
    onStatusUpdate(pharmacy._id, actionType, rejectionReason);
    setShowConfirmation(false);
    setRejectionReason('');
  };

  // Show loading state while fetching complete data
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading pharmacy details...</p>
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
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // If no pharmacy data, show error
  if (!pharmacy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">Pharmacy data not found</p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Name</label>
            <p className="text-gray-900">{pharmacy.pharmacyName}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pharmacy Type</label>
            <p className="text-gray-900">{pharmacy.pharmacyType}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
            <p className="text-gray-900">{pharmacy.registrationNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Drug License Number</label>
            <p className="text-gray-900">{pharmacy.drugLicenseNumber}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Year Established</label>
            <p className="text-gray-900">{pharmacy.yearEstablished}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ownership Type</label>
            <p className="text-gray-900">{pharmacy.ownershipType}</p>
          </div>
        </div>
      </div>

      {/* Services Offered */}
      {pharmacy.servicesOffered && pharmacy.servicesOffered.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Services Offered</h3>
          <div className="flex flex-wrap gap-2">
            {pharmacy.servicesOffered.map((service, index) => (
              <span key={index} className="px-3 py-1 bg-purple-50 text-purple-700 text-sm font-medium rounded-full">
                {service}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Operating Hours */}
      {pharmacy.operatingHours && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
              <p className="text-gray-900">{pharmacy.operatingHours.openingTime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
              <p className="text-gray-900">{pharmacy.operatingHours.closingTime}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">24/7 Service</label>
              <p className="text-gray-900">{pharmacy.operatingHours.is24x7 ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Application Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Status</label>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${statusColors[pharmacy.status]}`}>
              {pharmacy.status === 'Approved' && <CheckCircle className="w-4 h-4 mr-2" />}
              {pharmacy.status === 'Rejected' && <XCircle className="w-4 h-4 mr-2" />}
              {pharmacy.status === 'Pending' && <Clock className="w-4 h-4 mr-2" />}
              {pharmacy.status}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Application Date</label>
            <p className="text-gray-900">{formatDate(pharmacy.createdAt)}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Status</label>
            <p className="text-gray-900">{pharmacy.verificationStatus}</p>
          </div>
        </div>
        
        {pharmacy.rejectionReason && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-red-800">Rejection Reason</h4>
                <p className="text-sm text-red-700 mt-1">{pharmacy.rejectionReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ContactTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-500 mr-2" />
              <p className="text-gray-900">{pharmacy.contactNumber}</p>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-500 mr-2" />
              <p className="text-gray-900">{pharmacy.emailAddress}</p>
            </div>
          </div>
          {pharmacy.websiteUrl && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <div className="flex items-center">
                <Globe className="w-4 h-4 text-gray-500 mr-2" />
                <a href={pharmacy.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  {pharmacy.websiteUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <p className="text-gray-900">{pharmacy.address.street}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <p className="text-gray-900">{pharmacy.address.city}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
              <p className="text-gray-900">{pharmacy.address.state}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
              <p className="text-gray-900">{pharmacy.address.postalCode}</p>
            </div>
          </div>
          {pharmacy.address.country && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <p className="text-gray-900">{pharmacy.address.country}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const DocumentsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
        <div className="space-y-4">
          {pharmacy.documents && Object.entries(pharmacy.documents).map(([docType, docData]) => {
            if (!docData || docType === 'bankDetails') return null;
            
            const documentTitles = {
              pharmacyRegistrationCertificate: 'Pharmacy Registration Certificate',
              drugLicense: 'Drug License',
              pharmacistLicense: 'Pharmacist License',
              proofOfOwnership: 'Proof of Ownership',
              taxRegistration: 'Tax Registration',
            };

            return (
              <div key={docType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{documentTitles[docType]}</h4>
                    {docData.registrationNumber && (
                      <p className="text-sm text-gray-600 mt-1">Number: {docData.registrationNumber}</p>
                    )}
                    {docData.licenseNumber && (
                      <p className="text-sm text-gray-600 mt-1">License: {docData.licenseNumber}</p>
                    )}
                    {docData.expiryDate && (
                      <p className="text-sm text-gray-600 mt-1">Expiry: {formatDate(docData.expiryDate)}</p>
                    )}
                    {docData.taxNumber && (
                      <p className="text-sm text-gray-600 mt-1">Tax Number: {docData.taxNumber}</p>
                    )}
                  </div>
                  {docData.url && (
                    <a
                      href={docData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      View
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const AdminTab = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Administrative Contact</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
          <p className="text-gray-900">{pharmacy.administrativeContact?.fullName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
          <p className="text-gray-900">{pharmacy.administrativeContact?.designation}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
          <p className="text-gray-900">{pharmacy.administrativeContact?.phoneNumber}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
          <p className="text-gray-900">{pharmacy.administrativeContact?.emailAddress}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Proof Type</label>
          <p className="text-gray-900">{pharmacy.administrativeContact?.idProof?.documentType}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">ID Document Number</label>
          <p className="text-gray-900">{pharmacy.administrativeContact?.idProof?.documentNumber}</p>
        </div>
      </div>
      
      {pharmacy.administrativeContact?.idProof?.documentUrl && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof Document</label>
          <a
            href={pharmacy.administrativeContact.idProof.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700"
          >
            <Download className="w-4 h-4 mr-2" />
            View Document
          </a>
        </div>
      )}
    </div>
  );

  const BankTab = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Bank Account Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name</label>
          <p className="text-gray-900">{pharmacy.documents?.bankDetails?.bankName}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Title</label>
          <p className="text-gray-900">{pharmacy.documents?.bankDetails?.accountTitle}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
          <p className="text-gray-900">{pharmacy.documents?.bankDetails?.accountNumber}</p>
        </div>
        {pharmacy.documents?.bankDetails?.branchCode && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch Code</label>
            <p className="text-gray-900">{pharmacy.documents.bankDetails.branchCode}</p>
          </div>
        )}
        {pharmacy.documents?.bankDetails?.iban && (
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">IBAN</label>
            <p className="text-gray-900">{pharmacy.documents.bankDetails.iban}</p>
          </div>
        )}
      </div>
    </div>
  );

  const ApprovalActions = () => {
    if (pharmacy.status === 'Approved' || pharmacy.status === 'Rejected') {
      return null;
    }

    return (
      <div className="flex items-center space-x-3">
        <button
          onClick={() => handleAction('Rejected')}
          className="flex items-center px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </button>
        <button
          onClick={() => handleAction('Approved')}
          className="flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
        >
          <Check className="w-4 h-4 mr-2" />
          Approve
        </button>
      </div>
    );
  };

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
          <ApprovalActions />
        </div>

        {/* Pharmacy Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center">
              <Pill className="w-12 h-12 text-purple-600 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{pharmacy.pharmacyName}</h1>
                <p className="text-gray-600">{pharmacy.pharmacyType} • {pharmacy.address.city}, {pharmacy.address.state}</p>
                <p className="text-sm text-gray-500">Registration: {pharmacy.registrationNumber}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-lg border ${statusColors[pharmacy.status]}`}>
              <span className="text-sm font-medium">{pharmacy.status}</span>
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
                        ? 'border-purple-500 text-purple-600'
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
            {activeTab === 'contact' && <ContactTab />}
            {activeTab === 'documents' && <DocumentsTab />}
            {activeTab === 'admin' && <AdminTab />}
            {activeTab === 'bank' && <BankTab />}
          </div>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {actionType === 'Approved' ? 'Approve Pharmacy' : 'Reject Pharmacy'}
              </h3>
              <p className="text-gray-600 mb-4">
                Are you sure you want to {actionType.toLowerCase()} this pharmacy application?
              </p>
              
              {actionType === 'Rejected' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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

export default PharmacyDetailView;

