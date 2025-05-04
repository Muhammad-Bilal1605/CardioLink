import { useState } from "react";
import { Heart, Hospital, User, Stethoscope, Beaker, ImagePlus, Shield, PieChart, Pill, LineChart, Target, Check, Award, Clock } from "lucide-react";
import { Link } from "react-router-dom";

function LandingPage() {
  const [activeRole, setActiveRole] = useState(null);
  const [activeTab, setActiveTab] = useState("vision");

  const roles = {
    hospital: {
      title: "Hospital",
      icon: <Hospital className="h-6 w-6 mb-2 text-blue-600" />,
      subRoles: [
        {
          name: "Doctors",
          description: "Manage schedules, conduct virtual appointments, and access patient EHRs",
          icon: <Stethoscope className="h-5 w-5 text-blue-600" />
        },
        {
          name: "Radiologists",
          description: "Upload medical imaging and leverage AI diagnostic tools for ECG, ECHO, and heartbeat analysis",
          icon: <ImagePlus className="h-5 w-5 text-blue-600" />
        },
        {
          name: "Laboratory Personnel",
          description: "Upload and manage lab results in the integrated EHR system",
          icon: <Beaker className="h-5 w-5 text-blue-600" />
        },
        {
          name: "Hospital Admin",
          description: "Manage hospital staff, resources, and overall operations",
          icon: <Shield className="h-5 w-5 text-blue-600" />
        }
      ]
    },
    admin: {
      title: "System Admin",
      icon: <PieChart className="h-6 w-6 mb-2 text-blue-600" />,
      description: "Access comprehensive analytics, system configuration, and platform management"
    },
    pharmacist: {
      title: "Pharmacist",
      icon: <Pill className="h-6 w-6 mb-2 text-blue-600" />,
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
      role: "Chief of Cardiology, Metropolitan Medical Center"
    },
    {
      quote: "The AI diagnostic tools have been a game-changer for our radiology department. We're able to process and analyze cardiac imaging faster and with greater accuracy than ever before.",
      author: "Dr. Michael Chen",
      role: "Lead Radiologist, City General Hospital"
    },
    {
      quote: "As a pharmacist, having direct access to the cardiac care team through CardioLink has improved our ability to provide timely medication management for cardiac patients.",
      author: "James Wilson",
      role: "Clinical Pharmacist, Healthcare Partners"
    }
  ];

  const stats = [
    { number: "93%", label: "User Satisfaction", icon: <Check className="h-6 w-6 text-blue-600" /> },
    { number: "40%", label: "Reduced Admin Time", icon: <Clock className="h-6 w-6 text-blue-600" /> },
    { number: "25+", label: "Hospital Partners", icon: <Hospital className="h-6 w-6 text-blue-600" /> },
    { number: "15k+", label: "Patients Served", icon: <User className="h-6 w-6 text-blue-600" /> }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 py-6">
        <div className="container mx-auto px-4 pt-8 pb-16">
          <nav className="flex justify-between items-center mb-16">
            <div className="flex items-center space-x-2">
              <Heart className="text-red-500 h-8 w-8" />
              <span className="text-2xl font-bold text-blue-900">CardioLink</span>
            </div>
            <div className="flex space-x-4">
              <Link
                to="/login"
                className="bg-transparent border border-blue-600 text-blue-600 px-4 py-2 rounded-lg hover:bg-blue-600 hover:text-white transition duration-300"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Sign Up
              </Link>
            </div>
          </nav>

          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="md:w-1/2">
              <h1 className="text-5xl font-bold mb-6 text-blue-900">
                Revolutionizing <span className="text-red-500">Cardiac Care</span> Coordination
              </h1>
              <p className="text-xl text-gray-700 mb-8">
                CardioLink connects hospitals, doctors, radiologists, lab personnel, and pharmacists 
                on a single platform for seamless cardiac care management and improved patient outcomes.
              </p>
              <div className="flex gap-4">
                <Link
                  to="/signup"
                  className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 transition duration-300 font-semibold text-lg"
                >
                  Get Started
                </Link>
                <Link
                  to="/login"
                  className="bg-transparent border border-blue-600 text-blue-600 px-6 py-3 rounded-lg hover:bg-blue-600 hover:text-white transition duration-300 font-semibold text-lg"
                >
                  Login
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-red-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-4 bg-blue-500 rounded-full opacity-20 animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Heart className="text-red-500 h-32 w-32" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vision, Mission & Values */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Who We Are</h2>
          
          <div className="flex mb-8 border-b border-gray-200">
            {Object.keys(visionContent).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-3 px-6 font-medium text-lg ${
                  activeTab === tab
                    ? "border-b-2 border-red-500 text-blue-900"
                    : "text-gray-600 hover:text-blue-900"
                }`}
              >
                {visionContent[tab].title}
              </button>
            ))}
          </div>
          
          <div className="mb-12">
            <div className="flex items-start gap-6">
              <div className="bg-blue-100 p-6 rounded-xl flex items-center justify-center">
                {activeTab === "vision" && <Target className="h-12 w-12 text-blue-600" />}
                {activeTab === "mission" && <LineChart className="h-12 w-12 text-blue-600" />}
                {activeTab === "values" && <Award className="h-12 w-12 text-blue-600" />}
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-900 mb-4">{visionContent[activeTab].title}</h3>
                <p className="text-lg text-gray-700 max-w-2xl">{visionContent[activeTab].content}</p>
              </div>
            </div>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <div key={index} className="bg-blue-50 p-6 rounded-xl text-center shadow-sm">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="text-3xl font-bold text-blue-900 mb-2">{stat.number}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Role Selection */}
      <div className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Select Your Role to Learn More</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {Object.keys(roles).map((role) => (
              <div 
                key={role}
                className={`p-6 rounded-xl cursor-pointer transition-all duration-300 shadow-sm flex flex-col items-center text-center ${
                  activeRole === role ? 'bg-blue-100 shadow-lg' : 'bg-white hover:bg-blue-50'
                }`}
                onClick={() => setActiveRole(activeRole === role ? null : role)}
              >
                {roles[role].icon}
                <h3 className="text-xl font-semibold mb-2 text-blue-900">{roles[role].title}</h3>
                {!roles[role].subRoles && <p className="text-gray-600">{roles[role].description}</p>}
                {activeRole !== role && roles[role].subRoles && (
                  <p className="text-gray-600">Click to view detailed roles and features</p>
                )}
              </div>
            ))}
          </div>
          
          {/* Role Details */}
          {activeRole && roles[activeRole].subRoles && (
            <div className="bg-white shadow-sm rounded-xl p-6">
              <h3 className="text-2xl font-semibold mb-6 text-center text-blue-900">{roles[activeRole].title} Roles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {roles[activeRole].subRoles.map((subRole, index) => (
                  <div key={index} className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center mb-3">
                      {subRole.icon}
                      <h4 className="text-lg font-semibold ml-2 text-blue-900">{subRole.name}</h4>
                    </div>
                    <p className="text-gray-600 text-sm">{subRole.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeRole && !roles[activeRole].subRoles && (
            <div className="bg-white shadow-sm rounded-xl p-6 text-center">
              <h3 className="text-2xl font-semibold mb-4 text-blue-900">{roles[activeRole].title}</h3>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">{roles[activeRole].description}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Features */}
      <div className="py-16 container mx-auto px-4 bg-white">
        <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white shadow-sm p-6 rounded-xl border border-gray-100">
            <div className="bg-red-500 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-blue-900">Integrated EHR System</h3>
            <p className="text-gray-600">Comprehensive electronic health records accessible to all authorized healthcare providers for coordinated patient care.</p>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-xl border border-gray-100">
            <div className="bg-red-500 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <ImagePlus className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-blue-900">AI Diagnostic Tools</h3>
            <p className="text-gray-600">Advanced AI-powered analysis for ECG, ECHO, and heartbeat data to assist in accurate and timely diagnosis.</p>
          </div>
          
          <div className="bg-white shadow-sm p-6 rounded-xl border border-gray-100">
            <div className="bg-red-500 rounded-full w-12 h-12 flex items-center justify-center mb-4">
              <User className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-blue-900">Telemedicine</h3>
            <p className="text-gray-600">Secure video consultations, messaging, and remote appointment management between patients and healthcare providers.</p>
          </div>
        </div>
      </div>
      
      {/* Testimonials */}
      <div className="bg-blue-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-blue-900 mb-12">What Our Users Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-blue-600 text-4xl mb-4">"</div>
                <p className="text-gray-700 mb-6 italic">{testimonial.quote}</p>
                <div>
                  <p className="font-semibold text-blue-900">{testimonial.author}</p>
                  <p className="text-gray-600 text-sm">{testimonial.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6 text-white">Ready to Transform Cardiac Healthcare?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-blue-100">Join CardioLink today and become part of the future of integrated cardiac care management.</p>
          <div className="flex gap-4 justify-center">
            <Link 
              to="/signup"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300 font-semibold text-lg"
            >
              Sign Up Now
            </Link>
            <Link 
              to="/login"
              className="bg-transparent border border-white text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 font-semibold text-lg"
            >
              Login
            </Link>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="bg-gray-100 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="text-red-500 h-6 w-6" />
              <span className="text-xl font-bold text-blue-900">CardioLink</span>
            </div>
            <div className="text-sm text-gray-600">
              © {new Date().getFullYear()} CardioLink. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;