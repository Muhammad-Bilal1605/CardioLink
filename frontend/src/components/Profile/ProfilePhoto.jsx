// ProfilePhoto.jsx - Add this component to your project
import { useState } from 'react';
import { Camera, Loader } from 'lucide-react';

// Sizes: xs, sm, md, lg, xl
export const ProfilePhoto = ({ 
  src, 
  alt = "Profile photo", 
  size = "md", 
  editable = false, 
  onFileChange,
  isLoading = false,
  online = false,
  className = "",
}) => {
  // Size classes mapping
  const sizeClasses = {
    xs: "w-8 h-8",
    sm: "w-12 h-12",
    md: "w-16 h-16",
    lg: "w-32 h-32",
    xl: "w-40 h-40"
  };
  
  // Edit button size classes
  const editBtnSizes = {
    xs: "p-1 right-0 bottom-0",
    sm: "p-1 right-0 bottom-0",
    md: "p-2 right-0 bottom-0",
    lg: "p-3 right-0 bottom-0",
    xl: "p-3 right-0 bottom-0"
  };

  // Loading spinner size
  const spinnerSizes = {
    xs: 12,
    sm: 16,
    md: 20,
    lg: 40,
    xl: 48
  };

  // Shadow and ring classes
  const baseClasses = "rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden bg-base-300";
  
  // Combined classes
  const avatarClasses = `${baseClasses} ${sizeClasses[size]} ${className}`;
  
  // Local state for image hover
  const [isHovering, setIsHovering] = useState(false);

  // Handle mouse events
  const handleMouseEnter = () => setIsHovering(true);
  const handleMouseLeave = () => setIsHovering(false);

  return (
    <div 
      className={`relative group ${online ? 'online' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`avatar ${isLoading ? 'animate-pulse' : ''}`}>
        <div className={avatarClasses}>
          {isLoading ? (
            <div className="flex justify-center items-center w-full h-full">
              <Loader className="animate-spin text-primary" size={spinnerSizes[size]} />
            </div>
          ) : (
            <img 
              src={src} 
              alt={alt} 
              className={`object-cover w-full h-full transition-transform duration-500 ${isHovering && editable ? 'scale-110 opacity-90' : ''}`}
            />
          )}
        </div>
      </div>
      
      {editable && !isLoading && (
        <label className={`absolute bg-primary text-primary-content ${editBtnSizes[size]} rounded-full cursor-pointer hover:bg-primary-focus transition-all duration-300 shadow-lg hover:scale-110 ${isHovering ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <Camera size={size === 'xs' || size === 'sm' ? 14 : 22} />
          <input 
            type="file" 
            className="hidden" 
            accept="image/*"
            onChange={onFileChange}
          />
        </label>
      )}
    </div>
    
  );
};

export default ProfilePhoto;