import { useState, useEffect } from 'react';
import { 
  Camera, Save, RefreshCw, Moon, Sun, Palette, Check, X, 
  ChevronLeft, Bell, Shield, Mail, Phone, MessageSquare, 
  Calendar, Clock, Users, MapPin, Loader, Star, HeartPulse,
  Stethoscope, Pill, Activity, ClipboardList, BadgeDollarSign,
  Award, BarChart2, Settings, LogOut, BookOpen, Video
} from 'lucide-react';
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from 'react-router-dom';

export default function DoctorProfile() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // Handle navigation back to dashboard
  const handleBackToDashboard = () => navigate('/dashboard');

  // Doctor data state
  const [doctor, setDoctor] = useState({
    id: '123',
    name: user?.name || 'Dr. Sarah Johnson',
    email: user?.email || 'dr.sarah@medhub.com',
    specialization: 'Cardiologist',
    location: 'Medical Center Hospital, New York',
    experience: '10+ years',
    rating: 4.8,
    patients: 1280,
    availability: 'Mon-Fri, 9:00 AM - 5:00 PM',
    bio: 'Board-certified cardiologist with over 10 years of experience. Specializing in preventive cardiology, heart failure management, and non-invasive procedures. Committed to patient-centered care and cardiovascular research.',
    profilePicture: '/doctor-avatar.jpg',
    consultations: 2450,
    satisfactionRate: 98,
    awards: ['Top Cardiologist 2023', 'Patient Choice Award'],
    education: [
      { degree: 'MD', university: 'Harvard Medical School', year: 2010 },
      { degree: 'Residency', university: 'Massachusetts General Hospital', year: 2014 }
    ]
  });

  // Profile editing states
  const [isEditing, setIsEditing] = useState(false);
  const [bioText, setBioText] = useState(doctor.bio);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(doctor.profilePicture);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Theme management
  const [currentTheme, setCurrentTheme] = useState('luxury');
  const [showThemeModal, setShowThemeModal] = useState(false);

  // Stats data
  const [stats, setStats] = useState({
    weeklyPatients: [45, 52, 48, 55, 60, 52, 58],
    monthlyRevenue: 125000,
    topServices: [
      { name: 'Cardiac Consultation', value: 320 },
      { name: 'Echocardiogram', value: 280 },
      { name: 'Stress Test', value: 195 }
    ]
  });

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  // Simulate photo upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setIsUploading(true);
      
      const reader = new FileReader();
      reader.onloadend = () => {
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
    setIsUploading(true);
    
    setTimeout(() => {
      setDoctor({ ...doctor, bio: bioText, profilePicture: previewUrl });
      setIsEditing(false);
      setIsUploading(false);
      
      // Show success notification
      const toast = document.getElementById('save-toast');
      toast.classList.remove('translate-y-20', 'opacity-0');
      setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-base-100 transition-all duration-500">
      {/* Floating background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-900 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float"></div>
        <div className="absolute bottom-20 right-10 w-64 h-64 bg-blue-900 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float-delay"></div>
      </div>

      {/* Main Navigation */}
      <div className="navbar bg-base-200/90 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="flex-1">
          <button 
            onClick={handleBackToDashboard}
            className="btn btn-ghost btn-circle hover:bg-emerald-700/20 transition-all duration-300 group"
          >
            <ChevronLeft className="text-emerald-400 group-hover:text-emerald-200" size={24} />
          </button>
          <div className="ml-2">
            <h1 className="text-xl font-bold text-emerald-50">{doctor.name}</h1>
            <p className="text-xs text-emerald-200">{doctor.specialization}</p>
          </div>
        </div>
        
        <div className="flex-none gap-4">
          <button className="btn btn-ghost btn-circle text-emerald-300 hover:text-emerald-100">
            <Bell size={20} />
          </button>
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full ring ring-emerald-500 ring-offset-base-100 ring-offset-2">
                <img src={doctor.profilePicture} alt={doctor.name} />
              </div>
            </label>
            <ul tabIndex={0} className="mt-3 z-50 p-2 shadow-lg menu menu-sm dropdown-content bg-base-200 rounded-box w-52 backdrop-blur-md animate-fadeIn">
              <li>
                <a className="hover:bg-emerald-700/20" onClick={() => setActiveTab('overview')}>
                  <BookOpen size={16} /> Profile
                </a>
              </li>
              <li>
                <a className="hover:bg-emerald-700/20" onClick={() => setActiveTab('settings')}>
                  <Settings size={16} /> Settings
                </a>
              </li>
              <li>
                <a className="hover:bg-rose-700/20 text-rose-400">
                  <LogOut size={16} /> Logout
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 max-w-6xl">
        {/* Profile Header */}
<div className="card bg-gradient-to-br from-emerald-900/80 via-teal-800/70 to-base-200 shadow-xl overflow-hidden transition-all duration-700 hover:shadow-2xl transform hover:-translate-y-1">
  {/* Animated Background */}
  <div className="h-48 bg-gradient-to-r from-emerald-800 to-emerald-600 relative overflow-hidden group">
    <div className="absolute inset-0 bg-[url('/medical-pattern.svg')] opacity-10 bg-repeat animate-pulse"></div>
    
    {/* Animated particles */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute w-12 h-12 rounded-full bg-emerald-300/20 top-10 left-1/4 animate-float"></div>
      <div className="absolute w-8 h-8 rounded-full bg-teal-400/10 top-20 left-1/2 animate-float-slow"></div>
      <div className="absolute w-16 h-16 rounded-full bg-emerald-500/10 bottom-10 right-1/4 animate-float-delay"></div>
    </div>
    
    {/* Enhanced gradient overlay */}
    <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-base-200/95 via-base-200/70 to-transparent backdrop-blur-sm transition-all duration-500 group-hover:h-28"></div>
  </div>
  
  <div className="relative px-8 pb-8 -mt-16">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div className="flex items-end gap-6">
        <div className="relative group">
          <div className={`avatar ${isUploading ? 'animate-pulse' : ''}`}>
            <div className="w-32 h-32 rounded-full ring-4 ring-emerald-500/80 ring-offset-4 ring-offset-base-200 overflow-hidden shadow-xl bg-base-300 transition-all duration-500 group-hover:ring-emerald-400 group-hover:ring-offset-6">
              {isUploading ? (
                <div className="flex justify-center items-center w-full h-full bg-emerald-900/20">
                  <Loader className="animate-spin text-emerald-400" size={40} />
                </div>
              ) : (
                <div className="overflow-hidden w-full h-full">
                  <img 
                    src={previewUrl} 
                    alt="Doctor profile" 
                    className="object-cover w-full h-full transition-all duration-700 group-hover:scale-110 group-hover:rotate-2"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/0 to-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
              )}
            </div>
          </div>
          
          {isEditing && (
            <label className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-3 rounded-full cursor-pointer hover:bg-emerald-500 transition-all duration-300 shadow-lg hover:scale-110 hover:rotate-12 animate-bounce-gentle">
              <Camera size={20} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
            </label>
          )}
          
          {/* Decorative rings */}
          <div className="absolute -inset-1 rounded-full border border-emerald-400/20 scale-110 -z-10"></div>
          <div className="absolute -inset-2 rounded-full border border-emerald-400/10 scale-125 -z-10"></div>
        </div>
        
        <div className="mb-2 transform transition-all duration-500">
          <h1 className="text-3xl font-bold text-emerald-50 hover:text-emerald-200 transition-colors duration-300">
            {doctor.name}
            <div className="h-1 w-0 bg-emerald-400 mt-1 transition-all duration-700 group-hover:w-full"></div>
          </h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="badge badge-lg bg-emerald-700/80 border-emerald-500 text-emerald-50 shadow-md hover:shadow-lg transition-all duration-300 hover:bg-emerald-600/90 transform hover:-translate-y-1">
              {doctor.specialization}
            </span>
            <div className="flex items-center gap-1 text-amber-300 transition-all duration-300 hover:scale-110 hover:text-amber-200">
              <Star size={18} fill="currentColor" className="transform transition-transform duration-300 hover:rotate-12" />
              <span>{doctor.rating}</span>
            </div>
            <div className="flex items-center gap-1 text-blue-300 transition-all duration-300 hover:scale-110 hover:text-blue-200">
              <Stethoscope size={18} className="transform transition-transform duration-300 hover:rotate-12" />
              <span>{doctor.experience}</span>
            </div>
          </div>
        </div>
      </div>
      
      {!isEditing ? (
        <button 
          className="btn btn-outline btn-success gap-2 shadow-lg hover:shadow-emerald-500/20 transition-all duration-500 hover:-translate-y-1 group overflow-hidden relative"
          onClick={() => setIsEditing(true)}
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-600/0 via-emerald-600/30 to-emerald-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
          <svg className="w-5 h-5 group-hover:rotate-12 transition-transform duration-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Edit Profile
        </button>
      ) : (
        <div className="flex gap-3">
          <button 
            className={`btn btn-success gap-2 shadow-lg hover:shadow-emerald-500/30 transition-all duration-500 hover:-translate-y-1 relative overflow-hidden group ${isUploading ? 'loading' : ''}`}
            onClick={handleSaveProfile}
            disabled={isUploading}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-600/0 via-white/20 to-emerald-600/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            {!isUploading && <Save size={18} className="group-hover:scale-110 transition-transform duration-300" />}
            Save Changes
          </button>
          <button 
            className="btn btn-outline gap-2 hover:shadow-lg transition-all duration-300 hover:bg-base-300 relative overflow-hidden group"
            onClick={() => {
              setBioText(doctor.bio);
              setPreviewUrl(doctor.profilePicture);
              setIsEditing(false);
            }}
            disabled={isUploading}
          >
            <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-base-300/0 via-base-300/30 to-base-300/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></span>
            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Cancel
          </button>
        </div>
      )}
    </div>
  </div>
</div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Stats */}
            <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
              <div className="card-body p-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-300">
                  <Activity size={20} />
                  Quick Stats
                </h3>
                <div className="space-y-4 mt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-75">Patients</span>
                    <span className="font-medium">{doctor.patients.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-75">Consultations</span>
                    <span className="font-medium">{doctor.consultations.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-75">Satisfaction</span>
                    <span className="font-medium text-emerald-400">{doctor.satisfactionRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
              <div className="card-body p-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-300">
                  <Mail size={20} />
                  Contact
                </h3>
                <div className="space-y-3 mt-4">
                  <div className="flex items-center gap-3">
                    <Mail size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm break-all">{doctor.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm">{doctor.location}</span>
                  </div>
                </div>
                <div className="divider my-3"></div>
                <div className="flex gap-3">
                  <button className="btn btn-sm btn-outline btn-success flex-1">
                    <MessageSquare size={16} />
                    Message
                  </button>
                  <button className="btn btn-sm btn-outline btn-info flex-1">
                    <Video size={16} />
                    Video Call
                  </button>
                </div>
              </div>
            </div>

            {/* Availability */}
            <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
              <div className="card-body p-6">
                <h3 className="font-bold text-lg flex items-center gap-2 text-emerald-300">
                  <Calendar size={20} />
                  Availability
                </h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Monday - Friday</span>
                    <span className="badge badge-success badge-sm">9AM - 5PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Saturday</span>
                    <span className="badge badge-warning badge-sm">10AM - 2PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Sunday</span>
                    <span className="badge badge-error badge-sm">Closed</span>
                  </div>
                </div>
                <div className="mt-4">
                  <button className="btn btn-sm btn-success w-full">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Navigation Tabs */}
            <div className="tabs tabs-boxed bg-base-200/50 backdrop-blur-sm p-1">
              <a 
                className={`tab ${activeTab === 'overview' ? 'tab-active bg-emerald-600 text-white' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                Overview
              </a>
              <a 
                className={`tab ${activeTab === 'profile' ? 'tab-active bg-emerald-600 text-white' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                Professional Profile
              </a>
              <a 
                className={`tab ${activeTab === 'stats' ? 'tab-active bg-emerald-600 text-white' : ''}`}
                onClick={() => setActiveTab('stats')}
              >
                Statistics
              </a>
              <a 
                className={`tab ${activeTab === 'settings' ? 'tab-active bg-emerald-600 text-white' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                Settings
              </a>
            </div>

            {/* Tab Content */}
            <div className="transition-all duration-500">
              {activeTab === 'overview' && (
                <div className="grid gap-6 animate-fadeIn">
                  {/* Bio Section */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <HeartPulse size={22} />
                        Professional Bio
                      </h2>
                      {isEditing ? (
                        <div className="form-control mt-4">
                          <textarea 
                            className="textarea textarea-bordered h-40 focus:border-emerald-500 bg-base-200/70 transition-all duration-300" 
                            value={bioText}
                            onChange={(e) => setBioText(e.target.value)}
                            placeholder="Write your professional bio..."
                            maxLength={1000}
                          ></textarea>
                          <div className="text-right text-sm mt-2">
                            <span className={bioText.length > 800 ? 'text-warning' : 'opacity-75'}>
                              {bioText.length}/1000 characters
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4 prose prose-invert max-w-none">
                          <p className="whitespace-pre-line">{doctor.bio}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Education & Awards */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Education */}
                    <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                      <div className="card-body">
                        <h2 className="card-title text-emerald-300">
                          <BookOpen size={22} />
                          Education
                        </h2>
                        <div className="mt-4 space-y-4">
                          {doctor.education.map((edu, index) => (
                            <div key={index} className="flex gap-4">
                              <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-emerald-900/50 flex items-center justify-center">
                                  <span className="text-emerald-400 font-bold">{edu.degree.charAt(0)}</span>
                                </div>
                                {index < doctor.education.length - 1 && (
                                  <div className="w-0.5 h-8 bg-emerald-800/50 my-1"></div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium">{edu.degree}</h3>
                                <p className="text-sm opacity-80">{edu.university}</p>
                                <p className="text-xs opacity-60">{edu.year}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Awards */}
                    <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                      <div className="card-body">
                        <h2 className="card-title text-emerald-300">
                          <Award size={22} />
                          Awards & Recognition
                        </h2>
                        <div className="mt-4 space-y-3">
                          {doctor.awards.map((award, index) => (
                            <div key={index} className="flex gap-3 items-center">
                              <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center">
                                <Star size={16} className="text-amber-400" />
                              </div>
                              <span>{award}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <ClipboardList size={22} />
                        Recent Activity
                      </h2>
                      <div className="mt-4 space-y-4">
                        {[
                          { date: 'Today', action: 'Completed 12 patient consultations', icon: <Users size={18} /> },
                          { date: 'Yesterday', action: 'Published new research paper', icon: <BookOpen size={18} /> },
                          { date: 'May 10', action: 'Received Patient Choice Award', icon: <Award size={18} /> }
                        ].map((item, index) => (
                          <div key={index} className="flex gap-4 items-start">
                            <div className="flex flex-col items-center">
                              <div className="w-8 h-8 rounded-full bg-emerald-900/30 flex items-center justify-center text-emerald-400">
                                {item.icon}
                              </div>
                              {index < 2 && (
                                <div className="w-0.5 h-6 bg-emerald-800/30 my-1"></div>
                              )}
                            </div>
                            <div>
                              <p className="text-sm opacity-75">{item.date}</p>
                              <p>{item.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="animate-fadeIn">
                  {/* Professional Details */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <Stethoscope size={22} />
                        Professional Details
                      </h2>
                      <div className="grid md:grid-cols-2 gap-6 mt-4">
                        <div>
                          <h3 className="font-medium mb-3">Specializations</h3>
                          <div className="space-y-2">
                            {['Cardiology', 'Preventive Care', 'Heart Failure', 'Non-invasive Procedures'].map((spec, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span>{spec}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-medium mb-3">Services Offered</h3>
                          <div className="space-y-2">
                            {[
                              'Cardiac Consultation',
                              'Echocardiogram',
                              'Stress Testing',
                              'Holter Monitoring',
                              'Cardiac Rehabilitation'
                            ].map((service, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                <span>{service}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Publications */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500 mt-6">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <BookOpen size={22} />
                        Publications
                      </h2>
                      <div className="mt-4 space-y-4">
                        {[
                          {
                            title: "Advances in Preventive Cardiology",
                            journal: "Journal of Cardiology",
                            year: 2022,
                            link: "#"
                          },
                          {
                            title: "Heart Failure Management in Elderly",
                            journal: "American Heart Journal",
                            year: 2021,
                            link: "#"
                          }
                        ].map((pub, i) => (
                          <div key={i} className="border-l-2 border-emerald-500 pl-4 py-1">
                            <h3 className="font-medium">{pub.title}</h3>
                            <p className="text-sm opacity-75">{pub.journal}, {pub.year}</p>
                            <a href={pub.link} className="text-emerald-400 text-sm hover:underline">Read publication</a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div className="animate-fadeIn">
                  {/* Statistics Overview */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <BarChart2 size={22} />
                        Practice Statistics
                      </h2>
                      <div className="grid md:grid-cols-3 gap-6 mt-6">
                        <div className="stat bg-base-300/50 rounded-lg p-4">
                          <div className="stat-figure text-emerald-400">
                            <Users size={24} />
                          </div>
                          <div className="stat-title">Monthly Patients</div>
                          <div className="stat-value text-emerald-400">248</div>
                          <div className="stat-desc">↑12% from last month</div>
                        </div>
                        <div className="stat bg-base-300/50 rounded-lg p-4">
                          <div className="stat-figure text-blue-400">
                            <BadgeDollarSign size={24} />
                          </div>
                          <div className="stat-title">Monthly Revenue</div>
                          <div className="stat-value text-blue-400">${(stats.monthlyRevenue / 1000).toFixed(1)}k</div>
                          <div className="stat-desc">↑8% from last month</div>
                        </div>
                        <div className="stat bg-base-300/50 rounded-lg p-4">
                          <div className="stat-figure text-amber-400">
                            <Star size={24} />
                          </div>
                          <div className="stat-title">Patient Rating</div>
                          <div className="stat-value text-amber-400">{doctor.rating}</div>
                          <div className="stat-desc">98% satisfaction</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Charts Section */}
                  <div className="grid md:grid-cols-2 gap-6 mt-6">
                    <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                      <div className="card-body">
                        <h3 className="font-bold text-lg">Weekly Patients</h3>
                        <div className="h-64 mt-4">
                          {/* This would be replaced with an actual chart component */}
                          <div className="w-full h-full flex items-end justify-between">
                            {stats.weeklyPatients.map((value, i) => (
                              <div key={i} className="flex flex-col items-center">
                                <div 
                                  className="w-6 bg-emerald-500 rounded-t-sm hover:bg-emerald-400 transition-all duration-300"
                                  style={{ height: `${value * 2}px` }}
                                  title={`Day ${i+1}: ${value} patients`}
                                ></div>
                                <span className="text-xs mt-1 opacity-70">{['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                      <div className="card-body">
                        <h3 className="font-bold text-lg">Top Services</h3>
                        <div className="h-64 mt-4">
                          {/* This would be replaced with an actual chart component */}
                          <div className="w-full h-full flex flex-col justify-center gap-2">
                            {stats.topServices.map((service, i) => (
                              <div key={i} className="flex items-center gap-3">
                                <span className="w-24 truncate">{service.name}</span>
                                <div className="flex-1 h-6 bg-emerald-900/30 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-emerald-500 rounded-full"
                                    style={{ width: `${(service.value / 400) * 100}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium">{service.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="animate-fadeIn">
                  {/* Theme Settings */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <Palette size={22} />
                        Theme Preferences
                      </h2>
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-3">
                          {['light', 'dark', 'emerald', 'luxury', 'forest', 'aqua'].map(theme => (
                            <button
                              key={theme}
                              className={`btn btn-sm capitalize ${currentTheme === theme ? 'btn-success' : 'btn-outline'}`}
                              onClick={() => setCurrentTheme(theme)}
                            >
                              {theme}
                              {currentTheme === theme && <Check size={16} className="ml-1" />}
                            </button>
                          ))}
                          <button 
                            className="btn btn-sm btn-outline"
                            onClick={() => setShowThemeModal(true)}
                          >
                            More Themes...
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notification Settings */}
                  <div className="card bg-base-200/50 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-500 mt-6">
                    <div className="card-body">
                      <h2 className="card-title text-emerald-300">
                        <Bell size={22} />
                        Notification Settings
                      </h2>
                      <div className="mt-4 space-y-4">
                        <div className="flex items-center justify-between p-3 bg-base-300/30 rounded-lg hover:shadow-sm transition-all duration-300">
                          <div className="flex gap-3 items-center">
                            <Mail size={18} className="text-emerald-400" />
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm opacity-75">Receive appointment updates via email</p>
                            </div>
                          </div>
                          <input type="checkbox" className="toggle toggle-success" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-base-300/30 rounded-lg hover:shadow-sm transition-all duration-300">
                          <div className="flex gap-3 items-center">
                            <Phone size={18} className="text-emerald-400" />
                            <div>
                              <p className="font-medium">SMS Notifications</p>
                              <p className="text-sm opacity-75">Receive text messages for urgent updates</p>
                            </div>
                          </div>
                          <input type="checkbox" className="toggle toggle-success" defaultChecked />
                        </div>
                        <div className="flex items-center justify-between p-3 bg-base-300/30 rounded-lg hover:shadow-sm transition-all duration-300">
                          <div className="flex gap-3 items-center">
                            <MessageSquare size={18} className="text-emerald-400" />
                            <div>
                              <p className="font-medium">Push Notifications</p>
                              <p className="text-sm opacity-75">Receive push notifications on your device</p>
                            </div>
                          </div>
                          <input type="checkbox" className="toggle toggle-success" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="modal modal-open">
          <div className="modal-box max-w-3xl bg-base-200/90 backdrop-blur-md">
            <h3 className="font-bold text-lg">Select Theme</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 py-4">
              {['light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate', 'synthwave', 
                'retro', 'cyberpunk', 'valentine', 'halloween', 'garden', 'forest', 'aqua', 
                'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury', 'dracula', 
                'cmyk', 'autumn', 'business', 'acid', 'lemonade', 'night', 'coffee', 'winter']
                .map(theme => (
                  <button
                    key={theme}
                    className={`btn btn-sm capitalize ${currentTheme === theme ? 'btn-success' : 'btn-outline'}`}
                    onClick={() => {
                      setCurrentTheme(theme);
                      setShowThemeModal(false);
                    }}
                    data-theme={theme}
                  >
                    {theme}
                  </button>
                ))}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowThemeModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button className="fixed right-6 bottom-6 btn btn-circle btn-success btn-lg shadow-xl hover:shadow-2xl hover:scale-110 transition-all duration-500 animate-bounce">
        <MessageSquare size={24} />
      </button>

      {/* Toast Notification */}
      <div id="save-toast" className="toast toast-end fixed bottom-6 right-6 transition-all duration-500 transform translate-y-20 opacity-0">
        <div className="alert alert-success shadow-lg animate-fadeIn">
          <Check size={20} />
          <span>Profile updated successfully!</span>
        </div>
      </div>
    </div>
  );
}