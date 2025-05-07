import { useState, useEffect } from 'react';
import { Camera, Save, RefreshCw, Moon, Sun, Palette, Check, X, ChevronRight, Bell, Shield, Mail, Phone, MessageSquare, Calendar, Clock, Users, MapPin, Loader, Star } from 'lucide-react';
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from 'react-router-dom';


export default function DoctorProfile() {

   const { user } = useAuthStore();
    const navigate = useNavigate();
  // Doctor data state
  const [doctor, setDoctor] = useState({
    id: '123',
    name: user?.name || 'Doctor Name', // Properly access user name with fallback
    email: user?.email || 'dr.sarah@medhub.com',
    specialization: 'Cardiologist',
    location: 'Medical Center Hospital, New York',
    experience: '10+ years',
    rating: 4.8,
    patients: 1200,
    availability: 'Mon-Fri, 9:00 AM - 5:00 PM',
    bio: 'Heart specialist with over 10 years of experience. Passionate about preventive cardiology and patient education.',
    profilePicture: '/api/placeholder/150/150',
  });

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState(doctor.bio);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(doctor.profilePicture);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  
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
    // Get theme from localStorage or default to 'emerald'
    if (typeof window !== 'undefined') {
      return localStorage.getItem('doctor-theme') || 'emerald';
    }
    return 'emerald';
  });

  // Recommended themes for medical applications
  const recommendedThemes = ['emerald', 'corporate', 'aqua', 'light', 'winter', 'lofi'];

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem('doctor-theme', currentTheme);
    }
  }, [currentTheme]);

  // Simulate photo upload with delay
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        // Simulate network delay
        setTimeout(() => {
          setPreviewUrl(reader.result);
          setIsUploading(false);
        }, 1500);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save profile changes
  const handleSaveProfile = () => {
    // Simulate saving with loading state
    setIsUploading(true);
    
    // Simulate network delay
    setTimeout(() => {
      setDoctor({
        ...doctor,
        bio: bioText,
        profilePicture: previewUrl,
      });
      
      setIsEditing(false);
      setIsUploading(false);
      
      // Show toast notification
      document.getElementById('save-toast').classList.remove('translate-x-full', 'opacity-0');
      setTimeout(() => {
        document.getElementById('save-toast').classList.add('translate-x-full', 'opacity-0');
      }, 3000);
    }, 1000);
  };

  // Reset editing changes
  const handleCancelEdit = () => {
    setBioText(doctor.bio);
    setPreviewUrl(doctor.profilePicture);
    setSelectedFile(null);
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-base-100 transition-all duration-300 ease-in-out">
      {/* Header with doctor name and theme toggle */}
      <div className="navbar bg-base-200 shadow-lg sticky top-0 z-10 transition-all duration-300">
        <div className="flex-1">
          <div className="avatar online">
            <div className="w-10 h-10 rounded-full mr-3 ring ring-primary ring-offset-base-100 ring-offset-2">
              <img src={doctor.profilePicture} alt={doctor.name} />
            </div>
          </div>
          <span className="text-lg font-bold">{doctor.name}</span>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full">
                <img src={doctor.profilePicture} alt={doctor.name} />
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-10 p-2 shadow menu menu-sm dropdown-content bg-base-200 rounded-box w-52">
              <li><a onClick={() => setActiveTab('profile')}>Profile</a></li>
              <li><a onClick={() => setActiveTab('settings')}>Settings</a></li>
              <li><a>Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl animate-fadeIn">
        {/* Profile hero section */}
        <div className="bg-base-200 rounded-box shadow-xl overflow-hidden">
          {/* Cover image */}
          <div 
            className="h-48 bg-gradient-to-r from-primary to-secondary opacity-80"
          ></div>
          
          <div className="relative px-6 pb-6">
            {/* Profile picture overlapping the cover */}
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <div className="relative group">
                <div className={`avatar ${isUploading ? 'animate-pulse' : ''}`}>
                  <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-4 overflow-hidden shadow-2xl bg-base-300">
                    {isUploading ? (
                      <div className="flex justify-center items-center w-full h-full">
                        <Loader className="animate-spin text-primary" size={40} />
                      </div>
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Doctor profile" 
                        className="object-cover w-full h-full transition-transform duration-500 hover:scale-110"
                      />
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-primary text-primary-content p-3 rounded-full cursor-pointer hover:bg-primary-focus transition-all duration-300 shadow-lg hover:scale-110">
                    <Camera size={22} />
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </label>
                )}
              </div>
              
              {!isEditing ? (
                <button 
                  className="btn btn-primary btn-md gap-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    className={`btn btn-primary gap-1 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${isUploading ? 'loading' : ''}`}
                    onClick={handleSaveProfile}
                    disabled={isUploading}
                  >
                    {!isUploading && <Save size={16} />}
                    Save
                  </button>
                  <button 
                    className="btn btn-outline gap-1 hover:shadow-lg transition-all duration-300"
                    onClick={handleCancelEdit}
                    disabled={isUploading}
                  >
                    <X size={16} />
                    Cancel
                  </button>
                </div>
              )}
            </div>
            
            {/* Doctor info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold">{doctor.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="badge badge-primary badge-lg">{doctor.specialization}</span>
                <div className="flex items-center gap-1 text-warning">
                  <Star size={16} fill="currentColor" />
                  <span>{doctor.rating}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <Mail size={16} className="text-primary" />
                  <span>{doctor.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary" />
                  <span>{doctor.patients}+ Patients</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-primary" />
                  <span>{doctor.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  <span>{doctor.experience} Experience</span>
                </div>
                <div className="flex items-center gap-2 md:col-span-2">
                  <Clock size={16} className="text-primary" />
                  <span>{doctor.availability}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for profile and settings */}
        <div className="tabs tabs-boxed bg-base-200 mt-6 p-1 justify-center">
          <a 
            className={`tab ${activeTab === 'profile' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </a>
          <a 
            className={`tab ${activeTab === 'settings' ? 'tab-active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </a>
        </div>

        {/* Main content area */}
        <div className="mt-6 grid gap-6">
          {activeTab === 'profile' && (
            <div className="animate-slideIn">
              {/* Bio section */}
              <div className="bg-base-200 p-6 rounded-box shadow-lg hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  Bio
                  {isEditing && <span className="text-sm font-normal ml-2 opacity-75">(Edit your professional bio)</span>}
                </h3>
                
                {isEditing ? (
                  <div className="form-control">
                    <textarea 
                      className="textarea textarea-bordered h-40 focus:border-primary transition-all duration-300" 
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Write something about yourself..."
                      maxLength={500}
                    ></textarea>
                    <div className="text-right text-sm mt-2">
                      <span className={bioText.length > 400 ? 'text-warning' : 'opacity-75'}>
                        {bioText.length}/500 characters
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-line">{doctor.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slideIn">
              {/* Settings section */}
              <div className="bg-base-200 p-6 rounded-box shadow-lg hover:shadow-xl transition-all duration-300">
                {/* Theme selector */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Palette size={22} className="text-primary" />
                    Theme
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2">Recommended Themes for Medical Apps</h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendedThemes.map(theme => (
                        <button
                          key={theme}
                          className={`btn ${currentTheme === theme ? 'btn-primary' : 'btn-outline'} capitalize transition-all duration-300`}
                          onClick={() => setCurrentTheme(theme)}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2">All Available Themes</h4>
                  <select 
                    className="select select-bordered w-full focus:border-primary transition-all duration-300" 
                    value={currentTheme}
                    onChange={(e) => setCurrentTheme(e.target.value)}
                  >
                    {themes.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                  
                  <div className="flex justify-between mt-4">
                    <button 
                      className="btn btn-sm btn-outline gap-1 hover:scale-105 transition-all duration-300" 
                      onClick={() => setCurrentTheme('light')}
                    >
                      <Sun size={16} />
                      Light
                    </button>
                    <button 
                      className="btn btn-sm btn-outline gap-1 hover:scale-105 transition-all duration-300" 
                      onClick={() => setCurrentTheme('dark')}
                    >
                      <Moon size={16} />
                      Dark
                    </button>
                    <button 
                      className="btn btn-sm btn-outline gap-1 hover:scale-105 transition-all duration-300"
                      onClick={() => {
                        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                        setCurrentTheme(randomTheme);
                      }}
                    >
                      <RefreshCw size={16} />
                      Random
                    </button>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                {/* Notifications section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Bell size={22} className="text-primary" />
                    Notifications
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <Mail size={18} />
                        <div>
                          <p className="font-medium">Email Notifications</p>
                          <p className="text-sm opacity-75">Receive appointment updates via email</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <Phone size={18} />
                        <div>
                          <p className="font-medium">SMS Notifications</p>
                          <p className="text-sm opacity-75">Receive text messages for urgent updates</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <MessageSquare size={18} />
                        <div>
                          <p className="font-medium">Push Notifications</p>
                          <p className="text-sm opacity-75">Receive push notifications on your device</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" />
                    </div>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                {/* Privacy section */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Shield size={22} className="text-primary" />
                    Privacy
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <div className="text-primary">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-medium">Show Online Status</p>
                          <p className="text-sm opacity-75">Let others see when you're available</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <div className="text-primary">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-medium">Show Profile to Patients</p>
                          <p className="text-sm opacity-75">Make your profile visible to your patients</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <div className="text-primary">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="font-medium">Share Availability</p>
                          <p className="text-sm opacity-75">Allow patients to see your availability</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-primary" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating action button */}
      <button className="fixed right-6 bottom-6 btn btn-circle btn-primary btn-lg shadow-lg hover:shadow-2xl hover:scale-110 transition-all duration-300">
        <MessageSquare size={24} />
      </button>
      
      {/* Toast notification for save confirmation */}
      <div id="save-toast" className="toast toast-end fixed bottom-6 right-6 transition-all duration-500 transform translate-x-full opacity-0">
        <div className="alert alert-success shadow-lg flex gap-2">
          <Check size={20} />
          <span>Profile updated successfully!</span>
        </div>
      </div>
    </div>
  );
}