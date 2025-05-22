import React from 'react';

function ImagingStatusBadge({ status }) {
  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyles(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default ImagingStatusBadge; 