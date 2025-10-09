// Complete DoctorDashboard.jsx with Appointment Management Integration
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Stethoscope, Users, Calendar, FileText, Clock, ChevronRight, 
  Activity, Heart, AlertCircle, Plus, User, RefreshCw
} from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import AppointmentManagement from "../Appointments/AppointmentManagement";

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  // State for toggling between dashboard and appointment management
  const [showAppointmentManagement, setShowAppointmentManagement] = useState(false);
  
  const [patients, setPatients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [recentPatients, setRecentPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    totalConsultations: 0
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      
      // Fetch patients
      const patientsResponse = await fetch('http://localhost:5000/api/patients');
      if (!patientsResponse.ok) throw new Error('Failed to fetch patients');
      const patientsData = await patientsResponse.json();
      
      const formattedPatients = patientsData.data.map(patient => ({
        id: patient._id,
        name: patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : patient.name,
        email: patient.email,
        phoneNumber: patient.phoneNumber,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.firstName || patient.name || 'P')}&background=random`,
        lastMessage: "No messages yet",
        timestamp: new Date(patient.updatedAt || patient.createdAt).toLocaleDateString(),
        status: "offline",
        age: patient.age || 'N/A',
        condition: patient.condition || 'General checkup',
        lastVisit: patient.lastVisit ? formatLastVisit(patient.lastVisit) : 'First visit'
      }));
      
      setPatients(formattedPatients);
      setRecentPatients(formattedPatients.slice(0, 3));
      
      // Fetch appointments
      try {
        const appointmentsResponse = await fetch('http://localhost:5000/api/appointments/doctor', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          const formattedAppointments = appointmentsData.data?.map(apt => ({
            id: apt._id,
            patient: apt.patientName || apt.patient?.firstName || 'Unknown',
            patientId: apt.patientId || apt.patient?._id,
            time: new Date(apt.appointmentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            date: new Date(apt.appointmentTime).toLocaleDateString(),
            appointmentDate: apt.appointmentTime,
            status: apt.status || 'pending',
            purpose: apt.reason || apt.purpose || 'Consultation'
          })) || [];
          
          setAppointments(formattedAppointments);
          
          // Calculate today's appointments
          const today = new Date().toDateString();
          const todayAppointments = formattedAppointments.filter(apt => 
            new Date(apt.appointmentDate).toDateString() === today
          );
          
          const pendingAppointments = formattedAppointments.filter(apt => 
            apt.status === 'pending'
          );
          
          setStats(prev => ({
            ...prev,
            todayAppointments: todayAppointments.length,
            pendingAppointments: pendingAppointments.length
          }));
        }
      } catch (err) {
        console.log('Appointments endpoint not available:', err);
      }
      
      // Fetch consultations
      try {
        const consultationsResponse = await fetch('http://localhost:5000/api/consultations/doctor', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (consultationsResponse.ok) {
          const consultationsData = await consultationsResponse.json();
          setConsultations(consultationsData.data || []);
          setStats(prev => ({
            ...prev,
            totalConsultations: consultationsData.data?.length || 0
          }));
        }
      } catch (err) {
        console.log('Consultations endpoint not available:', err);
      }
      
      // Update total patients stat
      setStats(prev => ({
        ...prev,
        totalPatients: formattedPatients.length
      }));
      
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formatLastVisit = (date) => {
    const visitDate = new Date(date);
    const today = new Date();
    const diffTime = Math.abs(today - visitDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return visitDate.toLocaleDateString();
  };

  const handleViewAllAppointments = () => {
    navigate("/AppointmentSchedule");
  };

  const handleRefresh = () => {
    fetchDashboardData();
  };

  const handleManageAppointments = () => {
    setShowAppointmentManagement(true);
  };

  const handleBackToDashboard = () => {
    setShowAppointmentManagement(false);
    // Refresh data when coming back
    fetchDashboardData();
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 100 }
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Doctor Dashboard" role="doctor">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
            <p className="text-gray-600">Loading dashboard data...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout title="Doctor Dashboard" role="doctor">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">Error loading dashboard: {error}</p>
            <motion.button
              onClick={handleRefresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Retry
            </motion.button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Doctor Dashboard" role="doctor">
      {showAppointmentManagement ? (
        <div>
          {/* Back Button */}
          <motion.button
            onClick={handleBackToDashboard}
            className="mb-4 ml-4 px-6 py-3 bg-white text-blue-600 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 font-semibold"
            whileHover={{ scale: 1.02, x: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            Back to Dashboard
          </motion.button>
          
          {/* Appointment Management Component */}
          <AppointmentManagement />
        </div>
      ) : (
        <motion.div 
          className="px-2 md:px-6 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <motion.div 
            className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 bg-gradient-to-r from-green-600 to-green-900 rounded-2xl p-6 shadow-lg text-white"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-2">Welcome back, Dr. {user?.name}</h2>
              <p className="text-blue-100">Here's your schedule and patient overview for today.</p>
            </div>
            <div className="mt-4 sm:mt-0 flex gap-3">
              <motion.button
                onClick={handleRefresh}
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm hover:bg-white/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </motion.button>
              <motion.div 
                className="flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm"
                whileHover={{ scale: 1.05 }}
              >
                <Calendar className="h-4 w-4 mr-2 text-blue-200" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </motion.div>
            </div>
          </motion.div>
          
          {/* Stats cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Your Patients</h3>
                <div className="p-3 bg-blue-100 rounded-full">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalPatients}</div>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Total patients registered
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Today</h3>
                <div className="p-3 bg-green-100 rounded-full">
                  <Calendar className="h-6 w-6 text-green-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.todayAppointments}</div>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Appointments scheduled
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Pending</h3>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.pendingAppointments}</div>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                Appointment requests
              </div>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
              className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-purple-500 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-700">Consultations</h3>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Activity className="h-6 w-6 text-purple-500" />
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900">{stats.totalConsultations}</div>
              <div className="mt-2 text-sm text-gray-500 flex items-center">
                <span className="inline-block w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                Total consultations done
              </div>
            </motion.div>
          </motion.div>

          {/* Today's appointments */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md overflow-hidden mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                Today's Appointments ({stats.todayAppointments})
              </h3>
              <motion.button 
                onClick={handleViewAllAppointments} 
                className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center bg-white px-3 py-1.5 rounded-full shadow-sm"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </motion.button>
            </div>
            <div className="overflow-x-auto">
              {appointments.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Purpose
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {appointments.filter(apt => 
                      new Date(apt.appointmentDate).toDateString() === new Date().toDateString()
                    ).slice(0, 5).map((appointment, index) => (
                      <motion.tr 
                        key={appointment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.3 }}
                        whileHover={{ backgroundColor: "#f9fafb" }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 flex-shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mr-3">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {appointment.patient}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {appointment.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">{appointment.purpose}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${appointment.status === 'confirmed' 
                              ? 'bg-green-100 text-green-800' 
                              : appointment.status === 'completed'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'}`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <motion.button 
                              onClick={() => navigate(`/chats`)}
                              className="px-3 py-1 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Chat
                            </motion.button>
                            <motion.button 
                              onClick={() => navigate(`/chats`)}
                              className="px-3 py-1 text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              Start Call
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="px-6 py-12 text-center text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No appointments scheduled for today</p>
                  <motion.button
                    onClick={handleManageAppointments}
                    className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Manage Appointments
                  </motion.button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Recent patients and Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Recent patients */}
            <motion.div 
              className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  Recent Patients
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                {recentPatients.length > 0 ? (
                  recentPatients.map((patient, index) => (
                    <motion.div 
                      key={patient.id} 
                      className="px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index + 0.4, duration: 0.3 }}
                      whileHover={{ backgroundColor: "#f9fafb" }}
                      onClick={() => navigate(`/chats`)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            src={patient.avatar}
                            alt={patient.name}
                            className="h-10 w-10 rounded-full mr-4"
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900">{patient.name}</p>
                            <p className="text-sm text-gray-500 mt-1">
                              <span className="inline-flex items-center mr-3">
                                <span className="h-2 w-2 bg-gray-300 rounded-full mr-1"></span>
                                Age: {patient.age}
                              </span>
                              <span className="inline-flex items-center">
                                <span className="h-2 w-2 bg-indigo-400 rounded-full mr-1"></span>
                                {patient.condition}
                              </span>
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-xs text-gray-500 mr-4 bg-gray-100 px-2 py-1 rounded-full">
                            Last visit: {patient.lastVisit}
                          </span>
                          <motion.button 
                            className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 p-2 rounded-full"
                            whileHover={{ scale: 1.1, backgroundColor: "#e0e7ff" }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No patients registered yet</p>
                  </div>
                )}
              </div>
              <div className="px-6 py-4 bg-gray-50">
                <motion.button 
                  onClick={() => navigate('/chats')}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center"
                  whileHover={{ x: 5 }}
                >
                  View all patients <ChevronRight className="h-4 w-4 ml-1" />
                </motion.button>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="bg-white rounded-2xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
            >
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Quick Actions
                </h3>
              </div>
              <div className="p-6 space-y-4">
                <motion.button 
                  onClick={handleManageAppointments}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-md"
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(59, 130, 246, 0.3)" }}
                >
                  <Calendar className="mr-2 h-5 w-5" />
                  Manage Appointments
                </motion.button>
                
                <motion.button 
                  onClick={() => navigate("/chats")}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition shadow-md"
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)" }}
                  whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(16, 185, 129, 0.3)" }}
                >
                  <FileText className="mr-2 h-5 w-5" />
                  View Patients
                </motion.button>
                
                <motion.button 
                  onClick={() => navigate("/upload-visits")}
                  className="w-full flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition shadow-md"
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)" }}
                  whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(139, 92, 246, 0.3)" }}
                >
                  <Activity className="mr-2 h-5 w-5" />
                  Upload Visit
                </motion.button>

                <motion.button 
                  onClick={() => navigate("/chats")}
                  className="w-full flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-md"
                  whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)" }}
                  whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(239, 68, 68, 0.3)" }}
                >
                  <Heart className="mr-2 h-5 w-5" />
                  Emergency Consultation
                </motion.button>
              </div>
            </motion.div>
          </div>

          {/* Recent Consultations Section */}
          {consultations.length > 0 && (
            <motion.div 
              className="bg-white rounded-2xl shadow-md overflow-hidden mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
            >
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-pink-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-purple-600" />
                  Recent Consultations
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Patient
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Diagnosis
                      </th>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {consultations.slice(0, 5).map((consultation, index) => (
                      <motion.tr 
                        key={consultation._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.3 }}
                        whileHover={{ backgroundColor: "#f9fafb" }}
                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-9 w-9 flex-shrink-0 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mr-3">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="text-sm font-medium text-gray-900">
                              {consultation.patientName}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {new Date(consultation.consultationDate).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full capitalize">
                            {consultation.consultationType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {consultation.diagnosis || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full
                            ${consultation.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'}`}
                          >
                            {consultation.status}
                          </span>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default DoctorDashboard;