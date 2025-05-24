import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LabStatusBadge from './LabStatusBadge';
import ReportViewer from './ReportViewer';
import LabDetails from './LabDetails';
import { FaSort, FaSortUp, FaSortDown, FaEye, FaFilter, FaTimes, FaCalendarAlt } from 'react-icons/fa';

function PatientLabs({ patientId }) {
  const [labs, setLabs] = useState([]);
  const [filteredLabs, setFilteredLabs] = useState([]);
  const [expandedLab, setExpandedLab] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    labType: [],
    department: [],
    dateRange: 'all',
    labStatus: [],
    customDateStart: '',
    customDateEnd: ''
  });

  // Fetch labs data from the backend
  useEffect(() => {
    const fetchLabs = async () => {
      try {
        setLoading(true);
        console.log('Fetching labs for patient:', patientId);
        
        const response = await axios.get(`http://localhost:5000/api/lab-results/patient/${patientId}`, {
          timeout: 5000 // 5 second timeout
        });
        
        console.log('API Response:', response.data);
        
        if (response.data.success) {
          const formattedLabs = response.data.data.map(lab => ({
            id: lab._id,
            patientId: lab.patientId,
            testName: lab.testName,
            testType: lab.testType,
            date: lab.date,
            facility: lab.facility,
            doctor: lab.doctor,
            results: lab.results,
            status: lab.status,
            notes: lab.notes,
            reportUrl: lab.reportUrl,
            createdAt: lab.createdAt,
            updatedAt: lab.updatedAt,
            // Keep some backward compatibility for UI
            type: lab.testType,
            provider: lab.doctor
          }));
          setLabs(formattedLabs);
          setFilteredLabs(formattedLabs);
        } else {
          console.error('API returned unsuccessful response:', response.data);
          setError('Failed to fetch labs data: ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error fetching labs:', err);
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (err.response) {
          if (err.response.status === 404) {
            // Treat 404 as no labs found, not an error
            setLabs([]);
            setFilteredLabs([]);
            setError(null);
          } else {
            setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
          }
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError('Failed to fetch labs data: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchLabs();
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
    let sortedLabs = [...filteredLabs];
    if (sortConfig.key) {
      sortedLabs.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredLabs(sortedLabs);
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
    let results = [...labs];

    if (currentFilters.labType.length > 0) {
      results = results.filter(lab => currentFilters.labType.includes(lab.type));
    }

    if (currentFilters.department.length > 0) {
      results = results.filter(lab => currentFilters.department.includes(lab.department));
    }

    if (currentFilters.labStatus.length > 0) {
      results = results.filter(lab => currentFilters.labStatus.includes(lab.status));
    }

    if (currentFilters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (currentFilters.dateRange === 'today') {
        results = results.filter(lab => {
          const labDate = new Date(lab.date);
          return labDate.toDateString() === today.toDateString();
        });
      } else if (currentFilters.dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        results = results.filter(lab => {
          const labDate = new Date(lab.date);
          return labDate >= weekAgo && labDate <= today;
        });
      } else if (currentFilters.dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        results = results.filter(lab => {
          const labDate = new Date(lab.date);
          return labDate >= monthAgo && labDate <= today;
        });
      } else if (currentFilters.dateRange === 'custom' && currentFilters.customDateStart && currentFilters.customDateEnd) {
        const startDate = new Date(currentFilters.customDateStart);
        const endDate = new Date(currentFilters.customDateEnd);
        endDate.setHours(23, 59, 59, 999);
        results = results.filter(lab => {
          const labDate = new Date(lab.date);
          return labDate >= startDate && labDate <= endDate;
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

    setFilteredLabs(results);
  };

  const handleClearFilters = () => {
    const resetFilters = {
      labType: [],
      department: [],
      dateRange: 'all',
      labStatus: [],
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

  const labTypes = [
    'Blood Test',
    'Urine Test',
    'Stool Test',
    'Culture Test',
    'Biopsy',
    'Genetic Test'
  ];

  const departments = [
    'Hematology',
    'Microbiology',
    'Biochemistry',
    'Pathology',
    'Genetics',
    'Immunology'
  ];

  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Past Week' },
    { id: 'month', label: 'Past Month' },
    { id: 'custom', label: 'Custom Date Range' }
  ];

  const labStatuses = [
    'scheduled',
    'completed',
    'cancelled',
    'pending'
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    count += filters.labType.length;
    count += filters.department.length;
    count += filters.labStatus.length;
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
            <h3 className="text-sm font-medium text-red-800">Error loading lab results</h3>
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
          <h3 className="text-lg font-semibold text-green-800">Filter Labs</h3>
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
          {/* Lab Type Filter */}
          <div className="px-2 w-full md:w-1/3 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Lab Type</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
              {labTypes.map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={filters.labType.includes(type)}
                    onChange={() => handleFilterChange('labType', type)}
                    className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Lab Status Filter */}
          <div className="px-2 w-full md:w-1/3 mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
              {labStatuses.map(status => (
                <label key={status} className="flex items-center space-x-2 text-sm mb-2">
                  <input
                    type="checkbox"
                    checked={filters.labStatus.includes(status)}
                    onChange={() => handleFilterChange('labStatus', status)}
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

      {/* Lab Results Table and Details Card (not modal) */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {expandedLab ? (
          <div className="p-6">
            <button
              onClick={() => setExpandedLab(null)}
              className="mb-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              Back to list
            </button>
            <LabDetails lab={expandedLab} onClose={() => setExpandedLab(null)} />
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
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('testName')}>
                    <div className="flex items-center">
                      Test Name {getSortIcon('testName')}
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer" onClick={() => handleSort('type')}>
                    <div className="flex items-center">
                      Type {getSortIcon('type')}
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
                {filteredLabs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No lab results found for this patient.
                    </td>
                  </tr>
                ) : (
                  filteredLabs.map((lab) => (
                    <tr key={lab.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(lab.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lab.testName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {lab.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <LabStatusBadge status={lab.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => setExpandedLab(lab)}
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

export default PatientLabs; 