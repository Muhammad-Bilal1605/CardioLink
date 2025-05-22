import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';

// Empty data structure for allergies
const emptyAllergyData = {
  medicinal: [],
  environmental: [],
  food: []
};

// Criticality indicators
const criticalityDot = {
  High: 'bg-red-500',
  Medium: 'bg-amber-500',
  Low: 'bg-green-500'
};

const RightRow2Column1 = ({ patientId: propPatientId }) => {
  const { patientId: urlPatientId } = useParams();
  const location = useLocation();
  
  // Extract patientId from URL query parameters if not available in route params or props
  const queryParams = new URLSearchParams(location.search);
  const queryPatientId = queryParams.get('patientId');
  
  // Use the prop patientId first, then URL params, then query params
  const patientId = propPatientId || urlPatientId || queryPatientId;
  
  // Log patientId for debugging
  console.log('Allergies - Patient ID from props:', propPatientId);
  console.log('Allergies - Patient ID from URL params:', urlPatientId);
  console.log('Allergies - Patient ID from query string:', queryPatientId);
  console.log('Allergies - Using patient ID:', patientId);
  
  const [allergyData, setAllergyData] = useState(emptyAllergyData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // State to track expanded categories
  const [expandedCategories, setExpandedCategories] = useState({
    medicinal: true,
    environmental: true,
    food: true
  });

  // Fetch allergies data from the backend
  useEffect(() => {
    const fetchAllergies = async () => {
      if (!patientId) return;
      
      setLoading(true);
      setError(null);
      try {
        console.log('Fetching allergies for patient ID:', patientId);
        console.log('API URL:', `http://localhost:5000/api/patients/${patientId}`);
        
        const response = await axios.get(`http://localhost:5000/api/patients/${patientId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Allergies API response:', response.data);
        
        if (response.data.success && response.data.data) {
          console.log('Patient data retrieved successfully');
          
          // Extract allergies data from the patient record
          const patient = response.data.data;
          
          if (patient.allergies) {
            // Use the new allergies structure
            setAllergyData({
              medicinal: patient.allergies.medicinal || [],
              environmental: patient.allergies.environmental || [],
              food: patient.allergies.food || []
            });
          } else {
            // No allergies data available
            setAllergyData(emptyAllergyData);
          }
        } else {
          console.log('No patient data available or invalid format');
          setError('Failed to load allergies data');
          setAllergyData(emptyAllergyData);
        }
      } catch (err) {
        console.error('Error fetching allergies data:', err);
        setError('Failed to connect to server');
        setAllergyData(emptyAllergyData);
      } finally {
        setLoading(false);
      }
    };

    fetchAllergies();
  }, [patientId]);

  // Helper to check if there are any allergies
  const hasAllergies = Object.values(allergyData).some(category => category && category.length > 0);

  // Toggle category expansion
  const toggleCategory = (category) => {
    setExpandedCategories({
      ...expandedCategories,
      [category]: !expandedCategories[category]
    });
  };

  // Format category name for display
  const formatCategoryName = (category) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col">
      {/* Simple header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800">Allergies</h2>
      </div>

      {/* Content with scrollable area */}
      <div className="flex-1 overflow-y-auto max-h-[300px]">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Loading allergies...</div>
        ) : error ? (
          <div className="p-4 text-center text-red-500">{error}</div>
        ) : !hasAllergies ? (
          <div className="p-8 text-center text-gray-500">No allergies data available</div>
        ) : (
          <div>
            {Object.entries(allergyData).map(([category, items]) => {
              // Skip empty categories
              if (!items || items.length === 0) return null;
              
              return (
                <div key={category} className="border-b border-gray-100 last:border-b-0">
                  {/* Category header */}
                  <div 
                    className="flex items-center p-3 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleCategory(category)}
                  >
                    {expandedCategories[category] ? 
                      <ChevronDown size={16} className="text-gray-500 mr-2" /> : 
                      <ChevronRight size={16} className="text-gray-500 mr-2" />
                    }
                    <h3 className="font-medium text-gray-700">{formatCategoryName(category)}</h3>
                    <span className="ml-2 text-xs text-gray-500">({items.length})</span>
                  </div>

                  {/* Category items */}
                  {expandedCategories[category] && (
                    <div className="pl-8 pr-3 pb-3">
                      <table className="w-full text-sm">
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-gray-50 last:border-b-0">
                              <td className="py-2 pr-2 text-gray-800">
                                {item.name}
                                {item.reaction && (
                                  <span className="text-xs text-gray-500 ml-2">({item.reaction})</span>
                                )}
                              </td>
                              <td className="py-2 w-24 text-right">
                                <div className="flex items-center justify-end">
                                  <div className={`w-2 h-2 rounded-full ${criticalityDot[item.criticality]} mr-1`}></div>
                                  <span className={`text-xs ${
                                    item.criticality === 'High' ? 'text-red-700' : 
                                    item.criticality === 'Medium' ? 'text-amber-700' : 
                                    'text-green-700'
                                  }`}>{item.criticality}</span>
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
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RightRow2Column1;
