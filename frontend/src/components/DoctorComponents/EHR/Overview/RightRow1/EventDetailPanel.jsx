import React, { useEffect, useState } from 'react';

/**
 * Component to display detailed information about a medical event
 * Slides in from the right side of the screen
 */
const EventDetailPanel = ({ event, onClose }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    // Open the panel with a small delay to trigger the animation
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 50);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for the animation to complete before calling onClose
    setTimeout(onClose, 300);
  };
  
  // Helper to render different content based on event type
  const renderDetailContent = () => {
    if (!event || !event.fullData) {
      return <div className="text-gray-500">No data available</div>;
    }

    switch (event.type) {
      case 'visits':
        const visit = event.fullData;
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
            {visit.testsPrescribed && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Tests Ordered:</span>
                <div className="font-medium">{visit.testsPrescribed}</div>
              </div>
            )}
            {visit.notes && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Doctor Notes:</span>
                <div className="font-medium">{visit.notes}</div>
              </div>
            )}
          </>
        );
      
      case 'hospitalizations':
        const hosp = event.fullData;
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
              <div className="font-medium">
                {hosp.dischargeDate ? 
                  `${Math.ceil((new Date(hosp.dischargeDate) - new Date(hosp.admissionDate)) / (1000 * 60 * 60 * 24))} days` : 
                  'Ongoing'}
              </div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Procedures:</span>
              <div className="font-medium">
                {hosp.procedures?.length
                  ? hosp.procedures.join(', ')
                  : 'None'}
              </div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Outcome:</span>
              <div className="font-medium">{hosp.outcome || 'Not Available'}</div>
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
        const procedure = event.fullData;
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
            {procedure.status && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Status:</span>
                <div className="font-medium">{procedure.status}</div>
              </div>
            )}
          </>
        );
        
      case 'labs':
        const lab = event.fullData;
        return (
          <>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Test:</span>
              <div className="font-bold">{lab.testName}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Type:</span>
              <div className="font-medium">{lab.testType}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Ordered By:</span>
              <div className="font-medium">{lab.doctor}</div>
            </div>
            <div className="mb-3">
              <span className="text-sm text-gray-500">Results:</span>
              <div className="bg-gray-50 p-3 rounded-md text-sm">
                {lab.results && lab.results.length > 0 ? (
                  lab.results.map((result, index) => (
                    <div key={index} className="border-b border-gray-100 last:border-b-0 py-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{result.parameter}:</span>
                        <span>{result.value} {result.unit}</span>
                      </div>
                      {result.referenceRange && (
                        <div className="text-xs text-gray-500">
                          Reference: {result.referenceRange}
                        </div>
                      )}
                      <div className={`text-xs mt-1 ${
                        result.status === 'Normal' ? 'text-green-600' :
                        result.status === 'High' ? 'text-red-600' :
                        result.status === 'Low' ? 'text-orange-600' :
                        'text-gray-600'
                      }`}>
                        Status: {result.status}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No results available</div>
                )}
              </div>
            </div>
            {lab.notes && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Notes:</span>
                <div className="font-medium">{lab.notes}</div>
              </div>
            )}
          </>
        );
        
      case 'imaging':
        const image = event.fullData;
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
            {image.description && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Description:</span>
                <div className="font-medium">{image.description}</div>
              </div>
            )}
            {image.findings && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Findings:</span>
                <div className="font-medium">{image.findings}</div>
              </div>
            )}
            {image.imageUrl && (
              <div className="mb-3">
                <span className="text-sm text-gray-500">Image:</span>
                <div className="mt-2">
                  <img 
                    src={`http://localhost:5000${image.imageUrl}`} 
                    alt={image.type}
                    className="w-full h-auto rounded-md object-cover"
                  />
                </div>
              </div>
            )}
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

  return (
    <div 
      className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div 
          className="p-4 border-b border-gray-200 flex justify-between items-center"
          style={{ backgroundColor: `${event?.color}15` }}
        >
          <h3 className="font-medium flex items-center text-gray-800">
            <span className="mr-2">{event?.icon}</span>
            {event?.typeLabel}
          </h3>
          <button 
            onClick={handleClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Date and department info */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <div className="mb-2">
              <span className="text-sm text-gray-500">Date:</span>
              <div className="font-medium">
                {event?.date ? new Date(event.date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'Unknown date'}
              </div>
            </div>
            <div>
              <span className="text-sm text-gray-500">Location:</span>
              <div className="font-medium">{event?.department || 'Unknown location'}</div>
            </div>
          </div>
          
          {/* Event-specific details */}
          {renderDetailContent()}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleClose}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPanel;