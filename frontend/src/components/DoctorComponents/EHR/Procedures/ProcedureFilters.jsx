import React, { useState } from 'react';
import { FaCalendarAlt, FaHospital, FaClipboardCheck, FaFilter, FaTimes } from 'react-icons/fa';

function ProcedureFilters({ onFilterChange }) {
  const [filters, setFilters] = useState({
    procedureName: [],
    hospital: [],
    dateRange: 'all',
    status: [],
    customDateStart: '',
    customDateEnd: ''
  });

  const handleFilterChange = (filterType, value) => {
    let updatedFilters = { ...filters };
    if (filterType === 'dateRange') {
      updatedFilters.dateRange = value;
      if (value !== 'custom') {
        updatedFilters.customDateStart = '';
        updatedFilters.customDateEnd = '';
      }
    } else if (filterType === 'customDateStart' || filterType === 'customDateEnd') {
      updatedFilters[filterType] = value;
    } else {
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
      procedureName: [],
      hospital: [],
      dateRange: 'all',
      status: [],
      customDateStart: '',
      customDateEnd: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const procedureNames = [
    'Appendectomy', 'Cardiac Catheterization', 'Colonoscopy', 'Endoscopy', 'Hernia Repair', 'Knee Replacement', 'Laparoscopic Surgery', 'MRI Scan', 'X-Ray'
  ];
  const hospitals = [
    'City General Hospital', 'Memorial Medical Center', 'St. Mary\'s Hospital', 'University Medical Center', 'Community Hospital'
  ];
  const dateRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'Past Week' },
    { id: 'month', label: 'Past Month' },
    { id: 'custom', label: 'Custom Date Range' }
  ];
  const statuses = [
    'Scheduled', 'Completed', 'Cancelled', 'In Progress'
  ];

  const getActiveFilterCount = () => {
    let count = 0;
    count += filters.procedureName.length;
    count += filters.hospital.length;
    count += filters.status.length;
    if (filters.dateRange !== 'all') count += 1;
    return count;
  };
  const filterCount = getActiveFilterCount();

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 px-6 py-4 mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <FaFilter className="text-green-600 mr-2" />
          <h3 className="text-lg font-semibold text-green-800">Filter Procedures</h3>
          {filterCount > 0 && (
            <span className="ml-2 bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {filterCount}
            </span>
          )}
        </div>
        {filterCount > 0 && (
          <button onClick={handleClearFilters} className="text-sm text-red-600 hover:text-red-800 flex items-center">
            <FaTimes className="mr-1" /> Clear All
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Procedure Name */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <FaClipboardCheck className="mr-2 text-green-600" />
            <span className="font-medium text-gray-700">Procedure Name</span>
          </div>
          <div className="space-y-1">
            {procedureNames.map(name => (
              <label key={name} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.procedureName.includes(name)}
                  onChange={() => handleFilterChange('procedureName', name)}
                  className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-gray-700">{name}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Hospital */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <FaHospital className="mr-2 text-green-600" />
            <span className="font-medium text-gray-700">Hospital</span>
          </div>
          <div className="space-y-1">
            {hospitals.map(hospital => (
              <label key={hospital} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.hospital.includes(hospital)}
                  onChange={() => handleFilterChange('hospital', hospital)}
                  className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-gray-700">{hospital}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Status */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <FaClipboardCheck className="mr-2 text-green-600" />
            <span className="font-medium text-gray-700">Status</span>
          </div>
          <div className="space-y-1">
            {statuses.map(status => (
              <label key={status} className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={filters.status.includes(status)}
                  onChange={() => handleFilterChange('status', status)}
                  className="form-checkbox h-4 w-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
                />
                <span className="text-gray-700">{status}</span>
              </label>
            ))}
          </div>
        </div>
        {/* Date Range */}
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
          <div className="flex items-center mb-2">
            <FaCalendarAlt className="mr-2 text-green-600" />
            <span className="font-medium text-gray-700">Date Range</span>
          </div>
          <div className="space-y-1">
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
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={filters.customDateStart}
                    onChange={e => handleFilterChange('customDateStart', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1 font-medium">End Date</label>
                  <input
                    type="date"
                    value={filters.customDateEnd}
                    onChange={e => handleFilterChange('customDateEnd', e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProcedureFilters; 