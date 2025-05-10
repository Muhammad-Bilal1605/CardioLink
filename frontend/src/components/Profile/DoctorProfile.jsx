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
    <div className="min-h-screen bg-gradient-to-br from-base-100 to-base-200 transition-all duration-500 ease-in-out">
      {/* Header with doctor name and theme toggle */}
      <div className="navbar bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg sticky top-0 z-10 transition-all duration-500">
        <div className="flex-1">
          <div className="avatar online">
            <div className="w-10 h-10 rounded-full mr-3 ring ring-white ring-offset-base-100 ring-offset-2">
              <img src={doctor.profilePicture} alt={doctor.name} />
            </div>
          </div>
          <span className="text-lg font-bold text-white">{doctor.name}</span>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full ring ring-white ring-offset-base-100 ring-offset-2">
                <img src={doctor.profilePicture} alt={doctor.name} />
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-10 p-2 shadow menu menu-sm dropdown-content bg-white text-gray-800 rounded-box w-52">
              <li><a onClick={() => setActiveTab('profile')} className="hover:bg-emerald-100">Profile</a></li>
              <li><a onClick={() => setActiveTab('settings')} className="hover:bg-emerald-100">Settings</a></li>
              <li><a className="hover:bg-emerald-100">Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl animate-fadeIn">
        {/* Profile hero section */}
        <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all duration-500">
          {/* Cover image */}
          <div 
            className="h-48 bg-gradient-to-r from-green-500 to-emerald-600 opacity-90"
          ></div>
          
          <div className="relative px-6 pb-6">
            {/* Profile picture overlapping the cover */}
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <div className="relative group">
                <div className={`avatar ${isUploading ? 'animate-pulse' : ''}`}>
                  <div className="w-32 h-32 rounded-full ring ring-white ring-offset-base-100 ring-offset-4 overflow-hidden shadow-2xl bg-gray-100 transition-transform duration-500 group-hover:ring-4 group-hover:ring-emerald-400">
                    {isUploading ? (
                      <div className="flex justify-center items-center w-full h-full">
                        <Loader className="animate-spin text-emerald-500" size={40} />
                      </div>
                    ) : (
                      <img 
                        src={previewUrl} 
                        alt="Doctor profile" 
                        className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                      />
                    )}
                  </div>
                </div>
                
                {isEditing && (
                  <label className="absolute bottom-0 right-0 bg-emerald-500 text-white p-3 rounded-full cursor-pointer hover:bg-emerald-600 transition-all duration-300 shadow-lg hover:scale-110 transform hover:rotate-12">
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
                  className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1"
                  onClick={() => setIsEditing(true)}
                >
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button 
                    className={`px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg flex items-center space-x-2 hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-1 ${isUploading ? 'opacity-80' : ''}`}
                    onClick={handleSaveProfile}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save</span>
                      </>
                    )}
                  </button>
                  <button 
                    className="px-6 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg flex items-center space-x-2 hover:bg-gray-50 transition-all shadow hover:shadow-md"
                    onClick={handleCancelEdit}
                    disabled={isUploading}
                  >
                    <X size={16} />
                    <span>Cancel</span>
                  </button>
                </div>
              )}
            </div>
            
            {/* Doctor info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-800">{doctor.name}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">{doctor.specialization}</span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star size={16} fill="currentColor" />
                  <span className="text-gray-700">{doctor.rating}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-all duration-300">
                  <Mail size={18} className="text-emerald-500" />
                  <span className="text-gray-700">{doctor.email}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-all duration-300">
                  <Users size={18} className="text-emerald-500" />
                  <span className="text-gray-700">{doctor.patients}+ Patients</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-all duration-300">
                  <MapPin size={18} className="text-emerald-500" />
                  <span className="text-gray-700">{doctor.location}</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-all duration-300">
                  <Calendar size={18} className="text-emerald-500" />
                  <span className="text-gray-700">{doctor.experience} Experience</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-emerald-50 transition-all duration-300 md:col-span-2">
                  <Clock size={18} className="text-emerald-500" />
                  <span className="text-gray-700">{doctor.availability}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for profile and settings */}
        <div className="flex bg-gray-100 rounded-xl p-1 mt-8 justify-center">
          <button 
            className={`px-6 py-2 rounded-lg transition-all duration-300 ${activeTab === 'profile' ? 'bg-white text-emerald-600 shadow-md font-medium' : 'text-gray-600 hover:text-emerald-600'}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button 
            className={`px-6 py-2 rounded-lg transition-all duration-300 ${activeTab === 'settings' ? 'bg-white text-emerald-600 shadow-md font-medium' : 'text-gray-600 hover:text-emerald-600'}`}
            onClick={() => setActiveTab('settings')}
          >
            Settings
          </button>
        </div>

        {/* Main content area */}
        <div className="mt-6 grid gap-6">
          {activeTab === 'profile' && (
            <div className="animate-slideIn">
              {/* Bio section */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500">
                <h3 className="text-xl font-bold mb-4 flex items-center text-gray-800">
                  Bio
                  {isEditing && <span className="text-sm font-normal ml-2 text-gray-500">(Edit your professional bio)</span>}
                </h3>
                
                {isEditing ? (
                  <div className="form-control">
                    <textarea 
                      className="textarea textarea-bordered h-40 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300" 
                      value={bioText}
                      onChange={(e) => setBioText(e.target.value)}
                      placeholder="Write something about yourself..."
                      maxLength={500}
                    ></textarea>
                    <div className="text-right text-sm mt-2">
                      <span className={bioText.length > 400 ? 'text-amber-500' : 'text-gray-500'}>
                        {bioText.length}/500 characters
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="prose max-w-none text-gray-700">
                    <p className="whitespace-pre-line">{doctor.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="animate-slideIn">
              {/* Settings section */}
              <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-500">
                {/* Theme selector */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Palette size={22} className="text-emerald-500" />
                    Theme
                  </h3>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 text-gray-700">Recommended Themes for Medical Apps</h4>
                    <div className="flex flex-wrap gap-2">
                      {recommendedThemes.map(theme => (
                        <button
                          key={theme}
                          className={`px-4 py-2 rounded-lg capitalize transition-all duration-300 ${currentTheme === theme ? 'bg-emerald-500 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          onClick={() => setCurrentTheme(theme)}
                        >
                          {theme}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <h4 className="font-medium mb-2 text-gray-700">All Available Themes</h4>
                  <select 
                    className="select select-bordered w-full focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300 bg-white" 
                    value={currentTheme}
                    onChange={(e) => setCurrentTheme(e.target.value)}
                  >
                    {themes.map(theme => (
                      <option key={theme} value={theme}>{theme}</option>
                    ))}
                  </select>
                  
                  <div className="flex justify-between mt-4">
                    <button 
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-all duration-300 hover:scale-105" 
                      onClick={() => setCurrentTheme('light')}
                    >
                      <Sun size={16} />
                      <span>Light</span>
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-all duration-300 hover:scale-105" 
                      onClick={() => setCurrentTheme('dark')}
                    >
                      <Moon size={16} />
                      <span>Dark</span>
                    </button>
                    <button 
                      className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg flex items-center gap-1 hover:bg-gray-200 transition-all duration-300 hover:scale-105"
                      onClick={() => {
                        const randomTheme = themes[Math.floor(Math.random() * themes.length)];
                        setCurrentTheme(randomTheme);
                      }}
                    >
                      <RefreshCw size={16} />
                      <span>Random</span>
                    </button>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                {/* Notifications section */}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Bell size={22} className="text-emerald-500" />
                    Notifications
                  </h3>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <Mail size={18} className="text-emerald-500" />
                        <div>
                          <p className="font-medium text-gray-800">Email Notifications</p>
                          <p className="text-sm text-gray-500">Receive appointment updates via email</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <Phone size={18} className="text-emerald-500" />
                        <div>
                          <p className="font-medium text-gray-800">SMS Notifications</p>
                          <p className="text-sm text-gray-500">Receive text messages for urgent updates</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <MessageSquare size={18} className="text-emerald-500" />
                        <div>
                          <p className="font-medium text-gray-800">Push Notifications</p>
                          <p className="text-sm text-gray-500">Receive push notifications on your device</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" />
                    </div>
                  </div>
                </div>
                
                <div className="divider"></div>
                
                {/* Privacy section */}
                <div className="mb-4">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <Shield size={22} className="text-emerald-500" />
                    Privacy
                  </h3>
                  
                  <div className="grid gap-3">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <div className="text-emerald-500">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Show Online Status</p>
                          <p className="text-sm text-gray-500">Let others see when you're available</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <div className="text-emerald-500">
                          <Users size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Show Profile to Patients</p>
                          <p className="text-sm text-gray-500">Make your profile visible to your patients</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:shadow-md transition-all duration-300">
                      <div className="flex gap-3 items-center">
                        <div className="text-emerald-500">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Share Availability</p>
                          <p className="text-sm text-gray-500">Allow patients to see your availability</p>
                        </div>
                      </div>
                      <input type="checkbox" className="toggle toggle-success" defaultChecked />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Floating action button */}
      <button className="fixed right-6 bottom-6 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-300 flex items-center justify-center">
        <MessageSquare size={24} />
      </button>
      
      {/* Toast notification for save confirmation */}
      <div id="save-toast" className="toast toast-end fixed bottom-6 right-6 transition-all duration-500 transform translate-x-full opacity-0">
        <div className="alert alert-success shadow-lg flex gap-2 bg-emerald-500 text-white">
          <Check size={20} />
          <span>Profile updated successfully!</span>
        </div>
      </div>
    </div>
  );
}