import React from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Navigation,
  Building2
} from 'lucide-react';

const HospitalContactInfo = ({ hospital }) => {
  const openInMaps = () => {
    if (hospital.coordinates?.latitude && hospital.coordinates?.longitude) {
      const url = `https://www.google.com/maps?q=${hospital.coordinates.latitude},${hospital.coordinates.longitude}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Address Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <MapPin className="w-5 h-5 text-blue-600 mr-2" />
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
            <p className="text-gray-900">{hospital.address?.street}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <p className="text-gray-900">{hospital.address?.city}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State/Province</label>
            <p className="text-gray-900">{hospital.address?.state}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Postal Code</label>
            <p className="text-gray-900">{hospital.address?.postalCode}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <p className="text-gray-900">{hospital.address?.country}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
            <p className="text-gray-900">{hospital.fullAddress}</p>
          </div>
        </div>
      </div>

      {/* Coordinates */}
      {hospital.coordinates?.latitude && hospital.coordinates?.longitude && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Navigation className="w-5 h-5 text-blue-600 mr-2" />
            Geographic Coordinates
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <p className="text-gray-900">{hospital.coordinates.latitude}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <p className="text-gray-900">{hospital.coordinates.longitude}</p>
            </div>
            <div>
              <button
                onClick={openInMaps}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
              >
                <MapPin className="w-4 h-4 mr-2" />
                View on Maps
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="w-5 h-5 text-blue-600 mr-2" />
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Primary Phone</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-gray-500 mr-2" />
              <a 
                href={`tel:${hospital.phoneNumber}`}
                className="text-blue-600 hover:text-blue-800"
              >
                {hospital.phoneNumber}
              </a>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
            <div className="flex items-center">
              <Phone className="w-4 h-4 text-red-500 mr-2" />
              <a 
                href={`tel:${hospital.emergencyContactNumber}`}
                className="text-red-600 hover:text-red-800"
              >
                {hospital.emergencyContactNumber}
              </a>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <div className="flex items-center">
              <Mail className="w-4 h-4 text-gray-500 mr-2" />
              <a 
                href={`mailto:${hospital.emailAddress}`}
                className="text-blue-600 hover:text-blue-800 truncate"
              >
                {hospital.emailAddress}
              </a>
            </div>
          </div>
          {hospital.websiteUrl && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
              <div className="flex items-center">
                <Globe className="w-4 h-4 text-gray-500 mr-2" />
                <a 
                  href={hospital.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 truncate"
                >
                  {hospital.websiteUrl}
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <a 
            href={`tel:${hospital.phoneNumber}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
          >
            <Phone className="w-4 h-4 mr-2" />
            Call Hospital
          </a>
          <a 
            href={`mailto:${hospital.emailAddress}`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
          >
            <Mail className="w-4 h-4 mr-2" />
            Send Email
          </a>
          {hospital.websiteUrl && (
            <a 
              href={hospital.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 transition-colors"
            >
              <Globe className="w-4 h-4 mr-2" />
              Visit Website
            </a>
          )}
          {hospital.coordinates?.latitude && hospital.coordinates?.longitude && (
            <button
              onClick={openInMaps}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 transition-colors"
            >
              <MapPin className="w-4 h-4 mr-2" />
              Get Directions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalContactInfo; 