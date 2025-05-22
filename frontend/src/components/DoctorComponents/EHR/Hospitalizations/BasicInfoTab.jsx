import React from 'react';

const BasicInfoTab = ({ formData, handleChange, setActiveTab }) => {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-6">
        <p className="font-bold">Basic Hospitalization Information</p>
        <p>Please enter the general information about this hospitalization.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Admission</label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Hospital</label>
          <input
            type="text"
            name="hospital"
            value={formData.hospital}
            onChange={handleChange}
            required
            placeholder="Enter hospital name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Admission Type</label>
          <select
            name="admissionType"
            value={formData.admissionType}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Type</option>
            <option value="Emergency">Emergency</option>
            <option value="Elective">Elective</option>
            <option value="Urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="Active">Active</option>
            <option value="Discharged">Discharged</option>
            <option value="Transferred">Transferred</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Attending Physician</label>
          <input
            type="text"
            name="attendingPhysician"
            value={formData.attendingPhysician}
            onChange={handleChange}
            required
            placeholder="Dr. Name"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Duration of Stay</label>
          <input
            type="text"
            name="durationOfStay"
            value={formData.durationOfStay}
            onChange={handleChange}
            required
            placeholder="e.g., 3 days"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setActiveTab('details')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Continue to Clinical Details
        </button>
      </div>
    </div>
  );
};

export default BasicInfoTab; 