import React from 'react';

const BasicInfoTab = ({ newPatient, handleInputChange }) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
            First Name*
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={newPatient.firstName}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
            Last Name*
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={newPatient.lastName}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
            Date of Birth*
          </label>
          <input
            type="date"
            id="dateOfBirth"
            name="dateOfBirth"
            value={newPatient.dateOfBirth}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
            Gender*
          </label>
          <select
            id="gender"
            name="gender"
            value={newPatient.gender}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email*
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={newPatient.email}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number*
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={newPatient.phoneNumber}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <label htmlFor="address.street" className="block text-sm font-medium text-gray-700 mb-1">
          Street Address
        </label>
        <input
          type="text"
          id="address.street"
          name="address.street"
          value={newPatient.address.street}
          onChange={handleInputChange}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="address.city" className="block text-sm font-medium text-gray-700 mb-1">
            City
          </label>
          <input
            type="text"
            id="address.city"
            name="address.city"
            value={newPatient.address.city}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label htmlFor="address.state" className="block text-sm font-medium text-gray-700 mb-1">
            State/Province
          </label>
          <input
            type="text"
            id="address.state"
            name="address.state"
            value={newPatient.address.state}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="address.zipCode" className="block text-sm font-medium text-gray-700 mb-1">
            Zip/Postal Code
          </label>
          <input
            type="text"
            id="address.zipCode"
            name="address.zipCode"
            value={newPatient.address.zipCode}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
        
        <div>
          <label htmlFor="address.country" className="block text-sm font-medium text-gray-700 mb-1">
            Country
          </label>
          <input
            type="text"
            id="address.country"
            name="address.country"
            value={newPatient.address.country}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>
    </>
  );
};

export default BasicInfoTab; 