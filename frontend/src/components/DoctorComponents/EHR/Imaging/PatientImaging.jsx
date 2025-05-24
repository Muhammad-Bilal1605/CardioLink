import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ImagingStatusBadge from './ImagingStatusBadge';
import ReportViewer from './ReportViewer';
import ImagingDetails from './ImagingDetails';
import { FaSort, FaSortUp, FaSortDown, FaEye, FaFilter, FaTimes, FaCalendarAlt } from 'react-icons/fa';

function PatientImaging({ patientId }) {
  const [imaging, setImaging] = useState([]);
  const [filteredImaging, setFilteredImaging] = useState([]);
  const [expandedImaging, setExpandedImaging] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    imagingType: [],
    department: [],
    dateRange: 'all',
    imagingStatus: [],
    customDateStart: '',
    customDateEnd: ''
  });

  // Fetch imaging data from the backend
  useEffect(() => {
    const fetchImaging = async () => {
      try {
        setLoading(true);
        console.log('Fetching imaging for patient:', patientId);
        
        const response = await axios.get(`http://localhost:5000/api/imaging/patient/${patientId}`, {
          timeout: 5000 // 5 second timeout
        });
        
        if (response.data.success) {
          const formattedImaging = response.data.data.map(img => ({
            id: img._id,
            patientId: img.patientId,
            type: img.type,
            date: img.date,
            facility: img.facility,
            doctor: img.doctor,
            description: img.description,
            findings: img.findings,
            imageUrl: img.imageUrl,
            status: img.status,
            notes: img.notes,
            createdAt: img.createdAt,
            updatedAt: img.updatedAt
          }));
          setImaging(formattedImaging);
          setFilteredImaging(formattedImaging);
        } else {
          console.error('API returned unsuccessful response:', response.data);
          setError('Failed to fetch imaging data: ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error fetching imaging:', err);
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError('Failed to fetch imaging data: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchImaging();
    } else {
      console.error('No patientId provided');
      setError('No patient ID provided');
      setLoading(false);
    }
  }, [patientId]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    let sortedImaging = [...filteredImaging];
    if (sortConfig.key) {
      sortedImaging.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredImaging(sortedImaging);
  }, [sortConfig]);

  const handleFilterChange = (filterType, value) => {
    let updatedFilters = { ...filters };
    
    if (filterType === 'dateRange') {
      updatedFilters.dateRange = value;
      
      // Reset custom dates if not custom range
      if (value !== 'custom') {
        updatedFilters.customDateStart = '';
        updatedFilters.customDateEnd = '';
      }
    } else if (filterType === 'customDateStart' || filterType === 'customDateEnd') {
      updatedFilters[filterType] = value;
    } else {
      // Handle arrays (checkboxes)
      const index = updatedFilters[filterType].indexOf(value);
      if (index === -1) {
        updatedFilters[filterType] = [...updatedFilters[filterType], value];
      } else {
        updatedFilters[filterType] = updatedFilters[filterType].filter(item => item !== value);
      }
    }
    
    setFilters(updatedFilters);
    applyFilters(updatedFilters);
  };

  const applyFilters = (currentFilters) => {
    let results = [...imaging];

    if (currentFilters.imagingType.length > 0) {
      results = results.filter(img => currentFilters.imagingType.includes(img.type));
    }

    if (currentFilters.department.length > 0) {
      results = results.filter(img => currentFilters.department.includes(img.department));
    }

    if (currentFilters.imagingStatus.length > 0) {
      results = results.filter(img => currentFilters.imagingStatus.includes(img.status));
    }

    if (currentFilters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (currentFilters.dateRange === 'today') {
        results = results.filter(img => {
          const imgDate = new Date(img.date);
          return imgDate.toDateString() === today.toDateString();
        });
      } else if (currentFilters.dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        results = results.filter(img => {
          const imgDate = new Date(img.date);
          return imgDate >= weekAgo && imgDate <= today;
        });
      } else if (currentFilters.dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        results = results.filter(img => {
          const imgDate = new Date(img.date);
          return imgDate >= monthAgo && imgDate <= today;
        });
      } else if (currentFilters.dateRange === 'custom' && currentFilters.customDateStart && currentFilters.customDateEnd) {
        const startDate = new Date(currentFilters.customDateStart);
        const endDate = new Date(currentFilters.customDateEnd);
        endDate.setHours(23, 59, 59, 999);
        results = results.filter(img => {
          const imgDate = new Date(img.date);
          return imgDate >= startDate && imgDate <= endDate;
        });
      }
    }

    // Apply sorting
    if (sortConfig.key) {
      results.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    setFilteredImaging(results);
  };

  const handleClearFilters = () => {
    const resetFilters = {
      imagingType: [],
      department: [],
      dateRange: 'all',
      imagingStatus: [],
      customDateStart: '',
      customDateEnd: ''
    };
    setFilters(resetFilters);
    applyFilters(resetFilters);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getSortIcon = (column) => {
    if (sortConfig.key !== column) return <FaSort className="ml-1 text-gray-400" />;
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="ml-1 text-green-600" /> : 
      <FaSortDown className="ml-1 text-green-600" />;
  };

  const imagingTypes = [
    'X-Ray',
    'CT Scan',
    'MRI',
    'Ultrasound',
    'Mammogram',
    'Nuclear Medicine'
  ];

  const departments = [
    'Radiology',
    'Nuclear Medicine',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Oncology'
  ];

  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Past Week' },
    { id: 'month', label: 'Past Month' },
    { id: 'custom', label: 'Custom Date Range' }
  ];

  const imagingStatuses = [
    'scheduled',
    'completed',
    'cancelled',
    'pending'
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    count += filters.imagingType.length;
    count += filters.department.length;
    count += filters.imagingStatus.length;
    if (filters.dateRange !== 'all') count += 1;
    return count;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading imaging results</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters - Horizontal, always visible, like Visits */}
      <div className="bg-white rounded-xl shadow-lg mb-6 p-4 border border-gray-100 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-green-800">Filter Imaging</h3>
          {getActiveFilterCount() > 0 && (
            <button
              onClick={handleClearFilters}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-red-600 font-medium transition-colors"
            >
              <FaTimes className="mr-2" />
              Clear All Filters ({getActiveFilterCount()})
            </button>
          )}
        </div>
        <div className="flex flex-wrap -mx-2">
          {/* Imaging Type Filter */}
          <div className="px-2 w-full md:w-1/3 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Imaging Type</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
              {imagingTypes.map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={filters.imagingType.includes(type)}
                    onChange={() => handleFilterChange('imagingType', type)}
                    className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Imaging Status Filter */}
          <div className="px-2 w-full md:w-1/3 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              {imagingStatuses.map(status => (
                <label key={status} className="flex items-center space-x-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={filters.imagingStatus.includes(status)}
                    onChange={() => handleFilterChange('imagingStatus', status)}
                    className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Date Range Filter */}
          <div className="px-2 w-full md:w-1/3 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              {dateRanges.map(range => (
                <label key={range.id} className="flex items-center space-x-2 text-sm mb-2">
                  <input
                    type="radio"
                    checked={filters.dateRange === range.id}
                    onChange={() => handleFilterChange('dateRange', range.id)}
                    className="form-radio h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{range.label}</span>
                </label>
              ))}
              {filters.dateRange === 'custom' && (
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start</label>
                    <input
                      type="date"
                      value={filters.customDateStart}
                      onChange={(e) => handleFilterChange('customDateStart', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End</label>
                    <input
                      type="date"
                      value={filters.customDateEnd}
                      onChange={(e) => handleFilterChange('customDateEnd', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Imaging Results Table and Details Card (not modal) */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {expandedImaging ? (
          <div className="p-6">
            <button
              onClick={() => setExpandedImaging(null)}
              className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Back to list
            </button>
            <ImagingDetails imaging={expandedImaging} onClose={() => setExpandedImaging(null)} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('date')}>
                    <div className="flex items-center">
                      Date {getSortIcon('date')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('type')}>
                    <div className="flex items-center">
                      Type {getSortIcon('type')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('facility')}>
                    <div className="flex items-center">
                      Facility {getSortIcon('facility')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('status')}>
                    <div className="flex items-center">
                      Status {getSortIcon('status')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredImaging.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No imaging results found for this patient.
                    </td>
                  </tr>
                ) : (
                  filteredImaging.map((img) => (
                    <tr key={img.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(img.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {img.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {img.facility}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <ImagingStatusBadge status={img.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setExpandedImaging(img)}
                          className="text-green-600 hover:text-green-900 flex items-center"
                        >
                          <FaEye className="mr-1" /> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default PatientImaging; 