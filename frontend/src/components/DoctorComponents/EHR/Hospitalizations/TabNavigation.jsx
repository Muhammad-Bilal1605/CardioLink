import React from 'react';

const TabNavigation = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'basicInfo', label: 'Basic Information' },
    { id: 'details', label: 'Clinical Details' },
    { id: 'procedures', label: 'Procedures' },
    { id: 'associations', label: 'Associated Records' },
    { id: 'documents', label: 'Documents' }
  ];

  return (
    <div className="border-b border-gray-200">
      <nav className="flex -mb-px overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-4 px-6 text-center border-b-2 font-medium text-sm focus:outline-none whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default TabNavigation; 