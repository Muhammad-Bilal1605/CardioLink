// frontend/src/components/dashboards/DoctorDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Stethoscope, Users, Calendar, FileText, Clock, ChevronRight, 
  Activity, Heart, AlertCircle, Plus, User, RefreshCw, Video
} from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import AppointmentManagement from "../Appointments/AppointmentManagement";
import NewVideocallComponent from "../Chats/NewVideocallComponent";

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [showAppointmentManagement, setShowAppointmentManagement] = useState(false);
  const [showTeleconsultation, setShowTeleconsultation] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

  const mapPatientNames = (appointmentsList, patientsList) => {
    const patientMap = {};
    patientsList.forEach(patient => {
      patientMap[patient._id] = patient.firstName 
        ? `${patient.firstName} ${patient.lastName || ''}`.trim() 
        : patient.name;
    });

    return appointmentsList.map(apt => ({
      ...apt,
      patient: patientMap[apt.patientId] || apt.patientName || 'Unknown',
      patientName: patientMap[apt.patientId] || apt.patientName || 'Unknown'
    }));
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const doctorId = user?._id || localStorage.getItem('doctorId');
      
      if (!doctorId) {
        throw new Error('Doctor ID not found. Please log in again.');
      }

      console.log('📋 Fetching data for doctor:', doctorId);
      console.log('🔑 Token:', token ? 'Available' : 'Not found');

      let allPatients = [];

      // Fetch patients FIRST
      try {
        const patientsResponse = await fetch('http://localhost:5000/api/patients');
        if (patientsResponse.ok) {
          const patientsData = await patientsResponse.json();
          
          const formattedPatients = patientsData.data.map(patient => ({
            id: patient._id,
            name: patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : patient.name,
            email: patient.email,
            phoneNumber: patient.phoneNumber,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.firstName || patient.name || 'P')}&background=random`,
            age: patient.age || 'N/A',
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            address: patient.address,
            condition: patient.condition || 'General checkup',
            lastVisit: patient.lastVisit ? formatLastVisit(patient.lastVisit) : 'First visit',
            _id: patient._id,
            firstName: patient.firstName,
            lastName: patient.lastName
          }));
          
          allPatients = patientsData.data;
          setPatients(formattedPatients);
          setRecentPatients(formattedPatients.slice(0, 3));
          
          setStats(prev => ({
            ...prev,
            totalPatients: formattedPatients.length
          }));
        }
      } catch (err) {
        console.error('❌ Patients endpoint error:', err);
      }

      // Fetch appointments from database
      try {
        const appointmentsResponse = await fetch(
          `http://localhost:5000/api/appointments/doctor/${doctorId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('📡 Appointments API Response Status:', appointmentsResponse.status);

        if (appointmentsResponse.ok) {
          const appointmentsData = await appointmentsResponse.json();
          console.log('✅ Appointments data received:', appointmentsData);

          let formattedAppointments = (appointmentsData.data || []).map(apt => {
            // Find patient details from allPatients
            const patientDetails = allPatients.find(p => p._id === apt.patientId);
            
            return {
              id: apt.id || apt._id,
              patientId: apt.patientId,
              patient: apt.patientName || 'Unknown',
              patientName: apt.patientName || 'Unknown',
              time: apt.appointmentTime || new Date(apt.appointmentDate).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              date: apt.formattedDate || new Date(apt.appointmentDate).toLocaleDateString(),
              appointmentDate: apt.appointmentDate,
              status: apt.status === 'Upcoming' ? 'pending' : apt.status?.toLowerCase() || 'pending',
              purpose: apt.reason || 'Consultation',
              reason: apt.reason || 'Consultation',
              doctorName: apt.doctorName,
              doctorSpecialty: apt.doctorSpecialty,
              location: apt.location,
              roomNumber: apt.roomNumber,
              joiningCode: apt.joiningCode,
              consultationFee: apt.consultationFee,
              bookingFee: apt.bookingFee,
              paymentMethod: apt.paymentMethod,
              // Add patient details for teleconsultation
              patientDetails: patientDetails ? {
                id: patientDetails._id,
                name: patientDetails.firstName 
                  ? `${patientDetails.firstName} ${patientDetails.lastName || ''}`.trim() 
                  : patientDetails.name,
                firstName: patientDetails.firstName,
                lastName: patientDetails.lastName,
                email: patientDetails.email,
                phoneNumber: patientDetails.phoneNumber,
                age: patientDetails.age,
                gender: patientDetails.gender,
                bloodGroup: patientDetails.bloodGroup,
                address: patientDetails.address,
                avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  patientDetails.firstName || patientDetails.name || 'P'
                )}&background=random`,
                appointmentDate: apt.appointmentDate,
                appointmentTime: apt.appointmentTime,
                appointmentReason: apt.reason,
                location: apt.location,
                roomNumber: apt.roomNumber,
                joiningCode: apt.joiningCode,
                timestamp: new Date(apt.appointmentDate).toLocaleDateString(),
                status: 'offline'
              } : null
            };
          });

          // Map patient names from patients data
          if (allPatients.length > 0) {
            formattedAppointments = mapPatientNames(formattedAppointments, allPatients);
            console.log('✅ Patient names mapped:', formattedAppointments);
          }

          setAppointments(formattedAppointments);
          console.log('✅ Formatted appointments:', formattedAppointments.length, 'appointments');

          // Calculate today's appointments
          const today = new Date().toDateString();
          const todayAppointments = formattedAppointments.filter(apt => 
            new Date(apt.appointmentDate).toDateString() === today
          );

          const pendingAppointments = formattedAppointments.filter(apt => 
            apt.status === 'pending' || apt.status === 'upcoming'
          );

          setStats(prev => ({
            ...prev,
            todayAppointments: todayAppointments.length,
            pendingAppointments: pendingAppointments.length,
            totalConsultations: formattedAppointments.length
          }));
        } else {
          console.log('❌ Appointments API error:', appointmentsResponse.status, appointmentsResponse.statusText);
          const errorData = await appointmentsResponse.json();
          console.log('Error details:', errorData);
        }
      } catch (err) {
        console.error('❌ Error fetching appointments:', err);
      }

    } catch (err) {
      console.error('❌ Error fetching dashboard data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
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
    setShowTeleconsultation(false);
    setSelectedPatient(null);
    fetchDashboardData();
  };

  const handleStartConsultation = (appointment) => {
    console.log('Starting consultation for appointment:', appointment);
    
    if (!appointment.patientDetails) {
      alert('Patient details not available. Please refresh the page.');
      return;
    }
    
    setSelectedPatient(appointment.patientDetails);
    setShowTeleconsultation(true);
  };

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

  // Show Teleconsultation Screen
  if (showTeleconsultation && selectedPatient) {
    return (
      <DashboardLayout title="Teleconsultation" role="doctor">
        <div>
          <motion.button
            onClick={handleBackToDashboard}
            className="mb-4 ml-4 px-6 py-3 bg-white text-blue-600 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 font-semibold"
            whileHover={{ scale: 1.02, x: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            Back to Dashboard
          </motion.button>
          
          <NewVideocallComponent 
            patient={selectedPatient}
            doctor={user || {
              id: user?._id,
              name: user?.name,
              email: user?.email,
              specialization: user?.specialization,
              avatar: user?.avatar
            }}
            onClose={handleBackToDashboard}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Doctor Dashboard" role="doctor">
      {showAppointmentManagement ? (
        <div>
          <motion.button
            onClick={handleBackToDashboard}
            className="mb-4 ml-4 px-6 py-3 bg-white text-blue-600 rounded-lg shadow-md hover:shadow-lg transition flex items-center gap-2 font-semibold"
            whileHover={{ scale: 1.02, x: -5 }}
            whileTap={{ scale: 0.98 }}
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
            Back to Dashboard
          </motion.button>
          
          <AppointmentManagement appointments={appointments} />
        </div>
      ) : (
        <motion.div 
          className="px-2 md:px-6 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
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
                              {appointment.patientName}
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
                            ${appointment.status === 'pending' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : appointment.status === 'confirmed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'}`}
                          >
                            {appointment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {appointment.status === 'confirmed' ? (
                            <motion.button 
                              onClick={() => handleStartConsultation(appointment)}
                              className="px-4 py-2 text-white bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all flex items-center gap-2 shadow-md"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Video className="w-4 h-4" />
                              Start Consultation
                            </motion.button>
                          ) : (
                            <div className="flex space-x-2">
                              <motion.button 
                                onClick={() => navigate(`/chats`)}
                                className="px-3 py-1 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                Chat
                              </motion.button>
                            </div>
                          )}
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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <motion.div 
              className="lg:col-span-2 bg-white rounded-2xl shadow-md overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-indigo-600" />
                  All Patients ({patients.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {patients.length > 0 ? (
                  patients.map((patient, index) => {
                    const hasAppointment = appointments.some(apt => apt.patientId === patient.id);
                    
                    return (
                      <motion.div 
                        key={patient.id} 
                        className={`px-6 py-4 transition-colors ${hasAppointment ? 'hover:bg-gray-50 cursor-pointer' : 'bg-gray-50 opacity-60 cursor-not-allowed'}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * index + 0.4, duration: 0.3 }}
                        whileHover={hasAppointment ? { backgroundColor: "#f9fafb" } : {}}
                        onClick={() => hasAppointment && navigate(`/chats`)}
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
                                  <span className={`h-2 w-2 rounded-full mr-1 ${hasAppointment ? 'bg-indigo-400' : 'bg-red-400'}`}></span>
                                  {hasAppointment ? patient.condition : 'No appointment'}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="text-xs text-gray-500 mr-4 bg-gray-100 px-2 py-1 rounded-full">
                              Last visit: {patient.lastVisit}
                            </span>
                            <motion.button 
                              className={`p-2 rounded-full ${hasAppointment ? 'text-indigo-600 hover:text-indigo-800 bg-indigo-50' : 'text-gray-400 bg-gray-200 cursor-not-allowed'}`}
                              whileHover={hasAppointment ? { scale: 1.1, backgroundColor: "#e0e7ff" } : {}}
                              whileTap={hasAppointment ? { scale: 0.9 } : {}}
                              disabled={!hasAppointment}
                              title={hasAppointment ? 'Chat with patient' : 'No appointment scheduled'}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="px-6 py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No patients registered yet</p>
                  </div>
                )}
              </div>
            </motion.div>

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
        </motion.div>
      )}
    </DashboardLayout>
  );
};

export default DoctorDashboard;