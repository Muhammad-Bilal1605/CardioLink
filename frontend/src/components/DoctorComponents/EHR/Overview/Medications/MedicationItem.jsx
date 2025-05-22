import React from 'react';

const MedicationItem = ({ name, dosage, frequency, startDate, endDate, prescribedBy, reason }) => {
  // Format dates to include month, day, and year
  const formatDate = (dateString) => {
    if (!dateString) return 'Present';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  return (
    <div className="bg-white p-4 rounded-md shadow-sm w-full hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <p className="font-semibold text-blue-800">{name}</p>
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">Active</span>
      </div>
      <p className="text-sm text-gray-700">{dosage} - {frequency}</p>
      <p className="text-xs text-gray-600 mt-1">Prescribed by: {prescribedBy}</p>
      {reason && <p className="text-xs text-gray-600">Reason: {reason}</p>}
      <div className="text-xs text-gray-500 mt-2">
        <p>{formattedStartDate} to {formattedEndDate}</p>
      </div>
    </div>
  );
};

export default MedicationItem;