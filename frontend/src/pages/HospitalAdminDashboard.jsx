import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Building2, 
  Search, 
  Filter, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import HospitalDetailView from '../components/HospitalDetailView';

const HospitalAdminDashboard = () => {
  const navigate = useNavigate();
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const statusOptions = ['All', 'Pending', 'Under Review', 'Approved', 'Rejected', 'Suspended'];
  const statusColors = {
    'Pending': 'bg-yellow-100 text-yellow-800',
    'Under Review': 'bg-blue-100 text-blue-800',
    'Approved': 'bg-green-100 text-green-800',
    'Rejected': 'bg-red-100 text-red-800',
    'Suspended': 'bg-gray-100 text-gray-800'
  };

  const statusIcons = {
    'Pending': Clock,
    'Under Review': AlertCircle,
    'Approved': CheckCircle,
    'Rejected': XCircle,
    'Suspended': XCircle
  };

  useEffect(() => {
    fetchHospitals();
  }, [statusFilter, searchTerm, pagination.current]);

  const fetchHospitals = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...(statusFilter !== 'All' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      const response = await axios.get(`http://localhost:5000/api/hospitals?${params}`);
      
      if (response.data.success) {
        setHospitals(response.data.data);
        setPagination(response.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (hospital) => {
    setSelectedHospital(hospital);
    setShowDetailView(true);
  };

  const handleStatusUpdate = async (hospitalId, newStatus, rejectionReason = '') => {
    try {
      const response = await axios.put(`http://localhost:5000/api/hospitals/${hospitalId}/status`, {
        status: newStatus,
        ...(rejectionReason && { rejectionReason })
      });

      if (response.data.success) {
        // Refresh the hospitals list
        fetchHospitals();
        // Update the selected hospital if it's currently viewed
        if (selectedHospital && selectedHospital._id === hospitalId) {
          setSelectedHospital(response.data.data);
        }
      }
    } catch (error) {
      console.error('Error updating hospital status:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const HospitalCard = ({ hospital }) => {
    const StatusIcon = statusIcons[hospital.status] || Clock;
    
    return (
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-gray-200">
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 truncate">
                  {hospital.hospitalName}
                </h3>
                <p className="text-sm text-gray-600">{hospital.hospitalType}</p>
              </div>
            </div>
            <div className={`flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusColors[hospital.status]}`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {hospital.status}
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="truncate">{hospital.address.city}, {hospital.address.state}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2" />
              <span>{hospital.phoneNumber}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Mail className="w-4 h-4 mr-2" />
              <span className="truncate">{hospital.emailAddress}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Calendar className="w-4 h-4 mr-2" />
              <span>Applied: {formatDate(hospital.createdAt)}</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Specialties</p>
            <div className="flex flex-wrap gap-1">
              {hospital.specialtiesOffered.slice(0, 3).map((specialty, index) => (
                <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                  {specialty}
                </span>
              ))}
              {hospital.specialtiesOffered.length > 3 && (
                <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded">
                  +{hospital.specialtiesOffered.length - 3} more
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <span className="font-medium">{hospital.numberOfBeds}</span> beds
            </div>
            <button
              onClick={() => handleViewDetails(hospital)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (showDetailView && selectedHospital) {
    return (
      <HospitalDetailView
        hospital={selectedHospital}
        onClose={() => setShowDetailView(false)}
        onStatusUpdate={handleStatusUpdate}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hospital Administration</h1>
          <p className="text-gray-600">Manage hospital registration applications</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by hospital name or registration number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-2" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{pagination.total}</p>
                <p className="text-gray-600">Total Applications</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hospitals Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-300 rounded mr-3"></div>
                    <div>
                      <div className="h-4 bg-gray-300 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded-full w-20"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-3 bg-gray-300 rounded w-full"></div>
                  <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-300 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : hospitals.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hospitals found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hospitals.map((hospital) => (
              <HospitalCard key={hospital._id} hospital={hospital} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current - 1 }))}
                disabled={pagination.current === 1}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {[...Array(pagination.pages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => setPagination(prev => ({ ...prev, current: index + 1 }))}
                  className={`px-3 py-2 border text-sm font-medium rounded-md ${
                    pagination.current === index + 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                onClick={() => setPagination(prev => ({ ...prev, current: prev.current + 1 }))}
                disabled={pagination.current === pagination.pages}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalAdminDashboard; 