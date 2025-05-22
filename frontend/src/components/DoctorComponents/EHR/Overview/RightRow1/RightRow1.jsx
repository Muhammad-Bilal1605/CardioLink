import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import { useParams, useLocation } from 'react-router-dom';
import EventDetailPanel from './EventDetailPanel';

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
  const [activeYear, setActiveYear] = useState(new Date().getFullYear());
  const [activeMonth, setActiveMonth] = useState(new Date().getMonth() + 1);
  const [activeDay, setActiveDay] = useState(new Date().getDate());
  const [isMobile, setIsMobile] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [allEvents, setAllEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Active event types filter
  const [activeEventTypes, setActiveEventTypes] = useState(eventTypes.map(type => type.key));
  
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
          .sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending (newest first)
        
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
        left: -200,
        behavior: 'smooth'
      });
    }
  };

  // Handle scroll right
  const scrollRight = () => {
    if (timelineContainerRef.current) {
      timelineContainerRef.current.scrollBy({
        left: 200,
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
    // Convert month name to month number (0-11)
    const monthNumber = new Date(Date.parse(`${monthName} 1, 2000`)).getMonth() + 1;
    setActiveMonth(monthNumber);
      changeViewMode('days');
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
    
        return (
      <EventDetailPanel event={selectedEvent} onClose={closeEventDetails} />
    );
  };
  
  // Calculate width for the container based on number of units and unit width
  const calculateContainerWidth = () => {
    if (isMobile) {
      return `${timeframeUnits.length * 100}px`;
    }
    return `${timeframeUnits.length * 120}px`;
  }
  
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full">
      {/* Header with title and timeline controls */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
          <h2 className="text-lg font-semibold text-gray-800">Medical Timeline</h2>
          {viewMode !== 'years' && (
            <button 
              onClick={resetToYearsView} 
              className="ml-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Years
            </button>
          )}
        </div>
        
        <div className="flex items-center">
          {/* Toggle event type filters (mobile-friendly dropdown) */}
          <div className="relative inline-block text-left mr-2">
            <button
              type="button"
              className="text-xs md:text-sm bg-white border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Filter Events
              <svg className="-mr-1 ml-1 h-4 w-4 inline" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {/* Dropdown menu for event type filters */}
            <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 hidden">
              <div className="py-1" role="menu" aria-orientation="vertical">
            {eventTypes.map(type => (
              <button
                key={type.key}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      activeEventTypes.includes(type.key) ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    }`}
                onClick={() => toggleEventType(type.key)}
                  >
                    <span className="inline-block w-4 h-4 mr-2" style={{ backgroundColor: type.color }}></span>
                    {type.label}
              </button>
            ))}
            <button
                  className="block w-full text-left px-4 py-2 text-sm text-blue-600 border-t border-gray-100"
              onClick={showAllEventTypes}
            >
              Show All
            </button>
          </div>
        </div>
          </div>
          
          {/* Timeline navigation buttons */}
          <button 
            onClick={scrollLeft}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Scroll left"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button 
            onClick={scrollRight}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Scroll right"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {/* Event type legend (shown on non-mobile) */}
      <div className="hidden md:flex border-b border-gray-200 px-4 py-2 space-x-2 overflow-x-auto">
        {eventTypes.map(type => (
          <button
            key={type.key}
            className={`text-xs rounded-full px-3 py-1 focus:outline-none transition-colors ${
              activeEventTypes.includes(type.key)
                ? `bg-${type.color.replace('#', '')} text-white`
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            style={activeEventTypes.includes(type.key) ? { backgroundColor: type.color } : {}}
            onClick={() => toggleEventType(type.key)}
          >
            <span className="mr-1">{type.icon}</span>
            {type.label}
          </button>
        ))}
        </div>
      
      {/* Timeline view - scrollable container */}
      <div className="relative flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Loading medical timeline...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-500">{error}</p>
          </div>
        ) : (
          <div 
            ref={timelineContainerRef}
            className="overflow-x-auto h-full p-4"
          >
            <div className="flex" style={{ width: calculateContainerWidth(), minHeight: '100%' }}>
              {timeframeUnits.map((unit, index) => (
                <div 
                  key={unit} 
                  className={`flex-none p-2 ${
                    viewMode === 'years' && unit === activeYear || 
                    viewMode === 'months' && unit === new Date(activeYear, activeMonth - 1, 1).toLocaleString('default', { month: 'short' }) || 
                    viewMode === 'days' && unit === activeDay
                      ? 'bg-blue-50'
                      : 'hover:bg-gray-50'
                  }`}
                  style={{ width: isMobile ? '100px' : '120px' }}
                >
                  {/* Unit header (year, month, or day) */}
                  <div className="mb-2 text-center">
                    <button
                      className={`font-medium rounded-full px-3 py-1 text-sm ${
                        viewMode === 'years' && unit === activeYear || 
                        viewMode === 'months' && unit === new Date(activeYear, activeMonth - 1, 1).toLocaleString('default', { month: 'short' }) || 
                        viewMode === 'days' && unit === activeDay
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-200'
                      }`}
                  onClick={() => {
                    if (viewMode === 'years') handleYearClick(unit);
                    else if (viewMode === 'months') handleMonthClick(unit);
                    else if (viewMode === 'days') handleDayClick(unit);
                  }}
                >
                  {unit}
                    </button>
              </div>
              
                  {/* Events for this unit */}
                  <div className="space-y-2">
                    {eventsByUnit[unit]?.map(event => (
                      <div
                        key={event.id}
                        className="p-2 rounded-lg shadow-sm cursor-pointer transition-all hover:shadow-md"
                        style={{ backgroundColor: `${event.color}15` }} // Light version of event color
                            onClick={() => handleEventClick(event)}
                          >
                        <div className="flex items-center">
                          <span className="mr-1">{event.icon}</span>
                          <span className="font-medium text-sm" style={{ color: event.color }}>
                            {event.typeLabel}
                          </span>
                            </div>
                        <div className="text-xs text-gray-800 mt-1 font-medium truncate">
                          {event.details}
                              </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(event.date).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                    
                    {eventsByUnit[unit]?.length === 0 && (
                      <div className="text-center py-2 text-xs text-gray-400">
                        No events
                      </div>
                    )}
                  </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        
        {/* Event details slide-in panel */}
        {showEventDetails && renderEventDetailContent()}
      </div>
    </div>
  );
};

export default RightRow1;