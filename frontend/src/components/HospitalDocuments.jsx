import React, { useState } from 'react';
import axios from 'axios';
import { 
  FileText, 
  Download, 
  Calendar, 
  Shield, 
  Building, 
  Users, 
  Truck, 
  Award,
  Receipt,
  Lock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TestTube
} from 'lucide-react';

const HospitalDocuments = ({ hospital }) => {
  const [testResults, setTestResults] = useState(null);
  const [testLoading, setTestLoading] = useState(false);

  // Add debugging
  console.log('Hospital data in HospitalDocuments:', hospital);
  console.log('Documents object:', hospital?.documents);

  const testFileAccess = async () => {
    setTestLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/hospitals/test-files/${hospital._id}`);
      setTestResults(response.data);
      console.log('File test results:', response.data);
    } catch (error) {
      console.error('Error testing files:', error);
      setTestResults({ error: error.message });
    } finally {
      setTestLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isExpired = (dateString) => {
    if (!dateString) return false;
    return new Date(dateString) < new Date();
  };

  const DocumentCard = ({ title, icon: Icon, document, required = true, additionalInfo = null }) => {
    // Add debugging for each document
    console.log(`Document ${title}:`, document);
    
    const hasDocument = document && document.url && document.url.trim() !== '';
    const expired = additionalInfo?.expiryDate && isExpired(additionalInfo.expiryDate);
    
    const handleDownload = (url) => {
      console.log('Attempting to download:', url);
      const filename = url.split('/').pop(); // Get just the filename
      const downloadUrl = `http://localhost:5000/api/hospitals/download-file/${filename}`;
      console.log('Download URL:', downloadUrl);
      window.open(downloadUrl, '_blank');
    };
    
    return (
      <div className={`border rounded-lg p-4 ${hasDocument ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <Icon className={`w-5 h-5 mr-2 ${hasDocument ? 'text-green-600' : 'text-red-600'}`} />
            <h4 className="font-medium text-gray-900">{title}</h4>
            {required && <span className="ml-2 text-xs text-red-600">*</span>}
          </div>
          <div className="flex items-center">
            {hasDocument ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </div>
        </div>

        {hasDocument ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Status: Uploaded</span>
              <button
                onClick={() => handleDownload(document.url)}
                className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
              >
                <Download className="w-3 h-3 mr-1" />
                Download
              </button>
            </div>
            
            {document.uploadDate && (
              <p className="text-xs text-gray-500">
                Uploaded: {formatDate(document.uploadDate)}
              </p>
            )}

            <div className="text-xs text-gray-400">
              URL: {document.url}
            </div>

            {additionalInfo && (
              <div className="mt-2 text-xs space-y-1">
                {additionalInfo.licenseNumber && (
                  <p className="text-gray-600">License #: {additionalInfo.licenseNumber}</p>
                )}
                {additionalInfo.expiryDate && (
                  <p className={`${expired ? 'text-red-600' : 'text-gray-600'}`}>
                    Expires: {formatDate(additionalInfo.expiryDate)}
                    {expired && <span className="ml-1 font-medium">(EXPIRED)</span>}
                  </p>
                )}
                {additionalInfo.documentType && (
                  <p className="text-gray-600">Type: {additionalInfo.documentType}</p>
                )}
                {additionalInfo.taxNumber && (
                  <p className="text-gray-600">Tax #: {additionalInfo.taxNumber}</p>
                )}
                {additionalInfo.registrationNumber && (
                  <p className="text-gray-600">Registration #: {additionalInfo.registrationNumber}</p>
                )}
                {additionalInfo.numberOfAmbulances && (
                  <p className="text-gray-600">Ambulances: {additionalInfo.numberOfAmbulances}</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-red-600">
            {required ? 'Required document not uploaded' : 'Optional document not provided'}
          </div>
        )}
      </div>
    );
  };

  const AccreditationCard = ({ certificates }) => {
    if (!certificates || certificates.length === 0) {
      return (
        <div className="border border-gray-200 bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Award className="w-5 h-5 mr-2 text-gray-600" />
            <h4 className="font-medium text-gray-900">Accreditation Certificates</h4>
            <span className="ml-2 text-xs text-gray-500">(Optional)</span>
          </div>
          <div className="text-sm text-gray-600">No accreditation certificates provided</div>
        </div>
      );
    }

    return (
      <div className="border border-green-200 bg-green-50 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Award className="w-5 h-5 mr-2 text-green-600" />
          <h4 className="font-medium text-gray-900">Accreditation Certificates</h4>
          <span className="ml-2 text-xs text-green-600">({certificates.length} uploaded)</span>
        </div>
        
        <div className="space-y-3">
          {certificates.map((cert, index) => {
            const expired = cert.expiryDate && isExpired(cert.expiryDate);
            return (
              <div key={index} className="bg-white border border-gray-200 rounded p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{cert.type || 'Unknown Type'}</span>
                    {expired && <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />}
                  </div>
                  <button
                    onClick={() => {
                      const filename = cert.url.split('/').pop();
                      window.open(`http://localhost:5000/api/hospitals/download-file/${filename}`, '_blank');
                    }}
                    className="inline-flex items-center px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700"
                  >
                    <Download className="w-3 h-3 mr-1" />
                    View
                  </button>
                </div>
                
                <div className="text-xs space-y-1">
                  {cert.certificateNumber && (
                    <p className="text-gray-600">Certificate #: {cert.certificateNumber}</p>
                  )}
                  {cert.issuedBy && (
                    <p className="text-gray-600">Issued by: {cert.issuedBy}</p>
                  )}
                  {cert.expiryDate && (
                    <p className={`${expired ? 'text-red-600' : 'text-gray-600'}`}>
                      Expires: {formatDate(cert.expiryDate)}
                      {expired && <span className="ml-1 font-medium">(EXPIRED)</span>}
                    </p>
                  )}
                  {cert.uploadDate && (
                    <p className="text-gray-500">Uploaded: {formatDate(cert.uploadDate)}</p>
                  )}
                  <div className="text-xs text-gray-400">
                    URL: {cert.url}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const documents = hospital?.documents || {};

  // Count completed required documents
  const requiredDocuments = [
    'hospitalRegistrationCertificate',
    'healthDepartmentLicense',
    'proofOfOwnership',
    'practitionersList',
    'taxRegistration',
    'dataPrivacyPolicy'
  ];

  const completedRequiredDocs = requiredDocuments.filter(docKey => 
    documents[docKey] && documents[docKey].url && documents[docKey].url.trim() !== ''
  ).length;

  return (
    <div className="space-y-6">
      {/* Debug/Test Section */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium text-green-800">File Access Status ✓</h4>
          <button
            onClick={testFileAccess}
            disabled={testLoading}
            className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 disabled:opacity-50"
          >
            <TestTube className="w-3 h-3 mr-1" />
            {testLoading ? 'Testing...' : 'Test Files'}
          </button>
        </div>
        
        <p className="text-sm text-green-700 mb-2">
          ✓ File downloads are working via direct file serving endpoint
        </p>
        
        {testResults && (
          <div className="mt-3 text-xs">
            <pre className="bg-white p-2 rounded border overflow-x-auto">
              {JSON.stringify(testResults, null, 2)}
            </pre>
          </div>
        )}
      </div>

      {/* Document Completeness Summary */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {completedRequiredDocs}
            </div>
            <p className="text-sm text-gray-600">Required Documents ({completedRequiredDocs}/{requiredDocuments.length})</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {documents.accreditationCertificates?.length || 0}
            </div>
            <p className="text-sm text-gray-600">Accreditation Certificates</p>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${completedRequiredDocs === requiredDocuments.length ? 'text-green-600' : 'text-red-600'}`}>
              {completedRequiredDocs === requiredDocuments.length ? 'Complete' : 'Incomplete'}
            </div>
            <p className="text-sm text-gray-600">Overall Status</p>
          </div>
        </div>
      </div>

      {/* Required Documents */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Required Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentCard
            title="Hospital Registration Certificate"
            icon={Building}
            document={documents.hospitalRegistrationCertificate}
            required={true}
          />
          
          <DocumentCard
            title="Health Department License"
            icon={Shield}
            document={documents.healthDepartmentLicense}
            required={true}
            additionalInfo={documents.healthDepartmentLicense}
          />
          
          <DocumentCard
            title="Proof of Ownership/Lease"
            icon={FileText}
            document={documents.proofOfOwnership}
            required={true}
            additionalInfo={documents.proofOfOwnership}
          />
          
          <DocumentCard
            title="List of Practicing Doctors"
            icon={Users}
            document={documents.practitionersList}
            required={true}
          />
          
          <DocumentCard
            title="Tax Registration Document"
            icon={Receipt}
            document={documents.taxRegistration}
            required={true}
            additionalInfo={documents.taxRegistration}
          />
          
          <DocumentCard
            title="Data Privacy & Patient Record Policy"
            icon={Lock}
            document={documents.dataPrivacyPolicy}
            required={true}
          />
        </div>
      </div>

      {/* Optional Documents */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Optional Documents</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DocumentCard
            title="Lab Certification"
            icon={FileText}
            document={documents.labCertification}
            required={false}
          />
          
          <DocumentCard
            title="Ambulance Registration"
            icon={Truck}
            document={documents.ambulanceRegistration}
            required={false}
            additionalInfo={documents.ambulanceRegistration}
          />
        </div>

        {/* Accreditation Certificates */}
        <div className="mt-4">
          <AccreditationCard certificates={documents.accreditationCertificates} />
        </div>
      </div>

      {/* Document Verification Status */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Verification Notes</h3>
        <div className="space-y-3">
          <div className="flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-gray-900">Document Uploads</p>
              <p className="text-sm text-gray-600">
                {completedRequiredDocs} of {requiredDocuments.length} required documents have been uploaded.
              </p>
            </div>
          </div>
          
          {hospital?.verificationStatus === 'Partially Verified' && (
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900">Pending Verification</p>
                <p className="text-sm text-gray-600">Documents are uploaded but require manual verification by authorized personnel.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalDocuments; 