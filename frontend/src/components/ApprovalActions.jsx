import React from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  AlertTriangle,
  RefreshCw,
  Pause
} from 'lucide-react';

const ApprovalActions = ({ hospital, onAction }) => {
  const { status } = hospital;

  const ActionButton = ({ onClick, icon: Icon, label, variant = 'primary', disabled = false }) => {
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white',
      success: 'bg-green-600 hover:bg-green-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      warning: 'bg-yellow-600 hover:bg-yellow-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50'
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : variants[variant]
        }`}
      >
        <Icon className="w-4 h-4 mr-2" />
        {label}
      </button>
    );
  };

  const renderActions = () => {
    switch (status) {
      case 'Pending':
        return (
          <div className="flex items-center space-x-3">
            <ActionButton
              onClick={() => onAction('Under Review')}
              icon={Eye}
              label="Mark Under Review"
              variant="primary"
            />
            <ActionButton
              onClick={() => onAction('Approved')}
              icon={CheckCircle}
              label="Approve"
              variant="success"
            />
            <ActionButton
              onClick={() => onAction('Rejected')}
              icon={XCircle}
              label="Reject"
              variant="danger"
            />
          </div>
        );

      case 'Under Review':
        return (
          <div className="flex items-center space-x-3">
            <ActionButton
              onClick={() => onAction('Approved')}
              icon={CheckCircle}
              label="Approve"
              variant="success"
            />
            <ActionButton
              onClick={() => onAction('Rejected')}
              icon={XCircle}
              label="Reject"
              variant="danger"
            />
            <ActionButton
              onClick={() => onAction('Pending')}
              icon={Clock}
              label="Back to Pending"
              variant="outline"
            />
          </div>
        );

      case 'Approved':
        return (
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-md">
              <CheckCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Approved</span>
            </div>
            <ActionButton
              onClick={() => onAction('Suspended')}
              icon={Pause}
              label="Suspend"
              variant="warning"
            />
            <ActionButton
              onClick={() => onAction('Under Review')}
              icon={RefreshCw}
              label="Review Again"
              variant="outline"
            />
          </div>
        );

      case 'Rejected':
        return (
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-4 py-2 bg-red-100 text-red-800 rounded-md">
              <XCircle className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Rejected</span>
            </div>
            <ActionButton
              onClick={() => onAction('Under Review')}
              icon={RefreshCw}
              label="Reconsider"
              variant="primary"
            />
            <ActionButton
              onClick={() => onAction('Pending')}
              icon={Clock}
              label="Back to Pending"
              variant="outline"
            />
          </div>
        );

      case 'Suspended':
        return (
          <div className="flex items-center space-x-3">
            <div className="flex items-center px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md">
              <Pause className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">Suspended</span>
            </div>
            <ActionButton
              onClick={() => onAction('Approved')}
              icon={CheckCircle}
              label="Reactivate"
              variant="success"
            />
            <ActionButton
              onClick={() => onAction('Under Review')}
              icon={Eye}
              label="Review"
              variant="primary"
            />
          </div>
        );

      default:
        return (
          <div className="flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-md">
            <AlertTriangle className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Unknown Status</span>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center justify-end">
      {renderActions()}
    </div>
  );
};

export default ApprovalActions; 