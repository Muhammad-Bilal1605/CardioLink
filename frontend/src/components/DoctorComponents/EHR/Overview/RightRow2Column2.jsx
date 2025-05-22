// src/components/Overview/RightRow2Column2.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Thermometer, Heart, Activity, Droplet } from 'lucide-react';

// Register chart elements
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

// Empty data structure with no fallback values
const emptyVitalData = {
  heartRate: [],
  bloodPressure: [],
  oxygen: [],
  temperature: [],
  dates: []
};

const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

export default function RightRow2Column2({ patientId: propPatientId }) {
  const { patientId: urlPatientId } = useParams();
  const location = useLocation();
  
  // Extract patientId from URL query parameters if not available in route params or props
  const queryParams = new URLSearchParams(location.search);
  const queryPatientId = queryParams.get('patientId');
  
  // Use the prop patientId first, then URL params, then query params
  const patientId = propPatientId || urlPatientId || queryPatientId;
  
  // Log patientId for debugging
  console.log('VitalSigns - Patient ID from props:', propPatientId);
  console.log('VitalSigns - Patient ID from URL params:', urlPatientId);
  console.log('VitalSigns - Patient ID from query string:', queryPatientId);
  console.log('VitalSigns - Using patient ID:', patientId);
  
  const [selected, setSelected] = useState('heartRate');
  const [isMobile, setIsMobile] = useState(false);
  const [vitalData, setVitalData] = useState(emptyVitalData);
  const [loading, setLoading] = useState(false);
  const chartContainerRef = useRef(null);

  // Group vital signs by date and calculate averages
  const groupVitalsByDate = (vitals) => {
    // Group vitals by date (day only)
    const groups = {};
    
    vitals.forEach(vital => {
      // Get date part only (without time)
      const date = new Date(vital.date);
      const dateKey = date.toISOString().split('T')[0];
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          date: dateKey,
          heartRateValues: [],
          bloodPressureValues: [],
          oxygenValues: [],
          temperatureValues: []
        };
      }
      
      // Add values to their respective arrays
      if (vital.heartRate && typeof vital.heartRate.value === 'number') {
        groups[dateKey].heartRateValues.push(vital.heartRate.value);
      }
      
      if (vital.bloodPressure && typeof vital.bloodPressure.systolic === 'number' && typeof vital.bloodPressure.diastolic === 'number') {
        groups[dateKey].bloodPressureValues.push({
          systolic: vital.bloodPressure.systolic,
          diastolic: vital.bloodPressure.diastolic
        });
      }
      
      if (vital.oxygenSaturation && typeof vital.oxygenSaturation.value === 'number') {
        groups[dateKey].oxygenValues.push(vital.oxygenSaturation.value);
      }
      
      if (vital.temperature && typeof vital.temperature.value === 'number') {
        groups[dateKey].temperatureValues.push(vital.temperature.value);
      }
    });
    
    // Calculate averages for each date
    const result = Object.values(groups).map(group => {
      // Calculate heart rate average
      const heartRateAvg = group.heartRateValues.length > 0
        ? Math.round(group.heartRateValues.reduce((a, b) => a + b, 0) / group.heartRateValues.length)
        : null;
      
      // Calculate blood pressure average
      let bloodPressureAvg = null;
      if (group.bloodPressureValues.length > 0) {
        const systolicSum = group.bloodPressureValues.reduce((a, b) => a + b.systolic, 0);
        const diastolicSum = group.bloodPressureValues.reduce((a, b) => a + b.diastolic, 0);
        const systolicAvg = Math.round(systolicSum / group.bloodPressureValues.length);
        const diastolicAvg = Math.round(diastolicSum / group.bloodPressureValues.length);
        bloodPressureAvg = `${systolicAvg}/${diastolicAvg}`;
      }
      
      // Calculate oxygen average
      const oxygenAvg = group.oxygenValues.length > 0
        ? Math.round(group.oxygenValues.reduce((a, b) => a + b, 0) / group.oxygenValues.length)
        : null;
      
      // Calculate temperature average
      const temperatureAvg = group.temperatureValues.length > 0
        ? Number((group.temperatureValues.reduce((a, b) => a + b, 0) / group.temperatureValues.length).toFixed(1))
        : null;
      
      return {
        date: group.date,
        heartRate: heartRateAvg,
        bloodPressure: bloodPressureAvg,
        oxygen: oxygenAvg,
        temperature: temperatureAvg
      };
    });
    
    // Sort by date (oldest to newest)
    return result.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // Fetch vital signs data from the backend
  useEffect(() => {
    const fetchVitalSigns = async () => {
      if (!patientId) return;
      
      setLoading(true);
      try {
        // Get last 7 days of vital signs for this patient
        console.log('Fetching vital signs for patient ID:', patientId);
        console.log('API URL:', `http://localhost:5000/api/vital-signs/patient/${patientId}?limit=50`);
        
        const response = await axios.get(`http://localhost:5000/api/vital-signs/patient/${patientId}?limit=50`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        console.log('Vital signs API response:', response.data);
        
        if (response.data.success && Array.isArray(response.data.data) && response.data.data.length > 0) {
          console.log('Vital signs data available:', response.data.data.length, 'records');
          
          // Group and average vital signs by date
          const groupedVitals = groupVitalsByDate(response.data.data);
          
          // Take only the last 7 days of data if we have more
          const recentVitals = groupedVitals.slice(-7);
          
          // Extract heart rate, blood pressure, oxygen saturation, and temperature data
          const processedData = {
            heartRate: recentVitals.map(v => v.heartRate).filter(Boolean),
            bloodPressure: recentVitals.map(v => v.bloodPressure).filter(Boolean),
            oxygen: recentVitals.map(v => v.oxygen).filter(Boolean),
            temperature: recentVitals.map(v => v.temperature).filter(Boolean),
            dates: recentVitals.map(v => v.date)
          };
          
          setVitalData(processedData);
        } else {
          console.log('No vital signs data available or invalid format');
          setVitalData(emptyVitalData);
        }
      } catch (err) {
        console.error('Error fetching vital signs data:', err);
        if (err.response) {
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
        }
        setVitalData(emptyVitalData);
      } finally {
        setLoading(false);
      }
    };

    fetchVitalSigns();
  }, [patientId]);

  // Check screen size and adjust chart container on resize
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkSize();

    // Listen for resize events
    window.addEventListener('resize', checkSize);

    // Clean up
    return () => {
      window.removeEventListener('resize', checkSize);
    };
  }, []);

  function getChart() {
    let datasets = [];
    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: !isMobile,
          position: 'top',
          labels: { boxWidth: 10, font: { size: 12 } }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          titleFont: { size: isMobile ? 10 : 14 },
          bodyFont: { size: isMobile ? 10 : 14 },
          padding: isMobile ? 6 : 10,
        }
      },
      scales: {
        y: { 
          beginAtZero: false,
          ticks: { 
            font: { size: isMobile ? 8 : 12 },
            maxTicksLimit: 5
          }
        },
        x: {
          ticks: { 
            font: { size: isMobile ? 8 : 12 }
          }
        }
      },
      elements: {
        point: {
          radius: isMobile ? 2 : 3,
          hoverRadius: isMobile ? 4 : 6
        },
        line: {
          tension: 0.3,
          borderWidth: isMobile ? 1 : 2
        }
      }
    };

    // No data available for the selected vital type
    if (!vitalData[selected] || vitalData[selected].length === 0) {
      return { 
        labels: [], 
        datasets: [], 
        options 
      };
    }

    // Generate date labels based on actual data dates
    const labels = vitalData.dates ? vitalData.dates.map(dateStr => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }) : days;

    switch(selected) {
      case 'heartRate':
        datasets = [{
          label: 'BPM',
          data: vitalData.heartRate,
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239,68,68,0.1)',
          fill: true,
        }];
        break;
      case 'bloodPressure':
        const sys = vitalData.bloodPressure.map(v => +v.split('/')[0]);
        const dia = vitalData.bloodPressure.map(v => +v.split('/')[1]);
        datasets = [
          { 
            label: 'Systolic (mmHg)', 
            data: sys, 
            borderColor: '#3b82f6', 
            backgroundColor: 'rgba(59,130,246,0.1)', 
            fill: true
          },
          { 
            label: 'Diastolic (mmHg)', 
            data: dia, 
            borderColor: '#10b981', 
            backgroundColor: 'rgba(16,185,129,0.1)', 
            fill: true
          }
        ];
        break;
      case 'oxygen':
        datasets = [{ 
          label: '% SpO₂', 
          data: vitalData.oxygen, 
          borderColor: '#8b5cf6', 
          backgroundColor: 'rgba(139,92,246,0.1)', 
          fill: true
        }];
        
        // Set specific range for oxygen
        options.scales.y.min = 90;
        options.scales.y.max = 100;
        break;
      case 'temperature':
        datasets = [{ 
          label: '°C', 
          data: vitalData.temperature, 
          borderColor: '#f59e0b', 
          backgroundColor: 'rgba(245,158,11,0.1)', 
          fill: true
        }];
        
        // Set specific range for temperature
        options.scales.y.min = 36;
        options.scales.y.max = 38;
        break;
      default:
        datasets = [];
    }
    
    return { 
      labels: labels.length > 0 ? labels : [], 
      datasets, 
      options 
    };
  }

  const icons = {
    heartRate: <Heart className="w-4 h-4 text-red-500" />, 
    bloodPressure: <Activity className="w-4 h-4 text-blue-500" />, 
    oxygen: <Droplet className="w-4 h-4 text-purple-500" />, 
    temperature: <Thermometer className="w-4 h-4 text-yellow-500" />
  };

  // Check if there is data for any vital sign
  const hasAnyData = Object.keys(vitalData)
    .filter(key => key !== 'dates')
    .some(key => vitalData[key].length > 0);

  const recent = {
    heartRate: vitalData.heartRate.length > 0 ? `${vitalData.heartRate.slice(-1)[0]} bpm` : 'N/A',
    bloodPressure: vitalData.bloodPressure.length > 0 ? vitalData.bloodPressure.slice(-1)[0] + ' mmHg' : 'N/A',
    oxygen: vitalData.oxygen.length > 0 ? vitalData.oxygen.slice(-1)[0] + ' %' : 'N/A',
    temperature: vitalData.temperature.length > 0 ? vitalData.temperature.slice(-1)[0] + ' °C' : 'N/A'
  };

  const chartData = getChart();

  return (
    <div className="bg-white rounded-lg shadow-md p-3 w-full">
      <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
        Vital Signs <Activity className="ml-2 text-blue-500" />
        <span className="ml-auto text-xs text-gray-500 font-normal">Daily Averages</span>
      </h3>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <p className="text-gray-500">Loading vital signs data...</p>
        </div>
      ) : !hasAnyData ? (
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-500">No vital signs data available</p>
        </div>
      ) : (
        <>
          {/* Vital signs cards - 2x2 grid on mobile, 4x1 on larger screens */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
            {Object.keys(recent).map(key => (
              <div 
                key={key} 
                className={`flex items-center p-2 bg-gray-50 rounded-lg border transition-all ${
                  selected === key ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelected(key)}
                style={{ cursor: 'pointer' }}
              >
                <div className="p-1 bg-white rounded-full shadow-sm mr-2">
                  {icons[key]}
                </div>
                <div>
                  <div className="text-xs text-gray-500 capitalize">
                    {key.replace(/([A-Z])/g,' $1')}
                  </div>
                  <div className="text-sm font-semibold text-gray-800">{recent[key]}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Chart container */}
          <div 
            className="h-40 md:h-56 mt-3" 
            ref={chartContainerRef}
          >
            {/* Show no data message when the selected vital type has no data */}
            {(!vitalData[selected] || vitalData[selected].length === 0) ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded">
                <p className="text-gray-500 text-sm">No data available for {selected.replace(/([A-Z])/g,' $1').toLowerCase()}</p>
              </div>
            ) : (
              <Line 
                data={chartData} 
                options={chartData.options}
              />
            )}
          </div>

          {/* Additional metrics for tablets and larger */}
          <div className="grid grid-cols-3 gap-2 mt-3 text-xs md:text-sm">
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-gray-500 mb-1">Weekly Average</div>
              <div className="font-medium">
                {selected === 'heartRate' && vitalData.heartRate.length > 0 && 
                  `${Math.round(vitalData.heartRate.reduce((a,b)=>a+b,0)/vitalData.heartRate.length)} bpm`}
                {selected === 'bloodPressure' && vitalData.bloodPressure.length > 0 && 
                  (() => {
                    const sys = vitalData.bloodPressure.map(v => +v.split('/')[0]);
                    const dia = vitalData.bloodPressure.map(v => +v.split('/')[1]);
                    const avgSys = Math.round(sys.reduce((a,b)=>a+b,0)/sys.length);
                    const avgDia = Math.round(dia.reduce((a,b)=>a+b,0)/dia.length);
                    return `${avgSys}/${avgDia} mmHg`;
                  })()}
                {selected === 'oxygen' && vitalData.oxygen.length > 0 && 
                  `${Math.round(vitalData.oxygen.reduce((a,b)=>a+b,0)/vitalData.oxygen.length)} %`}
                {selected === 'temperature' && vitalData.temperature.length > 0 && 
                  `${(vitalData.temperature.reduce((a,b)=>a+b,0)/vitalData.temperature.length).toFixed(1)} °C`}
                {vitalData[selected].length === 0 && 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-gray-500 mb-1">Range</div>
              <div className="font-medium">
                {selected === 'heartRate' && vitalData.heartRate.length > 0 && 
                  `${Math.min(...vitalData.heartRate)}-${Math.max(...vitalData.heartRate)} bpm`}
                {selected === 'bloodPressure' && vitalData.bloodPressure.length > 0 && 
                  (() => {
                    const sys = vitalData.bloodPressure.map(v => +v.split('/')[0]);
                    const dia = vitalData.bloodPressure.map(v => +v.split('/')[1]);
                    return `${Math.min(...sys)}-${Math.max(...sys)}/${Math.min(...dia)}-${Math.max(...dia)}`;
                  })()}
                {selected === 'oxygen' && vitalData.oxygen.length > 0 && 
                  `${Math.min(...vitalData.oxygen)}-${Math.max(...vitalData.oxygen)} %`}
                {selected === 'temperature' && vitalData.temperature.length > 0 && 
                  `${Math.min(...vitalData.temperature)}-${Math.max(...vitalData.temperature)} °C`}
                {vitalData[selected].length === 0 && 'N/A'}
              </div>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg">
              <div className="text-gray-500 mb-1">Status</div>
              <div className="font-medium">
                {selected === 'heartRate' && getHeartRateStatus(vitalData.heartRate.slice(-1)[0])}
                {selected === 'bloodPressure' && getBloodPressureStatus(vitalData.bloodPressure.slice(-1)[0])}
                {selected === 'oxygen' && getOxygenStatus(vitalData.oxygen.slice(-1)[0])}
                {selected === 'temperature' && getTemperatureStatus(vitalData.temperature.slice(-1)[0])}
                {vitalData[selected].length === 0 && 'N/A'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Helper functions to determine vital sign status
function getHeartRateStatus(rate) {
  if (!rate) return 'N/A';
  if (rate < 60) return 'Low';
  if (rate > 100) return 'High';
  return 'Normal';
}

function getBloodPressureStatus(bp) {
  if (!bp) return 'N/A';
  const [systolic, diastolic] = bp.split('/').map(Number);
  if (systolic < 90 || diastolic < 60) return 'Low';
  if (systolic >= 140 || diastolic >= 90) return 'High';
  return 'Normal';
}

function getOxygenStatus(oxygen) {
  if (!oxygen) return 'N/A';
  if (oxygen < 95) return 'Low';
  return 'Normal';
}

function getTemperatureStatus(temp) {
  if (!temp) return 'N/A';
  if (temp < 36) return 'Low';
  if (temp > 37.5) return 'High';
  return 'Normal';
}