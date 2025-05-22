import React, { useState } from 'react';
import { 
  FaCalendarAlt, 
  FaHospital, 
  FaStethoscope, 
  FaClipboardCheck, 
  FaFilter, 
  FaTimes 
} from 'react-icons/fa';

function VisitFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    visitType: [],
    department: [],
    dateRange: 'all',
    visitStatus: [],
    customDateStart: '',
    customDateEnd: ''
  });
  
  const [isCollapsed, setIsCollapsed] = useState({
    visitType: false,
    department: false,
    dateRange: false,
    visitStatus: false
  });

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
    onFilterChange(updatedFilters);
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
    onFilterChange(resetFilters);
  };

  const toggleSection = (section) => {
    setIsCollapsed({
      ...isCollapsed,
      [section]: !isCollapsed[section]
    });
  };

  const visitTypes = [
    'Routine Checkup',
    'Emergency',
    'Follow-up',
    'Surgery',
    'Lab Test',
    'Telehealth / Video Consultation'
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
    'Upcoming',
    'Completed',
    'Cancelled',
    'In Progress'
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

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <FaFilter className="text-green-600 mr-2" />
            <h3 className="text-lg font-semibold text-green-800">Filters</h3>
            {filterCount > 0 && (
              <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {filterCount}
              </span>
            )}
          </div>
          {filterCount > 0 && (
            <button 
              onClick={handleClearFilters}
              className="text-sm text-red-600 hover:text-red-800 flex items-center"
            >
              <FaTimes className="mr-1" /> Clear All
            </button>
          )}
        </div>
      </div>
      
      <div className="p-4">
        {/* Visit Type */}
        <div className="mb-6">
          <button 
            className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:text-green-700 focus:outline-none"
            onClick={() => toggleSection('visitType')}
          >
            <div className="flex items-center">
              <FaStethoscope className="mr-2 text-green-600" />
              <span>Visit Type</span>
              {filters.visitType.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {filters.visitType.length}
                </span>
              )}
            </div>
            <svg className={`w-5 h-5 transform ${isCollapsed.visitType ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {!isCollapsed.visitType && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
              {visitTypes.map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={filters.visitType.includes(type)}
                    onChange={() => handleFilterChange('visitType', type)}
                    className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{type}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        
        {/* Department / Specialty */}
        <div className="mb-6">
          <button 
            className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:text-green-700 focus:outline-none"
            onClick={() => toggleSection('department')}
          >
            <div className="flex items-center">
              <FaHospital className="mr-2 text-green-600" />
              <span>Department / Specialty</span>
              {filters.department.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {filters.department.length}
                </span>
              )}
            </div>
            <svg className={`w-5 h-5 transform ${isCollapsed.department ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {!isCollapsed.department && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
              {departments.map(dept => (
                <label key={dept} className="flex items-center space-x-2 text-sm">
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
          )}
        </div>
        
        {/* Date Range */}
        <div className="mb-6">
          <button 
            className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:text-green-700 focus:outline-none"
            onClick={() => toggleSection('dateRange')}
          >
            <div className="flex items-center">
              <FaCalendarAlt className="mr-2 text-green-600" />
              <span>Date Range</span>
              {filters.dateRange !== 'all' && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  1
                </span>
              )}
            </div>
            <svg className={`w-5 h-5 transform ${isCollapsed.dateRange ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {!isCollapsed.dateRange && (
            <div className="mt-3 space-y-3 pl-7">
              {dateRanges.map(range => (
                <label key={range.id} className="flex items-center space-x-2 text-sm">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 font-medium">Start Date</label>
                    <input 
                      type="date"
                      value={filters.customDateStart}
                      onChange={(e) => handleFilterChange('customDateStart', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1 font-medium">End Date</label>
                    <input 
                      type="date"
                      value={filters.customDateEnd}
                      onChange={(e) => handleFilterChange('customDateEnd', e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Visit Status */}
        <div className="mb-6">
          <button 
            className="w-full flex justify-between items-center py-2 text-left font-medium text-gray-700 hover:text-green-700 focus:outline-none"
            onClick={() => toggleSection('visitStatus')}
          >
            <div className="flex items-center">
              <FaClipboardCheck className="mr-2 text-green-600" />
              <span>Visit Status</span>
              {filters.visitStatus.length > 0 && (
                <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2 py-0.5 rounded-full">
                  {filters.visitStatus.length}
                </span>
              )}
            </div>
            <svg className={`w-5 h-5 transform ${isCollapsed.visitStatus ? '' : 'rotate-180'}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          
          {!isCollapsed.visitStatus && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 pl-7">
              {visitStatuses.map(status => (
                <label key={status} className="flex items-center space-x-2 text-sm">
                  <input 
                    type="checkbox"
                    checked={filters.visitStatus.includes(status)}
                    onChange={() => handleFilterChange('visitStatus', status)}
                    className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                  />
                  <span className="text-gray-700">{status}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VisitFilters;