import React from 'react';
import { 
  FaCalendarCheck, 
  FaCalendarAlt, 
  FaExclamationCircle, 
  FaClock 
} from 'react-icons/fa';

function VisitStatusBadge({ status, size = 'md' }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'Upcoming':
        return {
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          icon: <FaCalendarAlt className="mr-1.5" />
        };
      case 'Completed':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          borderColor: 'border-green-200',
          icon: <FaCalendarCheck className="mr-1.5" />
        };
      case 'Cancelled':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          icon: <FaExclamationCircle className="mr-1.5" />
        };
      case 'In Progress':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          borderColor: 'border-yellow-200',
          icon: <FaClock className="mr-1.5" />
        };
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          icon: null
        };
    }
  };

  const { bgColor, textColor, borderColor, icon } = getStatusConfig(status);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-3 py-1',
    lg: 'text-sm px-3 py-1.5'
  };

  return (
    <span className={`inline-flex items-center font-medium rounded-full border ${bgColor} ${textColor} ${borderColor} ${sizeClasses[size]}`}>
      {icon}
      {status}
    </span>
  );
}

export default VisitStatusBadge;