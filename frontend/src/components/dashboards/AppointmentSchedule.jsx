import React, { useState, useEffect } from 'react';
import { 
  Calendar, Clock, MapPin, ChevronLeft, ChevronRight, 
  CheckCircle, X, MoreVertical, FileText, User, 
  AlertCircle, RefreshCw, MessageSquare, Trash2,
  PlusCircle, BarChart3, Users, Activity, FolderClosed, 
  ChevronDown, Archive, Bell, Clipboard, Edit3
} from 'lucide-react';
import { useNavigate } from "react-router-dom";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, 
  Line 
} from 'recharts';
import DashboardLayout from "../DashboardLayout";
import { useAuthStore } from "../../store/authStore";

export default function AppointmentDashboard() {
  const [activeTab, setActiveTab] = useState('today');
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecordRequestOpen, setIsRecordRequestOpen] = useState(false);
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Animation states
  const [animateCard, setAnimateCard] = useState(false);
  
  // Sample appointments data
  const [appointments, setAppointments] = useState([
    {
      id: 1,
      patientName: "Aisha Khan",
      patientId: "PT-7843",
      age: 45,
      time: "09:00",
      date: new Date(),
      type: "Consultation",
      status: "confirmed",
      notes: "Patient has reported chest pain and shortness of breath",
      img: null,
      vitals: {
        bp: "130/85",
        heartRate: 78,
        temperature: 98.6
      },
      history: [
        { date: "2023-12-15", type: "Check-up", doctor: "Dr. Sarah Amjad" },
        { date: "2024-01-20", type: "ECG Test", doctor: "Dr. Ahmed" }
      ]
    },
    {
      id: 2,
      patientName: "Mohsin Ali",
      patientId: "PT-6254",
      age: 58,
      time: "10:30",
      date: new Date(),
      type: "Follow-up",
      status: "confirmed",
      notes: "Review of recent echocardiogram results",
      img: null,
      vitals: {
        bp: "140/90",
        heartRate: 82,
        temperature: 98.4
      },
      history: [
        { date: "2024-02-05", type: "Angiogram", doctor: "Dr. Naz" },
        { date: "2024-03-10", type: "Follow-up", doctor: "Dr. Sarah Amjad" }
      ]
    },
    {
      id: 3,
      patientName: "Fatima Zaidi",
      patientId: "PT-9145",
      age: 62,
      time: "14:00",
      date: new Date(),
      type: "Examination",
      status: "in-progress",
      notes: "Patient experiencing palpitations and dizziness",
      img: null,
      vitals: {
        bp: "125/80",
        heartRate: 92,
        temperature: 99.1
      },
      history: [
        { date: "2024-01-12", type: "Emergency", doctor: "Dr. Ahmed" }
      ]
    },
    {
      id: 4,
      patientName: "Hamza Sheikh",
      patientId: "PT-4723",
      age: 51,
      time: "16:30",
      date: new Date(),
      type: "Consultation",
      status: "waiting",
      notes: "New patient with family history of heart disease",
      img: null,
      vitals: {
        bp: "135/88",
        heartRate: 76,
        temperature: 98.2
      },
      history: []
    }
  ]);

  // Sample past deceased patients with records
  const deceasedPatients = [
    { id: "PT-2341", name: "Imran Malik", deceased: "2024-02-10", diagnosis: "Cardiac arrest", age: 67 },
    { id: "PT-1587", name: "Sadia Khattak", deceased: "2024-01-25", diagnosis: "Heart failure", age: 72 },
    { id: "PT-3962", name: "Khalid Ahmed", deceased: "2023-11-18", diagnosis: "Myocardial infarction", age: 59 }
  ];

  // Generate analytics data
  const appointmentTypeData = [
    { name: 'Consultation', value: 35 },
    { name: 'Follow-up', value: 25 },
    { name: 'Examination', value: 20 },
    { name: 'Emergency', value: 15 },
    { name: 'Procedure', value: 5 }
  ];

  const weeklyAppointmentsData = [
    { day: 'Mon', appointments: 12 },
    { day: 'Tue', appointments: 19 },
    { day: 'Wed', appointments: 15 },
    { day: 'Thu', appointments: 22 },
    { day: 'Fri', appointments: 18 },
    { day: 'Sat', appointments: 10 },
    { day: 'Sun', appointments: 8 }
  ];

  const patientAgeData = [
    { age: '0-20', count: 5 },
    { age: '21-40', count: 25 },
    { age: '41-60', count: 35 },
    { age: '61-80', count: 22 },
    { age: '80+', count: 8 }
  ];

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  // Filter appointments based on status and search query
  const filteredAppointments = appointments.filter(appointment => {
    const matchesStatus = filterStatus === 'all' || appointment.status === filterStatus;
    const matchesSearch = appointment.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         appointment.patientId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Handle appointment selection
  const handleAppointmentSelect = (appointment) => {
    setSelectedAppointment(appointment);
    setAnimateCard(true);
    setIsDrawerOpen(true);
    
    // Reset animation after a delay
    setTimeout(() => {
      setAnimateCard(false);
    }, 500);
  };

  // Cancel appointment
  const cancelAppointment = (id) => {
    setAppointments(prevAppointments => 
      prevAppointments.map(app => 
        app.id === id ? {...app, status: 'cancelled'} : app
      )
    );
    setNotificationMessage('Appointment cancelled successfully');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    
    if (selectedAppointment?.id === id) {
      setIsDrawerOpen(false);
    }
  };

  // Complete appointment
  const completeAppointment = (id) => {
    setAppointments(prevAppointments => 
      prevAppointments.map(app => 
        app.id === id ? {...app, status: 'completed'} : app
      )
    );
    setNotificationMessage('Appointment marked as completed');
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  // Add note to appointment
  const addNoteToAppointment = () => {
    if (selectedAppointment && note.trim()) {
      setAppointments(prevAppointments => 
        prevAppointments.map(app => 
          app.id === selectedAppointment.id ? {...app, notes: app.notes + "\n" + note} : app
        )
      );
      setNote('');
      setIsNoteOpen(false);
      setNotificationMessage('Note added successfully');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    }
  };

  // Request medical records
  const requestMedicalRecords = (patientId) => {
    setNotificationMessage(`Medical records requested for patient ${patientId}`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setIsRecordRequestOpen(false);
  };

  // Request deceased patient records
  const requestDeceasedRecords = (patientId) => {
    setNotificationMessage(`Deceased patient records requested for ${patientId}`);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
    setIsRecordRequestOpen(false);
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  useEffect(() => {
    // Set up a selected appointment if none is selected yet and appointments exist
    if (!selectedAppointment && appointments.length > 0) {
      setSelectedAppointment(appointments[0]);
    }
  }, [appointments]);

  const content = (
    <div className="w-full mx-auto pb-16">
      {/* Notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 flex items-center animate-bounce">
          <CheckCircle size={18} className="mr-2" />
          {notificationMessage}
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Left Column - Appointments List */}
        <div className="w-full md:w-2/3 lg:w-3/5">
          {/* Header */}
          <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-800">Appointments</h1>
            
            <div className="flex items-center">
              <button className="p-2 rounded-full bg-blue-50 text-blue-600 mr-2">
                <Bell size={20} />
              </button>
              <button 
                className="p-2 rounded-full bg-blue-50 text-blue-600"
                onClick={() => navigate("/doctor-dashboard")}
              >
                <ChevronLeft size={20} />
              </button>
            </div>
          </div>
          
          {/* Tabs and Filters */}
          <div className="flex flex-col md:flex-row md:items-center justify-between py-4">
            <div className="flex space-x-2 mb-4 md:mb-0">
              <button 
                onClick={() => setActiveTab('today')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'today' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Today
              </button>
              <button 
                onClick={() => setActiveTab('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'upcoming' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Upcoming
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-lg font-medium ${
                  activeTab === 'analytics' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                Analytics
              </button>
            </div>
            
            <div className="flex">
              <div className="relative mr-2">
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-3 pr-8 py-2 rounded-lg border border-gray-300 w-full"
                />
              </div>
              
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white"
              >
                <option value="all">All</option>
                <option value="waiting">Waiting</option>
                <option value="confirmed">Confirmed</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          
          {/* Today's Appointments */}
          {activeTab === 'today' && (
            <div className="space-y-3 mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's Schedule</h2>
                <p className="text-gray-500">{formatDate(new Date())}</p>
              </div>
              
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-xl">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Calendar size={24} className="text-gray-400" />
                  </div>
                  <h3 className="font-medium text-gray-700">No appointments found</h3>
                  <p className="text-gray-500 mt-1">Try adjusting your search or filters</p>
                </div>
              ) : (
                filteredAppointments.map(appointment => (
                  <div 
                    key={appointment.id}
                    onClick={() => handleAppointmentSelect(appointment)}
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedAppointment?.id === appointment.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-blue-100 mr-3 flex items-center justify-center text-blue-600 font-medium">
                          {appointment.patientName.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="flex items-center">
                            <h3 className="font-semibold">{appointment.patientName}</h3>
                            <span className="mx-2 text-xs text-gray-400">•</span>
                            <span className="text-sm text-gray-500">{appointment.patientId}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-2">{appointment.time}</span>
                            <span className="capitalize">{appointment.type}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center">
                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                          appointment.status === 'waiting' ? 'bg-yellow-100 text-yellow-600' :
                          appointment.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                          appointment.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                          'bg-red-100 text-red-600'
                        }`}>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </span>
                        <button className="p-1 ml-2 text-gray-400 hover:text-gray-600">
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
              
              <button 
                className="w-full py-3 mt-4 rounded-xl font-medium border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                onClick={() => navigate("/doctor-schedule")}
              >
                <PlusCircle size={18} className="mr-2" />
                Schedule New Appointment
              </button>
            </div>
          )}
          
          {/* Upcoming Appointments */}
          {activeTab === 'upcoming' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Upcoming Schedule</h2>
                <div className="flex items-center space-x-2">
                  <button className="p-1 rounded-full bg-gray-100">
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-gray-700">May 2025</span>
                  <button className="p-1 rounded-full bg-gray-100">
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
              
              {/* Mini Calendar */}
              <div className="grid grid-cols-7 gap-1 mb-6">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                  <div key={i} className="text-center text-sm font-medium text-gray-500 py-2">
                    {day}
                  </div>
                ))}
                {Array(35).fill(null).map((_, i) => {
                  const day = i - 3; // Start from previous month
                  return (
                    <button 
                      key={i} 
                      className={`h-10 rounded-lg flex items-center justify-center text-sm
                        ${day === 0 ? 'bg-blue-600 text-white' : 
                          day > 0 && day < 31 ? 'hover:bg-gray-100' : 'text-gray-300'}`}
                      disabled={day <= 0 || day > 31}
                    >
                      {day > 0 && day < 32 ? day : ''}
                    </button>
                  );
                })}
              </div>
              
              {/* Upcoming Appointments List */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-500">Upcoming Appointments</h3>
                
                <div className="p-4 rounded-xl bg-white border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-purple-100 mr-3 flex items-center justify-center text-purple-600 font-medium">
                        NK
                      </div>
                      <div>
                        <h3 className="font-semibold">Nasir Khan</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>PT-4587</span>
                          <span className="mx-2 text-xs">•</span>
                          <span>Follow-up</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-600">
                      Confirmed
                    </span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Calendar size={14} className="mr-2 text-gray-500" />
                      <span>7 May, 2025</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <Clock size={14} className="mr-2 text-gray-500" />
                      <span>09:30 AM</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit3 size={14} />
                      </button>
                      <button className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl bg-white border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 mr-3 flex items-center justify-center text-blue-600 font-medium">
                        SQ
                      </div>
                      <div>
                        <h3 className="font-semibold">Saima Qureshi</h3>
                        <div className="flex items-center text-sm text-gray-500">
                          <span>PT-7823</span>
                          <span className="mx-2 text-xs">•</span>
                          <span>Examination</span>
                        </div>
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-600">
                      Confirmed
                    </span>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-center text-sm">
                      <Calendar size={14} className="mr-2 text-gray-500" />
                      <span>8 May, 2025</span>
                      <span className="mx-2 text-gray-300">|</span>
                      <Clock size={14} className="mr-2 text-gray-500" />
                      <span>11:00 AM</span>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <Edit3 size={14} />
                      </button>
                      <button className="p-1 text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Analytics View */}
          {activeTab === 'analytics' && (
            <div className="mt-4">
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">Appointment Analytics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Weekly Appointments</h3>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={weeklyAppointmentsData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip />
                        <Bar dataKey="appointments" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="bg-white p-4 rounded-xl border border-gray-100">
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Appointment Types</h3>
                    <div className="flex items-center justify-center h-180">
                      <ResponsiveContainer width="100%" height={180}>
                        <PieChart>
                          <Pie
                            data={appointmentTypeData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={70}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {appointmentTypeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-100 mb-6">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Patient Age Distribution</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={patientAgeData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="age" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip />
                      <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="bg-white p-4 rounded-xl border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Quick Stats</h3>
                    <button className="text-blue-600 text-sm font-medium">View Report</button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center">
                          <Users size={16} className="text-blue-600" />
                        </div>
                        <span className="text-xs text-blue-600 font-medium">+12%</span>
                      </div>
                      <h4 className="text-xl font-bold">358</h4>
                      <p className="text-xs text-gray-500">Total Patients</p>
                    </div>
                    
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-lg bg-green-100 flex items-center justify-center">
                          <Calendar size={16} className="text-green-600" />
                        </div>
                        <span className="text-xs text-green-600 font-medium">+5%</span>
                      </div>
                      <h4 className="text-xl font-bold">42</h4>
                      <p className="text-xs text-gray-500">Appointments This Week</p>
                    </div>
                    
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Activity size={16} className="text-purple-600" />
                        </div>
                        <span className="text-xs text-purple-600 font-medium">+8%</span>
                      </div>
                      <h4 className="text-xl font-bold">87%</h4>
                      <p className="text-xs text-gray-500">Treatment Success Rate</p>
                    </div>
                    
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="h-8 w-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                          <RefreshCw size={16} className="text-yellow-600" />
                        </div>
                        <span className="text-xs text-yellow-600 font-medium">-3%</span>
                      </div>
                      <h4 className="text-xl font-bold">14%</h4>
                      <p className="text-xs text-gray-500">Return Rate</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-xl border border-gray-100">
                <h3 className="text-sm font-medium text-gray-500 mb-4">Request Medical Records</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Access deceased patient medical records for research or case review purposes.
                </p>
                
                <div className="space-y-3">
                  {deceasedPatients.map(patient => (
                    <div key={patient.id} className="p-3 border border-gray-100 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center mb-1">
                          <Archive size={14} className="text-gray-400 mr-2" />
                          <h4 className="font-medium">{patient.name}</h4>
                        </div>
                        <p className="text-xs text-gray-500">
                          ID: {patient.id} | Age: {patient.age} | Deceased: {patient.deceased}
                        </p>
                        <p className="text-xs text-gray-500">
                          Diagnosis: {patient.diagnosis}
                        </p>
                      </div>
                      <button 
                        onClick={() => requestDeceasedRecords(patient.id)}
                        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs rounded-lg"
                      >
                        Request Records
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Column - Patient Details */}
        <div className={`w-full md:w-1/3 lg:w-2/5 transition-all duration-300 transform ${
          isDrawerOpen 
            ? 'translate-x-0 opacity-100' 
            : 'translate-x-full opacity-0 md:translate-x-0 md:opacity-100'
        }`}>
          {selectedAppointment ? (
            <div className={`bg-white rounded-xl border border-gray-200 h-full overflow-hidden transition-all duration-300 ${
              animateCard ? 'scale-105' : 'scale-100'
            }`}>
              {/* Patient Detail Header */}
              <div className="p-6 bg-blue-50 border-b border-gray-200">
                <div className="flex justify-between mb-4">
                  <h2 className="text-lg font-bold">Patient Details</h2>
                  <button 
                    onClick={() => setIsDrawerOpen(false)}
                    className="p-1 rounded-full hover:bg-gray-100 text-gray-500 md:hidden"
                  >
                    <X size={18} />
                  </button>
                </div>
                
                <div className="flex items-center">
                  <div className="h-16 w-16 rounded-full bg-blue-100 mr-4 flex items-center justify-center text-blue-600 font-semibold text-xl">
                    {selectedAppointment.patientName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">{selectedAppointment.patientName}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <span>{selectedAppointment.patientId}</span>
                      <span className="mx-2 text-xs">•</span>
                      <span>{selectedAppointment.age} years</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Blood Pressure</p>
                    <p className="font-semibold">{selectedAppointment.vitals.bp}</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Heart Rate</p>
                    <p className="font-semibold">{selectedAppointment.vitals.heartRate} bpm</p>
                  </div>
                  <div className="p-2 bg-white rounded-lg">
                    <p className="text-xs text-gray-500">Temperature</p>
                    <p className="font-semibold">{selectedAppointment.vitals.temperature}°F</p>
                  </div>
                </div>
              </div>
              
              {/* Appointment Details */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Appointment Information</h3>
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                    selectedAppointment.status === 'confirmed' ? 'bg-green-100 text-green-600' :
                    selectedAppointment.status === 'waiting' ? 'bg-yellow-100 text-yellow-600' :
                    selectedAppointment.status === 'in-progress' ? 'bg-blue-100 text-blue-600' :
                    selectedAppointment.status === 'completed' ? 'bg-gray-100 text-gray-600' :
                    'bg-red-100 text-red-600'
                  }`}>
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </span>
                </div>
                
                <div className="p-4 rounded-xl bg-gray-50 mb-6">
                  <div className="flex items-center mb-3">
                    <Calendar size={18} className="mr-3 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Date</p>
                      <p className="font-medium">{formatDate(selectedAppointment.date)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <Clock size={18} className="mr-3 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Time</p>
                      <p className="font-medium">{selectedAppointment.time}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin size={18} className="mr-3 text-gray-500" />
                    <div>
                      <p className="text-xs text-gray-500">Location</p>
                      <p className="font-medium">Cardiology Department, Floor 2</p>
                    </div>
                  </div>
                </div>
                
                {/* Patient Notes */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Notes</h3>
                    <button 
                      onClick={() => setIsNoteOpen(true)}
                      className="text-sm text-blue-600 font-medium"
                    >
                      Add Note
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-gray-50 min-h-24">
                    <p className="text-sm whitespace-pre-line">{selectedAppointment.notes}</p>
                  </div>
                </div>
                
                {/* Medical History */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">Medical History</h3>
                    <button 
                      onClick={() => setIsRecordRequestOpen(true)}
                      className="text-sm text-blue-600 font-medium"
                    >
                      Request Records
                    </button>
                  </div>
                  
                  {selectedAppointment.history.length > 0 ? (
                    <div className="space-y-2">
                      {selectedAppointment.history.map((record, index) => (
                        <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                          <div className="h-8 w-8 rounded-full bg-blue-100 mr-3 flex items-center justify-center text-blue-600">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{record.type}</p>
                            <div className="flex items-center text-xs text-gray-500">
                              <span>{record.date}</span>
                              <span className="mx-2 text-xs">•</span>
                              <span>{record.doctor}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">No medical history available</p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3">
                  {selectedAppointment.status !== 'cancelled' && selectedAppointment.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => cancelAppointment(selectedAppointment.id)}
                        className="py-3 rounded-xl font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center"
                      >
                        <X size={18} className="mr-2" />
                        Cancel Appointment
                      </button>
                      
                      <button
                        onClick={() => setIsRescheduleOpen(true)}
                        className="py-3 rounded-xl font-medium bg-yellow-50 text-yellow-600 hover:bg-yellow-100 transition-colors flex items-center justify-center"
                      >
                        <RefreshCw size={18} className="mr-2" />
                        Reschedule
                      </button>
                      
                      <button
                        onClick={() => completeAppointment(selectedAppointment.id)}
                        className="py-3 rounded-xl font-medium bg-green-50 text-green-600 hover:bg-green-100 transition-colors flex items-center justify-center col-span-2"
                      >
                        <CheckCircle size={18} className="mr-2" />
                        Complete Appointment
                      </button>
                    </>
                  )}
                  
                  {(selectedAppointment.status === 'cancelled' || selectedAppointment.status === 'completed') && (
                    <button
                      onClick={() => navigate("/doctor-schedule")}
                      className="py-3 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors flex items-center justify-center col-span-2"
                    >
                      <PlusCircle size={18} className="mr-2" />
                      Schedule New Appointment
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <User size={32} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Patient Selected</h3>
              <p className="text-gray-500 mb-6">Select an appointment to view patient details</p>
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                onClick={() => navigate("/doctor-schedule")}
              >
                Schedule New Appointment
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Add Note Modal */}
      {isNoteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Add Notes</h3>
              <button 
                onClick={() => setIsNoteOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 h-32"
              placeholder="Enter your notes here..."
            />
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsNoteOpen(false)}
                className="flex-1 py-2 rounded-lg font-medium border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={addNoteToAppointment}
                className="flex-1 py-2 rounded-lg font-medium bg-blue-600 text-white"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Medical Records Modal */}
      {isRecordRequestOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Request Medical Records</h3>
              <button 
                onClick={() => setIsRecordRequestOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">Select record types needed:</p>
              
              <div className="space-y-2">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="lab-results" 
                    className="mr-2"
                    defaultChecked
                  />
                  <label htmlFor="lab-results" className="text-sm">Laboratory Results</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="imaging" 
                    className="mr-2"
                    defaultChecked
                  />
                  <label htmlFor="imaging" className="text-sm">Imaging & Radiology</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="previous-visits" 
                    className="mr-2"
                    defaultChecked
                  />
                  <label htmlFor="previous-visits" className="text-sm">Previous Visit Notes</label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    id="prescriptions" 
                    className="mr-2"
                  />
                  <label htmlFor="prescriptions" className="text-sm">Medication History</label>
                </div>
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Purpose of Request</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>Treatment Planning</option>
                <option>Diagnosis Confirmation</option>
                <option>Research</option>
                <option>Patient Request</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsRecordRequestOpen(false)}
                className="flex-1 py-2 rounded-lg font-medium border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => requestMedicalRecords(selectedAppointment.patientId)}
                className="flex-1 py-2 rounded-lg font-medium bg-blue-600 text-white"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Reschedule Modal */}
      {isRescheduleOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md animate-fadeIn">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Reschedule Appointment</h3>
              <button 
                onClick={() => setIsRescheduleOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Select New Date</label>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {Array(6).fill(null).map((_, i) => {
                  const date = new Date();
                  date.setDate(date.getDate() + i + 1);
                  return (
                    <button 
                      key={i}
                      className={`p-2 rounded-lg text-center ${
                        selectedDate && selectedDate.toDateString() === date.toDateString()
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                      onClick={() => setSelectedDate(date)}
                    >
                      <p className="text-xs">{date.toLocaleDateString('en-US', { weekday: 'short' })}</p>
                      <p className="font-bold">{date.getDate()}</p>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Select New Time</label>
              <div className="grid grid-cols-3 gap-2">
                {["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"].map((time) => (
                  <button
                    key={time}
                    className={`py-2 rounded-lg text-center ${
                      selectedTime === time
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-2">Reason for Rescheduling</label>
              <select className="w-full p-2 border border-gray-300 rounded-lg">
                <option>Doctor Unavailable</option>
                <option>Patient Request</option>
                <option>Emergency Schedule Change</option>
                <option>Other</option>
              </select>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setIsRescheduleOpen(false)}
                className="flex-1 py-2 rounded-lg font-medium border border-gray-300 text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsRescheduleOpen(false);
                  setNotificationMessage('Appointment rescheduled successfully');
                  setShowNotification(true);
                  setTimeout(() => setShowNotification(false), 3000);
                }}
                className="flex-1 py-2 rounded-lg font-medium bg-blue-600 text-white"
              >
                Confirm Reschedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
  
  return (
    <DashboardLayout title="Appointment Dashboard" role="doctor">
      {content}
    </DashboardLayout>
  );
}