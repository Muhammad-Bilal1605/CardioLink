import React from 'react';

function LabStatusBadge({ status }) {
  const getStatusStyles = (status) => {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'completed':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'cancelled':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <span className={`px-2.5 py-1 inline-flex text-xs font-medium rounded-full border ${getStatusStyles(status)}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default LabStatusBadge; 