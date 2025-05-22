import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';

// Define event types with their visual properties 38b2ac 
const eventTypes = [
  { key: 'visits', label: 'Visits', color: '#f56565', icon: '👨‍⚕️' },
  { key: 'hospitalizations', label: 'Hospitalizations', color: '#4299e1', icon: '🏥' },
  { key: 'procedures', label: 'Procedures', color: '#9f7aea', icon: '⚕️' },
  { key: 'labs', label: 'Labs', color: '#38b2ac', icon: '🧪' },
  { key: 'imaging', label: 'Imaging', color: '#ecc94b', icon: '🔬' }
];

const RightRow1 = ({ patientId: propPatientId }) => {
  const { patientId: urlPatientId } = useParams();
  const location = useLocation();
  
  // Extract patientId from URL query parameters if not available in route params or props
  const queryParams = new URLSearchParams(location.search);
  const queryPatientId = queryParams.get('patientId');
  
  // Use the prop patientId first, then URL params, then query params
  const patientId = propPatientId || urlPatientId || queryPatientId;
  
  // Log patientId for debugging
  console.log('RightRow1 - Patient ID from props:', propPatientId);
  console.log('RightRow1 - Patient ID from URL params:', urlPatientId);
  console.log('RightRow1 - Patient ID from query string:', queryPatientId);
  console.log('RightRow1 - Using patient ID:', patientId);
  
  const [viewMode, setViewMode] = useState('years');
  const [activeYear, setActiveYear] = useState(2023);
  const [activeMonth, setActiveMonth] = useState(1);
  const [activeDay, setActiveDay] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  // New state for active event types filter
  const [activeEventTypes, setActiveEventTypes] = useState(eventTypes.map(type => type.key));
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Combined ref for the timeline container
  const timelineContainerRef = useRef(null);
  
  // Fetch data from all the required endpoints
  useEffect(() => {
    const fetchAllPatientData = async () => {
      if (!patientId) return;
      
      setLoading(true);
      try {
        // Fetch data from all endpoints in parallel
        console.log('Fetching medical timeline data for patient:', patientId);
        
        const [visitsRes, hospitalizationsRes, proceduresRes, labsRes, imagingRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/visits/patient/${patientId}`, {
            headers: { 'Content-Type': 'application/json' }
          }),
          axios.get(`http://localhost:5000/api/hospitalizations/patient/${patientId}`, {
            headers: { 'Content-Type': 'application/json' }
          }),
          axios.get(`http://localhost:5000/api/procedures/patient/${patientId}`, {
            headers: { 'Content-Type': 'application/json' }
          }),
          axios.get(`http://localhost:5000/api/lab-results/patient/${patientId}`, {
            headers: { 'Content-Type': 'application/json' }
          }),
          axios.get(`http://localhost:5000/api/imaging/patient/${patientId}`, {
            headers: { 'Content-Type': 'application/json' }
          })
        ]);

        // Log API responses for debugging
        console.log('Visits API response:', visitsRes.data);
        console.log('Hospitalizations API response:', hospitalizationsRes.data);
        console.log('Procedures API response:', proceduresRes.data);
        console.log('Labs API response:', labsRes.data);
        console.log('Imaging API response:', imagingRes.data);

        // Helper function to safely convert date to ISO string
        const safeToISOString = (dateStr) => {
          try {
            const date = new Date(dateStr);
            // Check if the date is valid
            if (isNaN(date.getTime())) {
              console.warn('Invalid date encountered:', dateStr);
              return new Date().toISOString(); // Use current date as fallback
            }
            return date.toISOString();
          } catch (error) {
            console.warn('Error converting date to ISO string:', dateStr, error);
            return new Date().toISOString(); // Use current date as fallback
          }
        };

        // Process visits data with detailed logging
        console.log('Processing visits data:', visitsRes.data.data);
        const visits = visitsRes.data.success && Array.isArray(visitsRes.data.data) ? 
          visitsRes.data.data.map(visit => {
            if (!visit.date) console.warn('Visit missing date field:', visit);
            return {
              id: `visit-${visit._id}`,
              date: safeToISOString(visit.date),
              type: 'visits',
              typeLabel: 'Visit',
              color: '#f56565',
              icon: '👨‍⚕️',
              department: visit.facility,
              doctor: visit.doctor,
              details: visit.diagnosis,
              fullData: visit
            };
          }) : [];
        
        // Process hospitalizations data with detailed logging
        console.log('Processing hospitalizations data:', hospitalizationsRes.data.data);
        const hospitalizations = hospitalizationsRes.data.success && Array.isArray(hospitalizationsRes.data.data) ?
          hospitalizationsRes.data.data.map(hospitalization => {
            if (!hospitalization.admissionDate) console.warn('Hospitalization missing admissionDate field:', hospitalization);
            return {
              id: `hospitalization-${hospitalization._id}`,
              date: safeToISOString(hospitalization.admissionDate),
              type: 'hospitalizations',
              typeLabel: 'Hospitalization',
              color: '#4299e1',
              icon: '🏥',
              department: hospitalization.hospital,
              doctor: hospitalization.attendingPhysician,
              details: hospitalization.reason,
              fullData: hospitalization
            };
          }) : [];
        
        // Process procedures data with detailed logging
        console.log('Processing procedures data:', proceduresRes.data.data);
        const procedures = proceduresRes.data.success && Array.isArray(proceduresRes.data.data) ?
          proceduresRes.data.data.map(procedure => {
            if (!procedure.date) console.warn('Procedure missing date field:', procedure);
            return {
              id: `procedure-${procedure._id}`,
              date: safeToISOString(procedure.date),
              type: 'procedures',
              typeLabel: 'Procedure',
              color: '#9f7aea',
              icon: '⚕️',
              department: procedure.hospital,
              doctor: procedure.physician,
              details: procedure.procedureName,
              fullData: procedure
            };
          }) : [];
        
        // Process labs data with detailed logging
        console.log('Processing labs data:', labsRes.data.data);
        const labs = labsRes.data.success && Array.isArray(labsRes.data.data) ?
          labsRes.data.data.map(lab => {
            if (!lab.date) console.warn('Lab missing date field:', lab);
            return {
              id: `lab-${lab._id}`,
              date: safeToISOString(lab.date),
              type: 'labs',
              typeLabel: 'Lab Test',
              color: '#38b2ac',
              icon: '🧪',
              department: lab.facility,
              doctor: lab.doctor,
              details: lab.testName,
              fullData: lab
            };
          }) : [];
        
        // Process imaging data with detailed logging
        console.log('Processing imaging data:', imagingRes.data.data);
        const imaging = imagingRes.data.success && Array.isArray(imagingRes.data.data) ?
          imagingRes.data.data.map(image => {
            if (!image.date) console.warn('Imaging missing date field:', image);
            return {
              id: `imaging-${image._id}`,
              date: safeToISOString(image.date),
              type: 'imaging',
              typeLabel: 'Imaging',
              color: '#ecc94b',
              icon: '🔬',
              department: image.facility,
              doctor: image.doctor,
              details: image.type,
              fullData: image
            };
          }) : [];
    
        // Combine all events and sort by date
        const combinedEvents = [...visits, ...hospitalizations, ...procedures, ...labs, ...imaging]
          .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date ascending (oldest first)
        
        setAllEvents(combinedEvents);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError('Failed to fetch patient medical events');
      } finally {
        setLoading(false);
      }
    };

    fetchAllPatientData();
  }, [patientId]);
  
  // Check screen size for responsive design
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);
  
  // Extract all years from data to build the timeline
  const availableYears = useMemo(() => {
    const years = Array.from(
      new Set(allEvents.map(event => new Date(event.date).getFullYear()))
    ).sort();
    
    // If no data available, provide default range ending with current year
    if (years.length === 0) {
      const currentYear = new Date().getFullYear();
      return [currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
    }
    
    // Only take the latest 4 years
    return years.length > 4 ? years.slice(-4) : years;
  }, [allEvents]);
  
  // Get timeframe units based on view mode
  const timeframeUnits = useMemo(() => {
    switch (viewMode) {
      case 'years':
        return availableYears;
      case 'months':
        return Array.from({ length: 12 }, (_, i) => {
          const date = new Date(activeYear, i, 1);
          return date.toLocaleString('default', { month: 'short' });
        });
      case 'days':
        // Get correct number of days for the selected month
        const daysInMonth = new Date(activeYear, activeMonth, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
      default:
        return [];
    }
  }, [viewMode, activeYear, activeMonth, availableYears]);
  
  // Filter events based on the active timeframe AND active event types
  const filteredEvents = useMemo(() => {
    // First filter by timeframe
    let timeframeFiltered;
    switch (viewMode) {
      case 'years':
        timeframeFiltered = allEvents;
        break;
      case 'months':
        timeframeFiltered = allEvents.filter(event => {
          const date = new Date(event.date);
          return date.getFullYear() === activeYear;
        });
        break;
      case 'days':
        timeframeFiltered = allEvents.filter(event => {
          const date = new Date(event.date);
          return date.getFullYear() === activeYear && 
                 date.getMonth() === activeMonth - 1;
        });
        break;
      default:
        timeframeFiltered = [];
    }
    
    // Then filter by active event types
    return timeframeFiltered.filter(event => activeEventTypes.includes(event.type));
  }, [allEvents, viewMode, activeYear, activeMonth, activeEventTypes]);
  
  // Group events by timeframe unit for visualization
  const eventsByUnit = useMemo(() => {
    const grouped = {};
    
    timeframeUnits.forEach(unit => {
      grouped[unit] = [];
    });
    
    filteredEvents.forEach(event => {
      const date = new Date(event.date);
      let unitKey;
      
      switch (viewMode) {
        case 'years':
          unitKey = date.getFullYear();
          break;
        case 'months':
          unitKey = date.toLocaleString('default', { month: 'short' });
          break;
        case 'days':
          unitKey = date.getDate();
          break;
        default:
          return;
      }
      
      if (grouped[unitKey]) {
        grouped[unitKey].push(event);
      }
    });
    
    return grouped;
  }, [filteredEvents, timeframeUnits, viewMode]);
  
  // Handle scroll left
  const scrollLeft = () => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollBy({
        left: -300,
        behavior: 'smooth'
      });
    }
  };

  // Handle scroll right
  const scrollRight = () => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollBy({
        left: 300,
        behavior: 'smooth'
      });
    }
  };
  
  // Change view mode
  const changeViewMode = (mode) => {
    setViewMode(mode);
    // Reset scroll position when changing modes
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollLeft = 0;
    }
  };
  
  // Handle year click
  const handleYearClick = (year) => {
    setActiveYear(year);
    changeViewMode('months');
  };
  
  // Handle month click
  const handleMonthClick = (monthName) => {
    // Convert month name to index (0-11)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIdx = monthNames.findIndex(m => m === monthName);
    if (monthIdx !== -1) {
      setActiveMonth(monthIdx + 1); // Convert to 1-12 format
      changeViewMode('days');
    }
  };
  
  // Handle day click
  const handleDayClick = (day) => {
    setActiveDay(day);
    // We removed hours view so we don't navigate further
  };
  
  // Handle event click
  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setShowEventDetails(true);
  };
  
  // Close event details
  const closeEventDetails = () => {
    setShowEventDetails(false);
    // Optional: Add a delay before removing the data to allow for smooth animation
    setTimeout(() => {
      setSelectedEvent(null);
    }, 300);
  };
  
  // Reset to years view
  const resetToYearsView = () => {
    setViewMode('years');
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollLeft = 0;
    }
  };

  // Toggle event type filter
  const toggleEventType = (eventTypeKey) => {
    setActiveEventTypes(prev => {
      if (prev.includes(eventTypeKey)) {
        // If it's the only active type, don't remove it
        if (prev.length === 1) return prev;
        // Otherwise remove it
        return prev.filter(type => type !== eventTypeKey);
      } else {
        // Add it
        return [...prev, eventTypeKey];
      }
    });
  };

  // Show all event types
  const showAllEventTypes = () => {
    setActiveEventTypes(eventTypes.map(type => type.key));
  };

  // Helper to render event content
  const renderEventDetailContent = () => {
    if (!selectedEvent) return null;
    
    switch (selectedEvent.type) {
      case 'visits':
        const visit = selectedEvent.fullData;
        return (
          <>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Doctor:</span>
              <div className="font-medium">{visit.doctor}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Symptoms:</span>
              <div className="font-medium">{visit.symptoms}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Diagnosis:</span>
              <div className="font-medium">{visit.diagnosis}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Prescribed Medicine:</span>
              <div className="font-medium">{visit.prescribedMedicine}</div>
            </div>
            {visit.prescribedTests && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Tests Ordered:</span>
                <div className="font-medium">{visit.prescribedTests}</div>
              </div>
            )}
            {visit.doctorComments && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Doctor Comments:</span>
                <div className="font-medium">{visit.doctorComments}</div>
              </div>
            )}
          </>
        );
      
      case 'hospitalizations':
        const hosp = selectedEvent.fullData;
        return (
          <>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Reason:</span>
              <div className="font-medium">{hosp.reason}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Admission Type:</span>
              <div className="font-medium">{hosp.admissionType}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Physician:</span>
              <div className="font-medium">{hosp.attendingPhysician}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Duration:</span>
              <div className="font-medium">{hosp.durationOfStay}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Procedures:</span>
              <div className="font-medium">
                {hosp.proceduresDone?.length
                  ? hosp.proceduresDone.join(', ')
                  : 'None'}
              </div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Outcome:</span>
              <div className="font-medium">{hosp.outcome}</div>
            </div>
            {hosp.dischargeSummary && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Discharge Summary:</span>
                <div className="font-medium">{hosp.dischargeSummary}</div>
              </div>
            )}
          </>
        );
        
      case 'procedures':
        const procedure = selectedEvent.fullData;
        return (
          <>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Procedure:</span>
              <div className="font-bold">{procedure.procedureName}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Physician:</span>
              <div className="font-medium">{procedure.physician}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Indication:</span>
              <div className="font-medium">{procedure.indication}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Findings:</span>
              <div className="font-medium">{procedure.findings}</div>
            </div>
            {procedure.complications && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Complications:</span>
                <div className="font-medium">{procedure.complications}</div>
              </div>
            )}
            {procedure.followUpPlan && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Follow-up Plan:</span>
                <div className="font-medium">{procedure.followUpPlan}</div>
              </div>
            )}
          </>
        );
        
      case 'labs':
        const lab = selectedEvent.fullData;
        return (
          <>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Test:</span>
              <div className="font-bold">{lab.testName}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Ordered By:</span>
              <div className="font-medium">{lab.doctor}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Results:</span>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                {Object.entries(lab.results).map(([key, value]) => (
                  key !== 'comments' ? (
                    <div key={key} className="flex justify-between border-b border-gray-100 py-1">
                      <span className="capitalize">{key}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ) : null
                ))}
                {lab.results?.comments && (
                  <div className="mt-2 text-gray-600">
                    <span className="font-medium">Comments: </span>
                    {lab.results.comments}
                  </div>
                )}
              </div>
            </div>
          </>
        );
        
      case 'imaging':
        const image = selectedEvent.fullData;
        return (
          <>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Image Type:</span>
              <div className="font-bold">{image.type}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Ordered By:</span>
              <div className="font-medium">{image.doctor}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Findings:</span>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                <div className="mb-2">
                  <span className="font-medium">Findings: </span>
                  {image.results?.findings}
                </div>
                <div>
                  <span className="font-medium">Impression: </span>
                  {image.results?.impression}
                </div>
              </div>
            </div>
          </>
        );
        
      default:
        return (
          <div className="text-gray-500">
            No detailed information available for this event.
          </div>
        );
    }
  };
  
  // Calculate width for the container based on number of units and unit width
  const calculateContainerWidth = () => {
    const unitWidth = 128; // 32px × 4 (w-32 class)
    const containerWidth = timeframeUnits.length * unitWidth;
    // Set a minimum width to fit the container but don't add extra space
    return Math.max(containerWidth, window.innerWidth) + 'px';
  }

  return (
    <div className="w-full bg-white shadow-md rounded-lg overflow-hidden relative">
      {/* Header section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              Patient Medical Timeline
            </h2>
            <button 
              onClick={resetToYearsView} 
              className="ml-3 px-3 py-1.5 bg-blue-50 hover:bg-blue-200 rounded-md text-blue-700 font-medium flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Reset
            </button>
          </div>
          
          {/* View mode tabs */}
          <div className="flex space-x-1 text-sm overflow-x-auto">
            {['years', 'months', 'days'].map(mode => (
              <button
                key={mode}
                onClick={() => changeViewMode(mode)}
                className={`px-3 py-1 rounded-md capitalize whitespace-nowrap ${
                  viewMode === mode 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>
        
        {/* Event type filter buttons */}
        <div className="mt-4 mb-2">
          <div className="text-sm font-medium text-gray-700 mb-2">Filter Events:</div>
          <div className="flex flex-wrap gap-2">
            {eventTypes.map(type => (
              <button
                key={type.key}
                onClick={() => toggleEventType(type.key)}
                className={`flex items-center px-3 py-1 rounded-full text-xs transition-colors ${
                  activeEventTypes.includes(type.key)
                    ? 'bg-opacity-100 text-white'
                    : 'bg-opacity-20 text-gray-700'
                }`}
                style={{ 
                  backgroundColor: activeEventTypes.includes(type.key) 
                    ? type.color 
                    : `${type.color}20` 
                }}
              >
                <span className="mr-1">{type.icon}</span>
                {isMobile ? type.label.charAt(0) : type.label}
              </button>
            ))}
            <button
              onClick={showAllEventTypes}
              className="px-3 py-1 rounded-full text-xs bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Show All
            </button>
          </div>
        </div>
        
        {/* Navigation title */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm font-medium text-gray-700">
            {viewMode === 'years' && 'All Years'}
            {viewMode === 'months' && `${activeYear}`}
            {viewMode === 'days' && `${new Date(activeYear, activeMonth - 1).toLocaleString('default', { month: 'long' })} ${activeYear}`}
          </div>
          
          {/* Event count badge */}
          <div className="text-xs bg-gray-100 rounded-full px-2 py-1">
            {filteredEvents.length} Events
          </div>
        </div>
      </div>
      
      {/* Show "no events" message when no events match the filters */}
      {filteredEvents.length === 0 && !loading && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-3xl mb-2">🔍</div>
          <p>No events match your current filters.</p>
          <button
            onClick={showAllEventTypes}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
          >
            Show All Event Types
          </button>
        </div>
      )}
      
      {/* Loading indicator */}
      {loading && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-3xl mb-2">⏳</div>
          <p>Loading medical timeline data...</p>
        </div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="p-8 text-center text-red-500">
          <div className="text-3xl mb-2">⚠️</div>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded-md text-sm"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Improved timeline visualization with single scrollbar */}
      {filteredEvents.length > 0 && !loading && !error && (
        <div className="w-full overflow-hidden relative">
          {/* Scroll buttons */}
          <div className="absolute top-1/2 left-0 transform -translate-y-1/2 z-10">
            <button 
              onClick={scrollLeft}
              className="bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-r-md shadow-md text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="absolute top-1/2 right-0 transform -translate-y-1/2 z-10">
            <button 
              onClick={scrollRight}
              className="bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-l-md shadow-md text-gray-600 hover:text-gray-800 focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {/* Combined timeline container with a single scrollbar */}
          <div 
            ref={timelineContainerRef}
            className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 scroll-smooth"
            style={{ 
              scrollbarWidth: 'thin', 
              msOverflowStyle: 'none',
              width: '100%' // Enforce 100% width to fill available space
            }}
          >
            <div className="flex flex-col min-w-full" style={{ width: calculateContainerWidth() }}>
              {/* Column headers */}
              <div className="flex border-b border-gray-200">
              {timeframeUnits.map((unit, idx) => (
                <div 
                  key={`header-${unit}`}
                  className="flex-1 py-2 px-1 text-center text-sm font-medium text-gray-700 border-r border-gray-100"
                  onClick={() => {
                    if (viewMode === 'years') handleYearClick(unit);
                    else if (viewMode === 'months') handleMonthClick(unit);
                    else if (viewMode === 'days') handleDayClick(unit);
                  }}
                  style={{ 
                    cursor: ['years', 'months', 'days'].includes(viewMode) ? 'pointer' : 'default',
                    minWidth: '120px' // Set a minimum width for the columns
                  }}
                >
                  {unit}
                </div>
              ))}
              </div>
              
              {/* Events grid */}
              <div className="flex h-64">
                {timeframeUnits.map(unit => (
                  <div 
                    key={`events-${unit}`} 
                    className="flex-1 relative border-r border-gray-100 h-full overflow-y-auto"
                    style={{ minWidth: '120px' }} // Set a minimum width for consistency
                  >                    {/* Events for this unit */}
                    {eventsByUnit[unit]?.length > 0 && (
                      <div className="py-2 px-1">
                        {eventsByUnit[unit].map((event, idx) => (
                          <div
                            key={`${event.id}-${idx}`}
                            className="flex items-center mb-2 p-1 rounded cursor-pointer hover:bg-gray-50"
                            onClick={() => handleEventClick(event)}
                          >
                            <div 
                              className="w-6 h-6 rounded-full flex items-center justify-center mr-2 text-xs"
                              style={{ backgroundColor: event.color }}
                            >
                              <span className="text-white">{event.icon}</span>
                            </div>
                            <div className="text-xs truncate flex-1">
                              <div className="font-medium truncate">{event.details}</div>
                              <div className="text-gray-500">
                                {new Date(event.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Event details sliding panel */}
      <div 
        className={`fixed top-0 right-0 h-full bg-white shadow-lg z-50 overflow-y-auto w-full max-w-sm transition-transform duration-300 transform ${
          showEventDetails ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {selectedEvent && (
          <>
            {/* Header with background color matching event type */}
            <div 
              className="p-4 border-b border-gray-200 flex justify-between items-center"
              style={{ backgroundColor: `${selectedEvent.color}20` }}
            >
              <h3 className="font-medium flex items-center">
                <span className="mr-2">{selectedEvent.icon}</span>
                {selectedEvent.typeLabel} - {selectedEvent.department}
              </h3>
              <button 
                onClick={closeEventDetails}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full h-8 w-8 flex items-center justify-center"
              >
                &times;
              </button>
            </div>
            
            {/* Event details */}
            <div className="p-4">
              <div className="mb-3">
                <span className="text-sm text-gray-500">Date:</span>
                <div className="font-medium">
                  {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
              
              {/* Dynamic content based on event type */}
              {renderEventDetailContent()}
            </div>

            {/* Footer buttons */}
            <div className="flex justify-end p-3 bg-gray-50 border-t border-gray-200">
              <button
                onClick={closeEventDetails}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RightRow1; 