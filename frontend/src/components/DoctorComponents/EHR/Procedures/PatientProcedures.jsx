import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSort, FaSortUp, FaSortDown, FaEye, FaFilter, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import ProcedureFilters from './ProcedureFilters';
import ProcedureDetails from './ProcedureDetails';

function PatientProcedures({ patientId }) {
  const [procedures, setProcedures] = useState([]);
  const [filteredProcedures, setFilteredProcedures] = useState([]);
  const [expandedProcedure, setExpandedProcedure] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    procedureName: [],
    hospital: [],
    dateRange: 'all',
    status: [],
    customDateStart: '',
    customDateEnd: ''
  });

  // Fetch procedures data from the backend
  useEffect(() => {
    const fetchProcedures = async () => {
      try {
        setLoading(true);
        console.log('Fetching procedures for patient:', patientId);
        
        const response = await axios.get(`http://localhost:5000/api/procedures/patient/${patientId}`, {
          timeout: 5000
        });
        
        console.log('API Response:', response.data);
        
        if (response.data.success) {
          const formattedProcedures = response.data.data.map(procedure => ({
            id: procedure._id,
            date: procedure.date,
            name: procedure.procedureName,
            hospital: procedure.hospital,
            physician: procedure.physician,
            type: procedure.type,
            duration: procedure.duration,
            anesthesiaType: procedure.anesthesiaType,
            notes: procedure.findings,
            status: procedure.status,
            associatedRecords: {
              labResults: procedure.associatedLabResults?.length || 0,
              imagingStudies: procedure.associatedImaging?.length || 0,
              medications: procedure.associatedMedications?.length || 0
            }
          }));
          console.log('Formatted Procedures:', formattedProcedures);
          setProcedures(formattedProcedures);
          setFilteredProcedures(formattedProcedures);
        } else {
          console.error('API returned unsuccessful response:', response.data);
          setError('Failed to fetch procedures data: ' + (response.data.message || 'Unknown error'));
        }
      } catch (err) {
        console.error('Error fetching procedures:', err);
        if (err.code === 'ECONNABORTED') {
          setError('Request timed out. Please try again.');
        } else if (err.response) {
          setError(`Server error: ${err.response.status} - ${err.response.data.message || 'Unknown error'}`);
        } else if (err.request) {
          setError('No response from server. Please check your connection.');
        } else {
          setError('Failed to fetch procedures data: ' + err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    if (patientId) {
      fetchProcedures();
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
    let sortedProcedures = [...filteredProcedures];
    if (sortConfig.key) {
      sortedProcedures.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredProcedures(sortedProcedures);
  }, [sortConfig]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const applyFilters = (currentFilters) => {
    let results = [...procedures];

    if (currentFilters.procedureName.length > 0) {
      results = results.filter(p => currentFilters.procedureName.includes(p.procedureName));
    }

    if (currentFilters.hospital.length > 0) {
      results = results.filter(p => currentFilters.hospital.includes(p.hospital));
    }

    if (currentFilters.status.length > 0) {
      results = results.filter(p => currentFilters.status.includes(p.status));
    }

    if (currentFilters.dateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (currentFilters.dateRange === 'today') {
        results = results.filter(p => {
          const procDate = new Date(p.date);
          return procDate.toDateString() === today.toDateString();
        });
      } else if (currentFilters.dateRange === 'week') {
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        results = results.filter(p => {
          const procDate = new Date(p.date);
          return procDate >= weekAgo && procDate <= today;
        });
      } else if (currentFilters.dateRange === 'month') {
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        results = results.filter(p => {
          const procDate = new Date(p.date);
          return procDate >= monthAgo && procDate <= today;
        });
      } else if (currentFilters.dateRange === 'custom' && currentFilters.customDateStart && currentFilters.customDateEnd) {
        const startDate = new Date(currentFilters.customDateStart);
        const endDate = new Date(currentFilters.customDateEnd);
        endDate.setHours(23, 59, 59, 999);
        results = results.filter(p => {
          const procDate = new Date(p.date);
          return procDate >= startDate && procDate <= endDate;
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

    setFilteredProcedures(results);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getSortIcon = (column) => {
    if (sortConfig.key !== column) {
      return <FaSort className="text-gray-400" />;
    }
    return sortConfig.direction === 'asc' ? 
      <FaSortUp className="text-green-600" /> : 
      <FaSortDown className="text-green-600" />;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error: </strong>
        <span className="block sm:inline">{error}</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-green-800">Procedures</h1>
        </div>
        <ProcedureFilters onFilterChange={handleFilterChange} />
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-green-800">Patient Procedures</h2>
              <p className="text-sm text-gray-500 mt-1">
                {filteredProcedures.length} {filteredProcedures.length === 1 ? 'record' : 'records'} found
              </p>
            </div>
            {expandedProcedure && (
              <button
                onClick={() => setExpandedProcedure(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
              >
                Close Details
              </button>
            )}
          </div>
          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading procedures...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : (
            <>
              {expandedProcedure ? (
                <ProcedureDetails
                  procedure={filteredProcedures.find(p => p.id === expandedProcedure)}
                  onClose={() => setExpandedProcedure(null)}
                />
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure Name</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredProcedures.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{formatDate(p.date)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{p.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">{p.hospital}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{p.status}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            className="inline-flex items-center px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-green-600 hover:bg-green-100 transition-colors text-sm font-medium"
                            onClick={() => setExpandedProcedure(p.id)}
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
      </div>
    </div>
  );
}

export default PatientProcedures; 