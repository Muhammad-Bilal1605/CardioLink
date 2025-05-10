import { createContext, useContext, useState } from 'react';

export const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profilePhoto, setProfilePhoto] = useState(null); // you can load from localStorage or DB if needed

  const updateProfilePhoto = (photoUrl) => {
    setProfilePhoto(photoUrl);
  };

  return (
    <ProfileContext.Provider value={{ profilePhoto, updateProfilePhoto }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
