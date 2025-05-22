import React from 'react';

const SocialHistoryTab = ({ newPatient, handleNestedInputChange, setNewPatient }) => {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-gray-700">Social History</h3>
      
      {/* Tobacco Use */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Tobacco Use</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="socialHistory.tobaccoUse.status"
              value={newPatient.socialHistory.tobaccoUse.status}
              onChange={handleNestedInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Unknown">Unknown</option>
              <option value="Never">Never</option>
              <option value="Former">Former</option>
              <option value="Current">Current</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <input
              type="text"
              name="socialHistory.tobaccoUse.type"
              value={newPatient.socialHistory.tobaccoUse.type}
              onChange={handleNestedInputChange}
              placeholder="Cigarettes, Vaping, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <input
              type="text"
              name="socialHistory.tobaccoUse.frequency"
              value={newPatient.socialHistory.tobaccoUse.frequency}
              onChange={handleNestedInputChange}
              placeholder="Daily, Occasional, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration
            </label>
            <input
              type="text"
              name="socialHistory.tobaccoUse.duration"
              value={newPatient.socialHistory.tobaccoUse.duration}
              onChange={handleNestedInputChange}
              placeholder="10 years, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Alcohol Use */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Alcohol Use</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="socialHistory.alcoholUse.status"
              value={newPatient.socialHistory.alcoholUse.status}
              onChange={handleNestedInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Unknown">Unknown</option>
              <option value="Never">Never</option>
              <option value="Former">Former</option>
              <option value="Current">Current</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <input
              type="text"
              name="socialHistory.alcoholUse.frequency"
              value={newPatient.socialHistory.alcoholUse.frequency}
              onChange={handleNestedInputChange}
              placeholder="Daily, Social, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount
          </label>
          <input
            type="text"
            name="socialHistory.alcoholUse.amount"
            value={newPatient.socialHistory.alcoholUse.amount}
            onChange={handleNestedInputChange}
            placeholder="2 drinks per day, etc."
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      
      {/* Illicit Drug Use */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Illicit Drug Use</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="socialHistory.illicitDrugUse.status"
              value={newPatient.socialHistory.illicitDrugUse.status}
              onChange={handleNestedInputChange}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="Unknown">Unknown</option>
              <option value="Never">Never</option>
              <option value="Former">Former</option>
              <option value="Current">Current</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Frequency
            </label>
            <input
              type="text"
              name="socialHistory.illicitDrugUse.frequency"
              value={newPatient.socialHistory.illicitDrugUse.frequency}
              onChange={handleNestedInputChange}
              placeholder="Daily, Weekly, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>
      
      {/* Occupation */}
      <div className="border p-4 rounded-md bg-gray-50">
        <h4 className="font-medium text-gray-700 mb-2">Occupation</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Occupation
            </label>
            <input
              type="text"
              name="socialHistory.occupation.current"
              value={newPatient.socialHistory.occupation.current}
              onChange={handleNestedInputChange}
              placeholder="Software Engineer, Teacher, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employer
            </label>
            <input
              type="text"
              name="socialHistory.occupation.employer"
              value={newPatient.socialHistory.occupation.employer}
              onChange={handleNestedInputChange}
              placeholder="Company name"
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              name="socialHistory.occupation.industry"
              value={newPatient.socialHistory.occupation.industry}
              onChange={handleNestedInputChange}
              placeholder="Healthcare, Technology, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Work Schedule
            </label>
            <input
              type="text"
              name="socialHistory.occupation.workSchedule"
              value={newPatient.socialHistory.occupation.workSchedule}
              onChange={handleNestedInputChange}
              placeholder="Full-time, Part-time, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-500">
        <p>Note: These details help healthcare providers understand your lifestyle and potential health impacts.</p>
      </div>
    </div>
  );
};

export default SocialHistoryTab; 