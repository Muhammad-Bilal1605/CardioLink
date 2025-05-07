import { useState, useEffect } from 'react';
import { Camera, Save, RefreshCw, Moon, Sun, Palette } from 'lucide-react';

export default function DoctorProfile() {
  // Doctor data state
  const [doctor, setDoctor] = useState({
    id: '123',
    name: 'Dr. Sarah Johnson',
    email: 'dr.sarah@medhub.com',
    specialization: 'Cardiologist',
    bio: 'Heart specialist with over 10 years of experience. Passionate about preventive cardiology and patient education.',
    profilePicture: '/api/placeholder/150/150',
  });

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState(doctor.bio);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(doctor.profilePicture);
  
  // Theme management
  const themes = [
    'light',
    'dark',
    'cupcake',
    'bumblebee',
    'emerald',
    'corporate',
    'synthwave',
    'retro',
    'cyberpunk',
    'valentine',
    'halloween',
    'garden',
    'forest',
    'aqua',
    'lofi',
    'pastel',
    'fantasy',
    'wireframe',
    'black',
    'luxury',
    'dracula',
    'cmyk',
    'autumn',
    'business',
    'acid',
    'lemonade',
    'night',
    'coffee',
    'winter',
  ];
  
  const [currentTheme, setCurrentTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('doctor-theme') || 'light';
    }
    return 'light';
  });

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('doctor-theme', currentTheme);
    }
  }, [currentTheme]);

  // Handle file selection for profile picture
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const handleSaveProfile = () => {
    // Here you would typically send data to backend
    setDoctor({
      ...doctor,
      bio: bioText,
      profilePicture: previewUrl,
    });
    
    // Update global state or context here if needed
    // For example: updateDoctorContext({ ...doctor, bio: bioText, profilePicture: previewUrl });
    
    setIsEditing(false);
    
    // Show toast notification
    document.getElementById('save-toast').classList.remove('hidden');
    setTimeout(() => {
      document.getElementById('save-toast').classList.add('hidden');
    }, 3000);
  };

  // Reset editing changes
  const handleCancelEdit = () => {
    setBioText(doctor.bio);
    setPreviewUrl(doctor.profilePicture);
    setSelectedFile(null);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full p-4 max-w-6xl mx-auto">
      {/* Left sidebar with profile picture and basic info */}
      <div className="w-full md:w-1/3 flex flex-col items-center bg-base-200 p-6 rounded-lg">
        <div className="relative group">
          <div className="avatar">
            <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Doctor profile" 
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-primary text-primary-content p-2 rounded-full cursor-pointer hover:bg-primary-focus transition-all">
              <Camera size={20} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
        
        <h2 className="text-2xl font-bold mt-4">{doctor.name}</h2>
        <p className="text-lg text-secondary">{doctor.specialization}</p>
        <p className="text-sm opacity-75 mt-1">{doctor.email}</p>
        
        {!isEditing ? (
          <button 
            className="btn btn-primary mt-6"
            onClick={() => setIsEditing(true)}
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2 mt-6">
            <button 
              className="btn btn-primary"
              onClick={handleSaveProfile}
            >
              <Save size={16} className="mr-1" />
              Save
            </button>
            <button 
              className="btn btn-outline"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Right content area with bio and settings */}
      <div className="w-full md:w-2/3 flex flex-col gap-6">
        {/* Bio section */}
        <div className="bg-base-200 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4 flex items-center">
            Bio
            {isEditing && <span className="text-sm font-normal ml-2 opacity-75">(Edit your bio like on Instagram/WhatsApp)</span>}
          </h3>
          
          {isEditing ? (
            <div className="form-control">
              <textarea 
                className="textarea textarea-bordered h-32" 
                value={bioText}
                onChange={(e) => setBioText(e.target.value)}
                placeholder="Write something about yourself..."
              ></textarea>
              <div className="text-right text-sm opacity-75 mt-1">
                {bioText.length}/500 characters
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-line">{doctor.bio}</p>
          )}
        </div>
        
        {/* Settings section */}
        <div className="bg-base-200 p-6 rounded-lg">
          <h3 className="text-xl font-bold mb-4">Settings</h3>
          
          {/* Theme selector */}
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2 flex items-center">
              <Palette size={20} className="mr-2" />
              Theme
            </h4>
            
            <div className="flex flex-wrap gap-2">
              <select 
                className="select select-bordered w-full" 
                value={currentTheme}
                onChange={(e) => setCurrentTheme(e.target.value)}
              >
                {themes.map(theme => (
                  <option key={theme} value={theme}>{theme}</option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-between mt-4">
              <button 
                className="btn btn-sm" 
                onClick={() => setCurrentTheme('light')}
              >
                <Sun size={16} className="mr-1" />
                Light
              </button>
              <button 
                className="btn btn-sm" 
                onClick={() => setCurrentTheme('dark')}
              >
                <Moon size={16} className="mr-1" />
                Dark
              </button>
              <button 
                className="btn btn-sm"
                onClick={() => {
                  const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                  setCurrentTheme(randomTheme);
                }}
              >
                <RefreshCw size={16} className="mr-1" />
                Random
              </button>
            </div>
          </div>
          
          {/* Other settings can be added here */}
          <div className="divider"></div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Notifications</h4>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>Email notifications</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>SMS notifications</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" />
                <span>Push notifications</span>
              </label>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Privacy</h4>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>Show online status</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-4">
                <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                <span>Show profile to patients</span>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast notification for save confirmation */}
      <div id="save-toast" className="toast toast-top toast-end hidden">
        <div className="alert alert-success">
          <span>Profile updated successfully!</span>
        </div>
      </div>
    </div>
  );
}