import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VisitStatusBadge from './VisitStatusBadge';
import ReportViewer from './ReportViewer';
import VisitDetails from './VisitDetails';
import { FaSort, FaSortUp, FaSortDown, FaEye, FaFilter, FaTimes, FaCalendarAlt } from 'react-icons/fa';

function PatientVisits({ patientId }) {
  const [visits, setVisits] = useState([]);
  const [filteredVisits, setFilteredVisits] = useState([]);
  const [expandedVisit, setExpandedVisit] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    visitType: [],
    department: [],
    dateRange: 'all',
    visitStatus: [],
    customDateStart: '',
    customDateEnd: ''
  });

  // Fetch visits data from the backend
  useEffect(() => {
    const fetchVisits = async () => {
      try {
        setLoading(true);
        console.log('Fetching visits for patient:', patientId);
        
        const response = await axios.get(`http://localhost:5000/api/visits/patient/${patientId}`, {
          timeout: 5000 // 5 second timeout
        });
        
        console.log('API Response:', response.data);
        
        if (response.data.success) {
          const formattedVisits = response.data.data.map(visit => ({
            id: visit._id,
            date: visit.date,
            provider: visit.provider,
            type: visit.type,
            status: visit.status,
            reason: visit.reason,
            diagnosis: visit.diagnosis,
            treatment: visit.treatment,
            followUpDate: visit.followUpDate,
            documents: visit.documents || [],
            images: visit.images || [],
            associatedLabResults: visit.associatedLabResults || [],
            associatedImaging: visit.associatedImaging || []
          }));
          setVisits(formattedVisits);
          setFilteredVisits(formattedVisits);
        } else {
          console.error('API returned unsuccessful response:', response.data);
          setError('Failed to fetch visits data: ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error fetching visits:', err);
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError('Failed to fetch visits data: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchVisits();
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
    let sortedVisits = [...filteredVisits];
    if (sortConfig.key) {
      sortedVisits.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredVisits(sortedVisits);
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
    let results = [...visits];

    if (currentFilters.visitType.length > 0) {
      results = results.filter(visit => currentFilters.visitType.includes(visit.visitType));
    }

    if (currentFilters.department.length > 0) {
      results = results.filter(visit => currentFilters.department.includes(visit.department));
    }

    if (currentFilters.visitStatus.length > 0) {
      results = results.filter(visit => currentFilters.visitStatus.includes(visit.visitStatus));
    }

    if (currentFilters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (currentFilters.dateRange === 'today') {
        results = results.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate.toDateString() === today.toDateString();
        });
      } else if (currentFilters.dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        results = results.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate >= weekAgo && visitDate <= today;
        });
      } else if (currentFilters.dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        results = results.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate >= monthAgo && visitDate <= today;
        });
      } else if (currentFilters.dateRange === 'custom' && currentFilters.customDateStart && currentFilters.customDateEnd) {
        const startDate = new Date(currentFilters.customDateStart);
        const endDate = new Date(currentFilters.customDateEnd);
        endDate.setHours(23, 59, 59, 999);
        results = results.filter(visit => {
          const visitDate = new Date(visit.date);
          return visitDate >= startDate && visitDate <= endDate;
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

    setFilteredVisits(results);
  };

  const handleClearFilters = () => {
    const resetFilters = {
      visitType: [],
      department: [],
      dateRange: 'all',
      visitStatus: [],
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

  const visitTypes = [
    'routine',
    'followup',
    'emergency',
    'specialist'
  ];

  const departments = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Psychiatry',
    'Pediatrics',
    'General Medicine'
  ];

  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Past Week' },
    { id: 'month', label: 'Past Month' },
    { id: 'custom', label: 'Custom Date Range' }
  ];

  const visitStatuses = [
    'scheduled',
    'completed',
    'cancelled',
    'no-show'
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    count += filters.visitType.length;
    count += filters.department.length;
    count += filters.visitStatus.length;
    if (filters.dateRange !== 'all') count += 1;
    return count;
  };

  const filterCount = getActiveFilterCount();

  if (error) {
    return (
      <div className="p-12 text-center">
        <div className="bg-red-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700">Error Loading Visits</h3>
        <p className="text-gray-500 mt-1">{error}</p>
      </div>
    );
  }

  if (!loading && visits.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-700">No Visit History</h3>
        <p className="text-gray-500 mt-1">This patient has no recorded visits yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Medical History & Visits</h1>
          {filterCount > 0 && (
            <button 
              onClick={handleClearFilters}
              className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 text-red-600 font-medium transition-colors"
            >
              <FaTimes className="mr-2" /> 
              Clear All Filters ({filterCount})
            </button>
          )}
        </div>

        {/* Always Visible Filters */}
        <div className="bg-white rounded-xl shadow-lg mb-6 p-4 border border-gray-100 overflow-hidden">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-green-800">Filter Visits</h3>
          </div>
          
          <div className="flex flex-wrap -mx-2">
            {/* Visit Type Filter */}
            <div className="px-2 w-full md:w-1/4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Visit Type</label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                {visitTypes.map(type => (
                  <label key={type} className="flex items-center space-x-2 text-sm mb-2">
                    <input 
                      type="checkbox"
                      checked={filters.visitType.includes(type)}
                      onChange={() => handleFilterChange('visitType', type)}
                      className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Department Filter */}
            <div className="px-2 w-full md:w-1/4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 max-h-40 overflow-y-auto">
                {departments.map(dept => (
                  <label key={dept} className="flex items-center space-x-2 text-sm mb-2">
                    <input 
                      type="checkbox"
                      checked={filters.department.includes(dept)}
                      onChange={() => handleFilterChange('department', dept)}
                      className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{dept}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Visit Status Filter */}
            <div className="px-2 w-full md:w-1/4 mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Visit Status</label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                {visitStatuses.map(status => (
                  <label key={status} className="flex items-center space-x-2 text-sm mb-2">
                    <input 
                      type="checkbox"
                      checked={filters.visitStatus.includes(status)}
                      onChange={() => handleFilterChange('visitStatus', status)}
                      className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                    />
                    <span className="text-gray-700">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div className="px-2 w-full md:w-1/4 mb-4">
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

        {/* Active Filters Pills */}
        {filterCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.visitType.map(type => (
              <span key={type} className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                {type.charAt(0).toUpperCase() + type.slice(1)}
                <button 
                  onClick={() => handleFilterChange('visitType', type)} 
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            
            {filters.department.map(dept => (
              <span key={dept} className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                {dept}
                <button 
                  onClick={() => handleFilterChange('department', dept)} 
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            
            {filters.visitStatus.map(status => (
              <span key={status} className="bg-purple-100 text-purple-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <button 
                  onClick={() => handleFilterChange('visitStatus', status)} 
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <FaTimes />
                </button>
              </span>
            ))}
            
            {filters.dateRange !== 'all' && (
              <span className="bg-amber-100 text-amber-800 text-xs font-medium px-3 py-1 rounded-full flex items-center">
                {filters.dateRange === 'custom' ? 'Custom Date' : 
                 filters.dateRange === 'today' ? 'Today' : 
                 filters.dateRange === 'week' ? 'Past Week' : 'Past Month'}
                <button 
                  onClick={() => handleFilterChange('dateRange', 'all')} 
                  className="ml-1 text-amber-600 hover:text-amber-800"
                >
                  <FaTimes />
                </button>
              </span>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-green-800">Patient Visits</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredVisits.length} {filteredVisits.length === 1 ? 'record' : 'records'} found
              </p>
            </div>
            {expandedVisit && (
              <button
                onClick={() => setExpandedVisit(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Close Details
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading visits...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {filteredVisits.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="bg-gray-100 rounded-full p-4 w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-700">No visits found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your filters to see more results</p>
                </div>
              ) : (
                <>
                  {expandedVisit ? (
                    <VisitDetails 
                      visit={filteredVisits.find(v => v.id === expandedVisit)} 
                      onClose={() => setExpandedVisit(null)}
                    />
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {['date', 'provider', 'type', 'status'].map((key) => (
                            <th 
                              key={key} 
                              scope="col" 
                              className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100"
                              onClick={() => handleSort(key)}
                            >
                              <div className="flex items-center">
                                <span>{key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                                <span className="ml-1">{getSortIcon(key)}</span>
                              </div>
                            </th>
                          ))}
                          <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredVisits.map((visit) => (
                          <tr 
                            key={visit.id} 
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="font-medium text-gray-900">{formatDate(visit.date)}</div>
                              <div className="text-xs text-gray-500">
                                {new Date(visit.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{visit.provider}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-gray-900">{visit.type.charAt(0).toUpperCase() + visit.type.slice(1)}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                              <button 
                                className="inline-flex items-center px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-600 hover:bg-green-100 transition-colors text-sm font-medium"
                                onClick={() => setExpandedVisit(visit.id)}
                              >
                                <FaEye className="mr-1" /> View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PatientVisits;