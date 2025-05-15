import { useState, useEffect } from "react";
import { Heart, Hospital, User, Stethoscope, Beaker, ImagePlus, Shield, PieChart, Pill, LineChart, Target, Check, Award, Clock, ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";

function LandingPage() {
  const [activeRole, setActiveRole] = useState(null);
  const [activeTab, setActiveTab] = useState("vision");
  const [isVisible, setIsVisible] = useState({});
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Animation for scroll reveal
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.reveal-section');
      sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const sectionId = section.id;
        if (sectionTop < window.innerHeight * 0.8) {
          setIsVisible(prev => ({ ...prev, [sectionId]: true }));
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const roles = {
    hospital: {
      title: "Hospital",
      icon: <Hospital className="h-6 w-6 mb-2 text-emerald-500" />,
      subRoles: [
        {
          name: "Doctors",
          description: "Manage schedules, conduct virtual appointments, and access patient EHRs",
          icon: <Stethoscope className="h-5 w-5 text-emerald-500" />
        },
        {
          name: "Radiologists",
          description: "Upload medical imaging and leverage AI diagnostic tools for ECG, ECHO, and heartbeat analysis",
          icon: <ImagePlus className="h-5 w-5 text-emerald-500" />
        },
        {
          name: "Laboratory Personnel",
          description: "Upload and manage lab results in the integrated EHR system",
          icon: <Beaker className="h-5 w-5 text-emerald-500" />
        },
        {
          name: "Hospital Admin",
          description: "Manage hospital staff, resources, and overall operations",
          icon: <Shield className="h-5 w-5 text-emerald-500" />
        }
      ]
    },
    admin: {
      title: "System Admin",
      icon: <PieChart className="h-6 w-6 mb-2 text-emerald-500" />,
      description: "Access comprehensive analytics, system configuration, and platform management"
    },
    pharmacist: {
      title: "Pharmacist",
      icon: <Pill className="h-6 w-6 mb-2 text-emerald-500" />,
      description: "Upload products, manage inventory, and process prescription orders"
    }
  };

  const visionContent = {
    vision: {
      title: "Our Vision",
      content: "At CardioLink, we envision a future where cardiac care is seamlessly integrated across all healthcare touchpoints. We're committed to reducing the global burden of cardiovascular disease through technology that connects providers, optimizes workflows, and improves patient outcomes."
    },
    mission: {
      title: "Our Mission",
      content: "Our mission is to revolutionize cardiac healthcare by providing an integrated platform that connects all stakeholders in the cardiac care ecosystem. We aim to improve patient outcomes, reduce healthcare costs, and enhance the quality of care through innovative technology solutions."
    },
    values: {
      title: "Our Values",
      content: "Patient-Centric Care, Innovation, Collaboration, Excellence, and Integrity guide everything we do at CardioLink. We believe that by putting patients first and fostering collaboration among healthcare providers, we can transform cardiac care for the better."
    }
  };

  const testimonials = [
    {
      quote: "CardioLink has transformed our hospital's cardiac care coordination. The integrated platform has improved our efficiency by 40% and patient satisfaction scores have increased significantly.",
      author: "Dr. Sarah Johnson",
      role: "Chief of Cardiology, Metropolitan Medical Center",
      avatar: "https://randomuser.me/api/portraits/women/65.jpg"
    },
    {
      quote: "The AI diagnostic tools have been a game-changer for our radiology department. We're able to process and analyze cardiac imaging faster and with greater accuracy than ever before.",
      author: "Dr. Michael Chen",
      role: "Lead Radiologist, City General Hospital",
      avatar: "https://randomuser.me/api/portraits/men/32.jpg"
    },
    {
      quote: "As a pharmacist, having direct access to the cardiac care team through CardioLink has improved our ability to provide timely medication management for cardiac patients.",
      author: "James Wilson",
      role: "Clinical Pharmacist, Healthcare Partners",
      avatar: "https://randomuser.me/api/portraits/men/75.jpg"
    }
  ];

  const stats = [
    { number: "93%", label: "User Satisfaction", icon: <Check className="h-6 w-6 text-emerald-500" /> },
    { number: "40%", label: "Reduced Admin Time", icon: <Clock className="h-6 w-6 text-emerald-500" /> },
    { number: "25+", label: "Hospital Partners", icon: <Hospital className="h-6 w-6 text-emerald-500" /> },
    { number: "15k+", label: "Patients Served", icon: <User className="h-6 w-6 text-emerald-500" /> }
  ];

  const features = [
    {
      icon: <Stethoscope className="h-6 w-6 text-white" />,
      title: "Integrated EHR System",
      description: "Comprehensive electronic health records accessible to all authorized healthcare providers for coordinated patient care.",
      bgColor: "bg-gradient-to-br from-emerald-500 to-teal-600"
    },
    {
      icon: <ImagePlus className="h-6 w-6 text-white" />,
      title: "AI Diagnostic Tools",
      description: "Advanced AI-powered analysis for ECG, ECHO, and heartbeat data to assist in accurate and timely diagnosis.",
      bgColor: "bg-gradient-to-br from-blue-500 to-indigo-600"
    },
    {
      icon: <User className="h-6 w-6 text-white" />,
      title: "Telemedicine",
      description: "Secure video consultations, messaging, and remote appointment management between patients and healthcare providers.",
      bgColor: "bg-gradient-to-br from-purple-500 to-fuchsia-600"
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans overflow-x-hidden">
      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl">
            <button 
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute -top-10 right-0 text-white hover:text-emerald-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="aspect-w-16 aspect-h-9 bg-black">
              <iframe 
                className="w-full h-96 md:h-[32rem]"
                src="https://www.youtube.com/embed/7e90gBu4pas?autoplay=1" 
                title="CardioLink Platform Demo"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

      {/* Header & Hero Section */}
      <div className="bg-gradient-to-br from-green-900 to-emerald-800 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-emerald-400 filter blur-3xl opacity-30 animate-float1"></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-teal-400 filter blur-3xl opacity-20 animate-float2"></div>
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-green-400 filter blur-3xl opacity-20 animate-float3"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Navigation */}
          <nav className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-2">
              <Heart className="text-red-400 h-8 w-8 animate-pulse" />
              <span className="text-2xl font-bold text-white">CardioLink</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="bg-transparent border border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-green-800 transition-all duration-300 flex items-center"
              >
                Login <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                to="/signup"
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center"
              >
                Sign Up <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="flex flex-col md:flex-row items-center justify-between py-16 md:py-24 gap-12">
            <div className="md:w-1/2 animate-fadeIn">
              <div className="inline-block bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <span className="text-emerald-200 font-medium">Innovating Cardiac Care Since 2022</span>
              </div>
              <h1 className="text-5xl font-bold mb-6 text-white leading-tight">
                Revolutionizing <span className="text-red-400">Cardiac Care</span> Through Digital Transformation
              </h1>
              <p className="text-xl text-gray-100 mb-8 opacity-90">
                CardioLink connects hospitals, doctors, radiologists, lab personnel, and pharmacists 
                on a single platform for seamless cardiac care management and improved patient outcomes.
              </p>
              <div className="flex gap-4 flex-wrap">
                <Link
                  to="/signup"
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
                >
                  Get Started <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button
                  onClick={() => setIsVideoModalOpen(true)}
                  className="bg-transparent border border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-green-800 transition-all duration-300 font-semibold text-lg flex items-center"
                >
                  <Play className="mr-2 h-5 w-5" /> Watch Demo
                </button>
              </div>
              
              {/* Trust indicators */}
              <div className="mt-12 flex flex-wrap items-center gap-6">
                <div className="flex items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <img 
                        key={i}
                        src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i*10}.jpg`}
                        className="w-10 h-10 rounded-full border-2 border-white"
                        alt="User"
                      />
                    ))}
                  </div>
                  <span className="ml-3 text-white font-medium">Trusted by 500+ professionals</span>
                </div>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center animate-floatUp">
              <div className="relative w-full max-w-md">
                {/* Floating card mockups */}
                <div className="absolute -top-8 -left-8 w-64 h-80 bg-white rounded-xl shadow-2xl transform rotate-6 overflow-hidden border border-gray-200">
                  <div className="h-8 bg-gray-100 flex items-center px-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="h-48 bg-gradient-to-br from-emerald-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center">
                      <Heart className="h-16 w-16 text-emerald-500 animate-pulse" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded-full mb-2 w-1/2"></div>
                  </div>
                </div>
                
                <div className="absolute -bottom-8 -right-8 w-64 h-80 bg-white rounded-xl shadow-2xl transform -rotate-6 overflow-hidden border border-gray-200 z-10">
                  <div className="h-8 bg-gray-100 flex items-center px-3">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                      <Stethoscope className="h-16 w-16 text-blue-500" />
                    </div>
                    <div className="h-3 bg-gray-200 rounded-full mb-2 w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded-full mb-2 w-1/2"></div>
                  </div>
                </div>
                
                {/* Center heart animation */}
                <div className="relative z-20 w-64 h-64 mx-auto">
                  <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-4 bg-emerald-500 rounded-full opacity-20 animate-pulse"></div>
                  <div className="absolute inset-8 bg-green-900 rounded-full opacity-10 animate-pulse"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Heart className="text-red-400 h-32 w-32 animate-heartbeat" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Wave SVG Divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </div>

      {/* Clients Section */}
      <div className="py-12 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-70">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="grayscale hover:grayscale-0 transition-all duration-300">
                <img 
                  src={`https://via.placeholder.com/150x60?text=Hospital+${i}`} 
                  alt="Hospital Partner"
                  className="h-12 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Vision, Mission & Values */}
      <div className="py-20 bg-white reveal-section" id="vision-section">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-100 rounded-full mb-4">
              Our Philosophy
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Guiding Principles for Cardiac Care</h2>
            <p className="text-xl text-gray-600">
              At CardioLink, we're driven by a commitment to transform cardiac healthcare through innovation and collaboration.
            </p>
          </div>
          
          <div className="flex mb-8 border-b border-gray-200 justify-center">
            {Object.keys(visionContent).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 font-medium text-lg relative ${
                  activeTab === tab
                    ? "text-green-800"
                    : "text-gray-600 hover:text-green-800"
                }`}
              >
                {visionContent[tab].title}
                {activeTab === tab && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-red-400 rounded-full"></span>
                )}
              </button>
            ))}
          </div>
          
          <div className={`mb-12 transition-all duration-500 ${isVisible['vision-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <div className="flex flex-col md:flex-row items-center gap-12 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-2xl p-8 shadow-inner">
              <div className="md:w-1/3 flex justify-center">
                <div className="relative w-64 h-64">
                  {activeTab === "vision" && (
                    <>
                      <div className="absolute inset-0 bg-white rounded-xl shadow-lg flex items-center justify-center p-6">
                        <Target className="h-20 w-20 text-emerald-500" />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-emerald-100 rounded-xl shadow-lg"></div>
                    </>
                  )}
                  {activeTab === "mission" && (
                    <>
                      <div className="absolute inset-0 bg-white rounded-xl shadow-lg flex items-center justify-center p-6">
                        <LineChart className="h-20 w-20 text-blue-500" />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-blue-100 rounded-xl shadow-lg"></div>
                    </>
                  )}
                  {activeTab === "values" && (
                    <>
                      <div className="absolute inset-0 bg-white rounded-xl shadow-lg flex items-center justify-center p-6">
                        <Award className="h-20 w-20 text-purple-500" />
                      </div>
                      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-purple-100 rounded-xl shadow-lg"></div>
                    </>
                  )}
                </div>
              </div>
              <div className="md:w-2/3">
                <h3 className="text-3xl font-bold text-gray-900 mb-4">{visionContent[activeTab].title}</h3>
                <p className="text-lg text-gray-700 leading-relaxed">{visionContent[activeTab].content}</p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 mt-20">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center border border-gray-100 ${isVisible['vision-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${index * 150}ms`}}
              >
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 w-20 h-20 rounded-full flex justify-center items-center mx-auto mb-6 shadow-md">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold text-gray-900 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Role Selection */}
      <div className="py-20 bg-gray-50 reveal-section" id="roles-section">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-100 rounded-full mb-4">
              For Healthcare Professionals
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Designed for Your Role</h2>
            <p className="text-xl text-gray-600">
              CardioLink offers specialized tools and workflows tailored to each healthcare professional's needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {Object.keys(roles).map((role, index) => (
              <div 
                key={role}
                className={`p-8 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-2 ${
                  activeRole === role ? 'bg-gradient-to-br from-emerald-100 to-teal-100 border-l-4 border-emerald-500' : 'bg-white'
                } ${isVisible['roles-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${index * 150}ms`}}
                onClick={() => setActiveRole(activeRole === role ? null : role)}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="bg-white w-20 h-20 rounded-full flex justify-center items-center mb-6 shadow-md border border-gray-100">
                    {roles[role].icon}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-gray-900">{roles[role].title}</h3>
                  {!roles[role].subRoles && <p className="text-gray-600">{roles[role].description}</p>}
                  {activeRole !== role && roles[role].subRoles && (
                    <p className="text-gray-600">Click to view detailed roles and features</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          {/* Role Details */}
          {activeRole && roles[activeRole].subRoles && (
            <div className="bg-white shadow-xl rounded-2xl p-8 transition-all duration-500 transform border border-gray-100">
              <h3 className="text-3xl font-bold mb-8 text-center text-gray-900">{roles[activeRole].title} Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roles[activeRole].subRoles.map((subRole, index) => (
                  <div 
                    key={index} 
                    className="bg-gradient-to-b from-white to-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <div className="flex items-center mb-4">
                      <div className="bg-emerald-100 w-12 h-12 rounded-full flex justify-center items-center mr-4">
                        {subRole.icon}
                      </div>
                      <h4 className="text-xl font-bold text-gray-900">{subRole.name}</h4>
                    </div>
                    <p className="text-gray-600">{subRole.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeRole && !roles[activeRole].subRoles && (
            <div className="bg-white shadow-xl rounded-2xl p-12 text-center transition-all duration-500 transform border border-gray-100">
              <h3 className="text-3xl font-bold mb-6 text-gray-900">{roles[activeRole].title}</h3>
              <p className="text-gray-600 text-xl max-w-2xl mx-auto">{roles[activeRole].description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Features */}
      <div className="py-20 container mx-auto px-4 bg-white reveal-section" id="features-section">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-100 rounded-full mb-4">
            Platform Features
          </span>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Tools for Cardiac Care</h2>
          <p className="text-xl text-gray-600">
            Discover how CardioLink's comprehensive feature set can transform your cardiac care delivery.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className={`rounded-2xl overflow-hidden transition-all duration-500 transform hover:-translate-y-2 ${isVisible['features-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{transitionDelay: `${index * 150}ms`}}
            >
              <div className={`h-48 ${feature.bgColor} flex items-center justify-center`}>
                <div className="bg-white/20 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center shadow-lg">
                  {feature.icon}
                </div>
              </div>
              <div className="bg-white p-8 shadow-lg border border-gray-100">
                <h3 className="text-xl font-bold mb-4 text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 mb-6">{feature.description}</p>
                <button className="text-emerald-600 font-semibold flex items-center hover:text-emerald-800 transition-colors">
                  Learn more <ArrowRight className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Feature showcase */}
        <div className="mt-20 bg-gradient-to-r from-emerald-50 to-blue-50 rounded-3xl p-8 md:p-12 shadow-inner">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="md:w-1/2">
              <h3 className="text-3xl font-bold text-gray-900 mb-6">Advanced AI Diagnostics</h3>
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Our cutting-edge AI algorithms analyze cardiac imaging with 98% accuracy, providing real-time insights to support clinical decision-making.
              </p>
              <ul className="space-y-4 mb-8">
                {['ECG Analysis', 'ECHO Interpretation', 'Heartbeat Pattern Detection', 'Risk Prediction Models'].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <Check className="h-5 w-5 text-emerald-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <button className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-all duration-300 font-semibold shadow-md hover:shadow-lg">
                Explore AI Features
              </button>
            </div>
            <div className="md:w-1/2">
              <div className="relative">
                <div className="bg-white p-4 rounded-xl shadow-xl border border-gray-200">
                  <img 
                    src="https://via.placeholder.com/600x400?text=AI+Diagnostics+Dashboard" 
                    alt="AI Diagnostics Dashboard"
                    className="rounded-lg"
                  />
                </div>
                <div className="absolute -bottom-6 -right-6 bg-white p-2 rounded-lg shadow-lg border border-gray-200 w-32 h-32">
                  <img 
                    src="https://via.placeholder.com/200x200?text=ECG+Analysis" 
                    alt="ECG Analysis"
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="py-20 bg-gray-50 reveal-section" id="testimonials-section">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 text-sm font-semibold text-emerald-600 bg-emerald-100 rounded-full mb-4">
              Testimonials
            </span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trusted by Healthcare Professionals</h2>
            <p className="text-xl text-gray-600">
              Hear from medical experts who have transformed their practice with CardioLink.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className={`bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${isVisible['testimonials-section'] ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{transitionDelay: `${index * 150}ms`}}
              >
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <img 
                      src={testimonial.avatar} 
                      alt={testimonial.author}
                      className="w-16 h-16 rounded-full object-cover border-4 border-white shadow-md"
                    />
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 w-8 h-8 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 mb-6 text-center italic relative">
                  <span className="absolute -top-4 left-0 text-3xl text-gray-300">"</span>
                  {testimonial.quote}
                  <span className="absolute -bottom-4 right-0 text-3xl text-gray-300">"</span>
                </p>
                <div className="text-center border-t pt-6 border-gray-100">
                  <p className="font-bold text-gray-900">{testimonial.author}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-900 to-emerald-800 py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-emerald-400 filter blur-3xl opacity-30 animate-float1"></div>
          <div className="absolute top-1/3 right-1/4 w-40 h-40 rounded-full bg-teal-400 filter blur-3xl opacity-20 animate-float2"></div>
          <div className="absolute bottom-1/4 left-1/3 w-48 h-48 rounded-full bg-green-400 filter blur-3xl opacity-20 animate-float3"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Transform Cardiac Healthcare?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-gray-100 opacity-90">
            Join CardioLink today and become part of the future of integrated cardiac care management.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link 
              to="/signup"
              className="bg-white text-emerald-700 px-8 py-4 rounded-xl hover:bg-gray-100 transition-all duration-300 font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center"
            >
              Sign Up Now <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/login"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-emerald-700 transition-all duration-300 font-semibold text-lg"
            >
              Schedule a Demo
            </Link>
          </div>
        </div>
        
        {/* Wave SVG Divider */}
        <div className="absolute bottom-0 left-0 right-0 transform rotate-180">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" className="w-full h-auto">
            <path 
              fill="#f9fafb" 
              fillOpacity="1" 
              d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"
            ></path>
          </svg>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <Heart className="text-red-400 h-8 w-8" />
                <span className="text-2xl font-bold">CardioLink</span>
              </div>
              <p className="text-gray-400 mb-6">
                Revolutionizing cardiac care through innovative technology solutions.
              </p>
              <div className="flex space-x-4">
                {['Twitter', 'Facebook', 'LinkedIn', 'Instagram'].map((social) => (
                  <a key={social} href="#" className="text-gray-400 hover:text-white transition-colors">
                    <span className="sr-only">{social}</span>
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Product</h3>
              <ul className="space-y-3">
                {['Features', 'Pricing', 'Case Studies', 'Updates'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Company</h3>
              <ul className="space-y-3">
                {['About Us', 'Careers', 'News', 'Contact'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-6">Resources</h3>
              <ul className="space-y-3">
                {['Blog', 'Help Center', 'Tutorials', 'API Docs'].map((item) => (
                  <li key={item}>
                    <a href="#" className="text-gray-400 hover:text-white transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-400 mb-4 md:mb-0">
              © {new Date().getFullYear()} CardioLink. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>
      
      {/* CSS Animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes floatUp {
          0% { transform: translateY(20px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes heartbeat {
          0% { transform: scale(1); }
          14% { transform: scale(1.15); }
          28% { transform: scale(1); }
          42% { transform: scale(1.15); }
          70% { transform: scale(1); }
        }
        
        @keyframes float1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes float2 {
          0%, 100% { transform: translateY(-10px); }
          50% { transform: translateY(10px); }
        }
        
        @keyframes float3 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(15px); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        
        .animate-floatUp {
          animation: floatUp 1s ease-out forwards;
        }
        
        .animate-heartbeat {
          animation: heartbeat 2s infinite;
        }
        
        .animate-float1 {
          animation: float1 6s ease-in-out infinite;
        }
        
        .animate-float2 {
          animation: float2 8s ease-in-out infinite;
        }
        
        .animate-float3 {
          animation: float3 7s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

export default LandingPage;