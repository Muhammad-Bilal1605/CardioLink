import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Maps from backend field names to display labels
const VitalTypeLabels = {
  heartRate: 'Heart Rate',
  bloodPressure: 'Blood Pressure',
  respiratoryRate: 'Respiratory Rate',
  temperature: 'Temperature',
  oxygenSaturation: 'Oxygen Saturation',
  weight: 'Weight',
  height: 'Height',
  bloodGlucose: 'Blood Glucose'
};

const VitalsList = ({ patientId }) => {
  const [vitals, setVitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedType, setSelectedType] = useState('all');
  
  useEffect(() => {
    const fetchVitals = async () => {
      if (!patientId) return;
      
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:5000/api/vital-signs/patient/${patientId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.data.success) {
          setVitals(response.data.data);
        } else {
          setError(response.data.message || 'Failed to fetch vital signs');
        }
      } catch (err) {
        console.error('Error fetching vital signs:', err);
        setError(err.response?.data?.message || 'Failed to connect to server');
      } finally {
        setLoading(false);
      }
    };
    
    fetchVitals();
  }, [patientId]);
  
  // Get vital type from the vital sign object
  const getVitalType = (vital) => {
    // Check which vital sign field is present
    if (vital.bloodPressure) return 'bloodPressure';
    if (vital.heartRate) return 'heartRate';
    if (vital.respiratoryRate) return 'respiratoryRate';
    if (vital.temperature) return 'temperature';
    if (vital.oxygenSaturation) return 'oxygenSaturation';
    if (vital.weight) return 'weight';
    if (vital.height) return 'height';
    if (vital.bloodGlucose) return 'bloodGlucose';
    return 'unknown';
  };
  
  // Get unique vital types from data
  const vitalTypes = React.useMemo(() => {
    const types = new Set(vitals.map(vital => getVitalType(vital)));
    return Array.from(types).filter(type => type !== 'unknown');
  }, [vitals]);

  // Group vitals by date and type, then calculate averages
  const groupedVitals = React.useMemo(() => {
    const groups = {};
    
    vitals.forEach(vital => {
      const type = getVitalType(vital);
      if (type === 'unknown') return;
      
      // Get date part only (without time)
      const date = new Date(vital.date);
      const dateKey = date.toISOString().split('T')[0];
      
      // Create key for grouping
      const key = `${dateKey}-${type}`;
      
      if (!groups[key]) {
        groups[key] = {
          type,
          dateKey,
          date: vital.date, // Keep the original date for display
          values: [],
          notes: [],
          _id: vital._id // Keep one ID for reference
        };
      }
      
      // Add this vital's value to the array for averaging later
      groups[key].values.push(vital);
      if (vital.notes) groups[key].notes.push(vital.notes);
    });
    
    // Convert to array and sort by date (newest first)
    return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [vitals]);
  
  // Filter grouped vitals by selected type
  const filteredVitals = React.useMemo(() => {
    if (selectedType === 'all') {
      return groupedVitals;
    }
    return groupedVitals.filter(vital => vital.type === selectedType);
  }, [groupedVitals, selectedType]);
  
  // Calculate average for vital signs
  const calculateAverage = (values, type) => {
    if (!values || values.length === 0) return null;
    
    switch (type) {
      case 'bloodPressure': {
        let systolicSum = 0;
        let diastolicSum = 0;
        let unit = 'mmHg';
        
        values.forEach(v => {
          if (v.bloodPressure) {
            systolicSum += v.bloodPressure.systolic;
            diastolicSum += v.bloodPressure.diastolic;
            unit = v.bloodPressure.unit || unit;
          }
        });
        
        const avgSystolic = Math.round(systolicSum / values.length);
        const avgDiastolic = Math.round(diastolicSum / values.length);
        
        return { systolic: avgSystolic, diastolic: avgDiastolic, unit };
      }
      
      case 'heartRate':
      case 'respiratoryRate':
      case 'temperature':
      case 'oxygenSaturation':
      case 'weight':
      case 'height':
      case 'bloodGlucose': {
        let sum = 0;
        let unit = '';
        let validCount = 0;
        
        values.forEach(v => {
          const valueObj = v[type];
          if (valueObj && typeof valueObj.value === 'number') {
            sum += valueObj.value;
            unit = valueObj.unit || unit;
            validCount++;
          }
        });
        
        if (validCount === 0) return null;
        return { value: Math.round(sum / validCount * 10) / 10, unit };
      }
      
      default:
        return null;
    }
  };
  
  // Format vital sign value based on type
  const formatVitalValue = (groupedVital) => {
    const { type, values } = groupedVital;
    const averageValue = calculateAverage(values, type);
    
    if (!averageValue) return '-';
    
    switch (type) {
      case 'bloodPressure':
        return `${averageValue.systolic}/${averageValue.diastolic} ${averageValue.unit || 'mmHg'}`;
      
      case 'heartRate':
      case 'respiratoryRate':
      case 'temperature':
      case 'oxygenSaturation':
      case 'weight':
      case 'height':
      case 'bloodGlucose':
        return `${averageValue.value} ${averageValue.unit || ''}`;
      
      default:
        return '-';
    }
  };
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };
  
  const getCombinedNotes = (groupedVital) => {
    return groupedVital.notes.filter(Boolean).join('; ') || '-';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-green-800">Vital Signs History</h2>
        
        <div className="flex items-center">
          <label htmlFor="typeFilter" className="mr-2 text-sm text-gray-600">
            Filter by:
          </label>
          <select
            id="typeFilter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Types</option>
            {vitalTypes.map(type => (
              <option key={type} value={type}>
                {VitalTypeLabels[type] || type}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-10">
          <p className="text-gray-500">Loading vital signs...</p>
        </div>
      ) : error ? (
        <div className="bg-red-100 text-red-700 p-4 rounded-md">
          {error}
        </div>
      ) : filteredVitals.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500">No vital signs recorded yet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value (Daily Average)
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVitals.map((groupedVital, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {VitalTypeLabels[groupedVital.type] || groupedVital.type}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatVitalValue(groupedVital)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {formatDate(groupedVital.date)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {getCombinedNotes(groupedVital)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VitalsList; 