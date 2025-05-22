import React from 'react';

const AllergiesTab = ({ 
  newPatient, 
  showAllergyForm, 
  setShowAllergyForm, 
  allergyType, 
  setAllergyType, 
  newAllergy, 
  handleAllergyInputChange, 
  handleAddAllergy, 
  handleRemoveAllergy 
}) => {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-md font-medium text-gray-800">Allergies</h3>
        
        {!showAllergyForm && (
          <button
            type="button"
            onClick={() => setShowAllergyForm(true)}
            className="text-sm bg-green-50 text-green-700 px-2 py-1 rounded-md hover:bg-green-100"
          >
            + Add Allergy
          </button>
        )}
      </div>
      
      {/* Allergy Form */}
      {showAllergyForm && (
        <div className="bg-gray-50 p-3 rounded-md mb-3">
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label htmlFor="allergyType" className="block text-sm font-medium text-gray-700 mb-1">
                Allergy Type*
              </label>
              <select
                id="allergyType"
                value={allergyType}
                onChange={(e) => setAllergyType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="medicinal">Medicinal</option>
                <option value="food">Food</option>
                <option value="environmental">Environmental</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="allergyName" className="block text-sm font-medium text-gray-700 mb-1">
                Allergen Name*
              </label>
              <input
                type="text"
                id="allergyName"
                name="name"
                value={newAllergy.name}
                onChange={handleAllergyInputChange}
                required
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label htmlFor="allergyCriticality" className="block text-sm font-medium text-gray-700 mb-1">
                Criticality
              </label>
              <select
                id="allergyCriticality"
                name="criticality"
                value={newAllergy.criticality}
                onChange={handleAllergyInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="allergyReaction" className="block text-sm font-medium text-gray-700 mb-1">
                Reaction
              </label>
              <input
                type="text"
                id="allergyReaction"
                name="reaction"
                value={newAllergy.reaction}
                onChange={handleAllergyInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="allergyNotes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="allergyNotes"
              name="notes"
              value={newAllergy.notes}
              onChange={handleAllergyInputChange}
              rows="2"
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAllergyForm(false)}
              className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddAllergy}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add
            </button>
          </div>
        </div>
      )}
      
      {/* Allergy Lists */}
      <div className="space-y-2">
        {/* Medicinal Allergies */}
        {newPatient.allergies.medicinal.length > 0 && (
          <div className="bg-blue-50 rounded-md p-2">
            <h4 className="text-sm font-medium text-blue-700 mb-1">Medicinal Allergies</h4>
            <ul className="space-y-1">
              {newPatient.allergies.medicinal.map((allergy, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className={`font-medium ${
                      allergy.criticality === 'High' ? 'text-red-600' : 
                      allergy.criticality === 'Medium' ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {allergy.name} ({allergy.criticality})
                    </span>
                    {allergy.reaction && <span className="text-gray-600"> - {allergy.reaction}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy('medicinal', index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Food Allergies */}
        {newPatient.allergies.food.length > 0 && (
          <div className="bg-green-50 rounded-md p-2">
            <h4 className="text-sm font-medium text-green-700 mb-1">Food Allergies</h4>
            <ul className="space-y-1">
              {newPatient.allergies.food.map((allergy, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className={`font-medium ${
                      allergy.criticality === 'High' ? 'text-red-600' : 
                      allergy.criticality === 'Medium' ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {allergy.name} ({allergy.criticality})
                    </span>
                    {allergy.reaction && <span className="text-gray-600"> - {allergy.reaction}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy('food', index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Environmental Allergies */}
        {newPatient.allergies.environmental.length > 0 && (
          <div className="bg-amber-50 rounded-md p-2">
            <h4 className="text-sm font-medium text-amber-700 mb-1">Environmental Allergies</h4>
            <ul className="space-y-1">
              {newPatient.allergies.environmental.map((allergy, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <div>
                    <span className={`font-medium ${
                      allergy.criticality === 'High' ? 'text-red-600' : 
                      allergy.criticality === 'Medium' ? 'text-orange-500' : 'text-green-600'
                    }`}>
                      {allergy.name} ({allergy.criticality})
                    </span>
                    {allergy.reaction && <span className="text-gray-600"> - {allergy.reaction}</span>}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAllergy('environmental', index)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    &times;
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {newPatient.allergies.medicinal.length === 0 && 
         newPatient.allergies.food.length === 0 && 
         newPatient.allergies.environmental.length === 0 && !showAllergyForm && (
          <p className="text-sm text-gray-500 italic">No allergies added</p>
        )}
      </div>
    </div>
  );
};

export default AllergiesTab; 