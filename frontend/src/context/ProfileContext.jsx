import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const ProfileContext = createContext();

// Default profile photo
const DEFAULT_PROFILE_PHOTO = 'https://via.placeholder.com/150';

export const ProfileProvider = ({ children }) => {
  // Get profile photo from localStorage on initial load
  const [profilePhoto, setProfilePhoto] = useState(() => {
    const savedPhoto = localStorage.getItem('profilePhoto');
    return savedPhoto || DEFAULT_PROFILE_PHOTO;
  });
  
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);

  // Update profile photo
  const updateProfilePhoto = async (file) => {
    if (!file) return;
    
    setIsPhotoLoading(true);
    
    try {
      // Convert file to base64 for storage and display
      const base64 = await convertFileToBase64(file);
      
      // Save to localStorage
      localStorage.setItem('profilePhoto', base64);
      
      // Update state
      setProfilePhoto(base64);
    } catch (error) {
      console.error('Error updating profile photo:', error);
    } finally {
      setIsPhotoLoading(false);
    }
  };

  // Utility to convert file to base64
  const convertFileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Store value in localStorage whenever it changes
  useEffect(() => {
    if (profilePhoto && profilePhoto !== DEFAULT_PROFILE_PHOTO) {
      localStorage.setItem('profilePhoto', profilePhoto);
    }
  }, [profilePhoto]);

  // Context value
  const value = {
    profilePhoto,
    isPhotoLoading,
    updateProfilePhoto,
    setIsPhotoLoading,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};

// Custom hook to use the profile context
export const useProfilePhoto = () => {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfilePhoto must be used within a ProfileProvider');
  }
  return context;
};

export default ProfileContext;