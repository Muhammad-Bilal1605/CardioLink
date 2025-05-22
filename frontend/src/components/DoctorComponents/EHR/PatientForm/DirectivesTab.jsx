import React from 'react';

const DirectivesTab = ({ newPatient, handleNestedInputChange, setNewPatient }) => {
  return (
    <div className="space-y-6">
      {/* DNR */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-md font-medium text-gray-800 mb-3">Do Not Resuscitate (DNR)</h3>
        
        <div className="grid grid-cols-1 gap-4 mb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="specialDirectives.dnr.status"
              name="specialDirectives.dnr.status"
              checked={newPatient.specialDirectives.dnr.status}
              onChange={(e) => {
                setNewPatient({
                  ...newPatient,
                  specialDirectives: {
                    ...newPatient.specialDirectives,
                    dnr: {
                      ...newPatient.specialDirectives.dnr,
                      status: e.target.checked
                    }
                  }
                });
              }}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="specialDirectives.dnr.status" className="ml-2 block text-sm text-gray-700">
              Patient has DNR order
            </label>
          </div>
        </div>
        
        {newPatient.specialDirectives.dnr.status && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label htmlFor="specialDirectives.dnr.documentUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Document URL
                </label>
                <input
                  type="text"
                  id="specialDirectives.dnr.documentUrl"
                  name="specialDirectives.dnr.documentUrl"
                  placeholder="URL to document if available"
                  value={newPatient.specialDirectives.dnr.documentUrl}
                  onChange={handleNestedInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="specialDirectives.dnr.dateCreated" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Created
                </label>
                <input
                  type="date"
                  id="specialDirectives.dnr.dateCreated"
                  name="specialDirectives.dnr.dateCreated"
                  value={newPatient.specialDirectives.dnr.dateCreated || ''}
                  onChange={(e) => {
                    const value = e.target.value ? e.target.value : null;
                    setNewPatient({
                      ...newPatient,
                      specialDirectives: {
                        ...newPatient.specialDirectives,
                        dnr: {
                          ...newPatient.specialDirectives.dnr,
                          dateCreated: value
                        }
                      }
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="specialDirectives.dnr.notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="specialDirectives.dnr.notes"
                name="specialDirectives.dnr.notes"
                rows="2"
                value={newPatient.specialDirectives.dnr.notes}
                onChange={handleNestedInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>
          </>
        )}
      </div>
      
      {/* Living Will */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-md font-medium text-gray-800 mb-3">Living Will</h3>
        
        <div className="grid grid-cols-1 gap-4 mb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="specialDirectives.livingWill.status"
              name="specialDirectives.livingWill.status"
              checked={newPatient.specialDirectives.livingWill.status}
              onChange={(e) => {
                setNewPatient({
                  ...newPatient,
                  specialDirectives: {
                    ...newPatient.specialDirectives,
                    livingWill: {
                      ...newPatient.specialDirectives.livingWill,
                      status: e.target.checked
                    }
                  }
                });
              }}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="specialDirectives.livingWill.status" className="ml-2 block text-sm text-gray-700">
              Patient has Living Will
            </label>
          </div>
        </div>
        
        {newPatient.specialDirectives.livingWill.status && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <label htmlFor="specialDirectives.livingWill.documentUrl" className="block text-sm font-medium text-gray-700 mb-1">
                  Document URL
                </label>
                <input
                  type="text"
                  id="specialDirectives.livingWill.documentUrl"
                  name="specialDirectives.livingWill.documentUrl"
                  placeholder="URL to document if available"
                  value={newPatient.specialDirectives.livingWill.documentUrl}
                  onChange={handleNestedInputChange}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div>
                <label htmlFor="specialDirectives.livingWill.dateCreated" className="block text-sm font-medium text-gray-700 mb-1">
                  Date Created
                </label>
                <input
                  type="date"
                  id="specialDirectives.livingWill.dateCreated"
                  name="specialDirectives.livingWill.dateCreated"
                  value={newPatient.specialDirectives.livingWill.dateCreated || ''}
                  onChange={(e) => {
                    const value = e.target.value ? e.target.value : null;
                    setNewPatient({
                      ...newPatient,
                      specialDirectives: {
                        ...newPatient.specialDirectives,
                        livingWill: {
                          ...newPatient.specialDirectives.livingWill,
                          dateCreated: value
                        }
                      }
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="specialDirectives.livingWill.details" className="block text-sm font-medium text-gray-700 mb-1">
                Details
              </label>
              <textarea
                id="specialDirectives.livingWill.details"
                name="specialDirectives.livingWill.details"
                rows="2"
                value={newPatient.specialDirectives.livingWill.details}
                onChange={handleNestedInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>
            
            <div>
              <label htmlFor="specialDirectives.livingWill.notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="specialDirectives.livingWill.notes"
                name="specialDirectives.livingWill.notes"
                rows="2"
                value={newPatient.specialDirectives.livingWill.notes}
                onChange={handleNestedInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>
          </>
        )}
      </div>
      
      {/* Religious Beliefs */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-md font-medium text-gray-800 mb-3">Religious Beliefs</h3>
        
        <div className="grid grid-cols-1 mb-3">
          <div>
            <label htmlFor="specialDirectives.religiousBeliefs.religion" className="block text-sm font-medium text-gray-700 mb-1">
              Religion
            </label>
            <input
              type="text"
              id="specialDirectives.religiousBeliefs.religion"
              name="specialDirectives.religiousBeliefs.religion"
              value={newPatient.specialDirectives.religiousBeliefs.religion}
              onChange={handleNestedInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div className="mb-3">
          <label htmlFor="specialDirectives.religiousBeliefs.restrictions" className="block text-sm font-medium text-gray-700 mb-1">
            Medical Restrictions (comma separated)
          </label>
          <input
            type="text"
            id="specialDirectives.religiousBeliefs.restrictions"
            name="specialDirectives.religiousBeliefs.restrictions"
            placeholder="E.g., No blood transfusions, No pork-derived medications"
            value={Array.isArray(newPatient.specialDirectives.religiousBeliefs.restrictions) ? 
              newPatient.specialDirectives.religiousBeliefs.restrictions.join(', ') : ''}
            onChange={(e) => {
              const restrictions = e.target.value.split(',').map(restriction => restriction.trim());
              setNewPatient({
                ...newPatient,
                specialDirectives: {
                  ...newPatient.specialDirectives,
                  religiousBeliefs: {
                    ...newPatient.specialDirectives.religiousBeliefs,
                    restrictions: restrictions.filter(r => r)
                  }
                }
              });
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div className="mb-3">
          <label htmlFor="specialDirectives.religiousBeliefs.preferences" className="block text-sm font-medium text-gray-700 mb-1">
            Preferences (comma separated)
          </label>
          <input
            type="text"
            id="specialDirectives.religiousBeliefs.preferences"
            name="specialDirectives.religiousBeliefs.preferences"
            placeholder="E.g., Prefer same-gender providers"
            value={Array.isArray(newPatient.specialDirectives.religiousBeliefs.preferences) ? 
              newPatient.specialDirectives.religiousBeliefs.preferences.join(', ') : ''}
            onChange={(e) => {
              const preferences = e.target.value.split(',').map(preference => preference.trim());
              setNewPatient({
                ...newPatient,
                specialDirectives: {
                  ...newPatient.specialDirectives,
                  religiousBeliefs: {
                    ...newPatient.specialDirectives.religiousBeliefs,
                    preferences: preferences.filter(p => p)
                  }
                }
              });
            }}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <h4 className="text-sm font-medium text-gray-700 mt-4 mb-2">Religious Contact</h4>
        <div className="grid grid-cols-3 gap-4 mb-3 pl-2">
          <div>
            <label htmlFor="specialDirectives.religiousBeliefs.contactPerson.name" className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              id="specialDirectives.religiousBeliefs.contactPerson.name"
              name="specialDirectives.religiousBeliefs.contactPerson.name"
              value={newPatient.specialDirectives.religiousBeliefs.contactPerson.name}
              onChange={handleNestedInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="specialDirectives.religiousBeliefs.contactPerson.role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <input
              type="text"
              id="specialDirectives.religiousBeliefs.contactPerson.role"
              name="specialDirectives.religiousBeliefs.contactPerson.role"
              placeholder="Rabbi, Priest, Imam, etc."
              value={newPatient.specialDirectives.religiousBeliefs.contactPerson.role}
              onChange={handleNestedInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label htmlFor="specialDirectives.religiousBeliefs.contactPerson.phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="specialDirectives.religiousBeliefs.contactPerson.phoneNumber"
              name="specialDirectives.religiousBeliefs.contactPerson.phoneNumber"
              value={newPatient.specialDirectives.religiousBeliefs.contactPerson.phoneNumber}
              onChange={handleNestedInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="specialDirectives.religiousBeliefs.notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="specialDirectives.religiousBeliefs.notes"
            name="specialDirectives.religiousBeliefs.notes"
            rows="2"
            value={newPatient.specialDirectives.religiousBeliefs.notes}
            onChange={handleNestedInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          ></textarea>
        </div>
      </div>
      
      {/* Organ Donor */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-md font-medium text-gray-800 mb-3">Organ Donor</h3>
        
        <div className="grid grid-cols-1 gap-4 mb-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="specialDirectives.organDonor.status"
              name="specialDirectives.organDonor.status"
              checked={newPatient.specialDirectives.organDonor.status}
              onChange={(e) => {
                setNewPatient({
                  ...newPatient,
                  specialDirectives: {
                    ...newPatient.specialDirectives,
                    organDonor: {
                      ...newPatient.specialDirectives.organDonor,
                      status: e.target.checked
                    }
                  }
                });
              }}
              className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
            />
            <label htmlFor="specialDirectives.organDonor.status" className="ml-2 block text-sm text-gray-700">
              Patient is an organ donor
            </label>
          </div>
        </div>
        
        {newPatient.specialDirectives.organDonor.status && (
          <>
            <div className="mb-3">
              <label htmlFor="specialDirectives.organDonor.specifics" className="block text-sm font-medium text-gray-700 mb-1">
                Specifics
              </label>
              <input
                type="text"
                id="specialDirectives.organDonor.specifics"
                name="specialDirectives.organDonor.specifics"
                placeholder="All organs, specific organs only, etc."
                value={newPatient.specialDirectives.organDonor.specifics}
                onChange={handleNestedInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            
            <div>
              <label htmlFor="specialDirectives.organDonor.notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="specialDirectives.organDonor.notes"
                name="specialDirectives.organDonor.notes"
                rows="2"
                value={newPatient.specialDirectives.organDonor.notes}
                onChange={handleNestedInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              ></textarea>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DirectivesTab; 