import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Stethoscope, Users, Calendar, FileText, Clock, ChevronRight, 
  Activity, Heart, AlertCircle, Plus, User
} from "lucide-react";
import DashboardLayout from "../DashboardLayout";
import { useAuthStore } from "../../store/authStore";
import { ProfilePhoto } from "../Profile/ProfilePhoto";

const DoctorDashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [appointments, setAppointments] = useState([
    { id: 1, patient: "John Smith", time: "09:00 AM", status: "confirmed", purpose: "Annual checkup" },
    { id: 2, patient: "Emily Johnson", time: "10:30 AM", status: "confirmed", purpose: "Cardiac evaluation" },
    { id: 3, patient: "Robert Williams", time: "11:45 AM", status: "confirmed", purpose: "Post-surgery follow-up" },
    { id: 4, patient: "Maria Garcia", time: "02:15 PM", status: "pending", purpose: "Echocardiogram results" },
    { id: 5, patient: "James Wilson", time: "03:30 PM", status: "confirmed", purpose: "New patient consultation" }
  ]);

  const [stats] = useState({
    patients: 248,
    appointments: {
      today: 8,
      pending: 3
    },
    criticalCases: 4
  });

  const [recentPatients] = useState([
    { id: 101, name: "Robert Brown", age: 62, condition: "Hypertension", lastVisit: "Yesterday" },
    { id: 102, name: "Linda Davis", age: 54, condition: "Arrhythmia", lastVisit: "2 days ago" },
    { id: 103, name: "Michael Lee", age: 70, condition: "Post MI recovery", lastVisit: "1 week ago" }
  ]);
  
  const handleViewAllAppointments = () => {
    navigate("/AppointmentSchedule");
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1
      }
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

  return (
    <DashboardLayout title="Doctor Dashboard" role="doctor">
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
          <motion.div 
            className="mt-4 sm:mt-0 flex items-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 text-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Calendar className="h-4 w-4 mr-2 text-blue-200" />
            <span>Today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </motion.div>
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
            <div className="text-3xl font-bold text-gray-900">{stats.patients}</div>
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <span className="inline-block w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
              Total patients under care
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
            <div className="text-3xl font-bold text-gray-900">{stats.appointments.today}</div>
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
            <div className="text-3xl font-bold text-gray-900">{stats.appointments.pending}</div>
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
              Appointment requests
            </div>
          </motion.div>
          
          <motion.div 
            variants={itemVariants}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className="bg-white rounded-2xl shadow-md p-6 border-l-4 border-red-500 hover:shadow-lg transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-700">Critical Cases</h3>
              <div className="p-3 bg-red-100 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-500" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{stats.criticalCases}</div>
            <div className="mt-2 text-sm text-gray-500 flex items-center">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              Requiring attention
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
              Today's Appointments
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
                {appointments.map((appointment, index) => (
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
                          : 'bg-yellow-100 text-yellow-800'}`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <motion.button 
                          className="px-3 py-1 text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          View
                        </motion.button>
                        <motion.button 
                          className="px-3 py-1 text-green-600 bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          Start
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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
              {recentPatients.map((patient, index) => (
                <motion.div 
                  key={patient.id} 
                  className="px-6 py-4 hover:bg-gray-50 transition-colors"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index + 0.4, duration: 0.3 }}
                  whileHover={{ backgroundColor: "#f9fafb" }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mr-4">
                        <User className="h-5 w-5" />
                      </div>
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
                      <span className="text-xs text-gray-500 mr-4 bg-gray-100 px-2 py-1 rounded-full">Last visit: {patient.lastVisit}</span>
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
              ))}
            </div>
            <div className="px-6 py-4 bg-gray-50">
              <motion.button 
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
                onClick={() => navigate("/AppointmentSchedule")}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition shadow-md"
                whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(59, 130, 246, 0.3)" }}
                whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(59, 130, 246, 0.3)" }}
              >
                <Plus className="mr-2 h-5 w-5" />
                New Appointment
              </motion.button>
              
              <motion.button 
                className="w-full flex items-center justify-center px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition shadow-md"
                whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)" }}
                whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(16, 185, 129, 0.3)" }}
              >
                <FileText className="mr-2 h-5 w-5" />
                Create Patient Record
              </motion.button>
              
              <motion.button 
                className="w-full flex items-center justify-center px-4 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition shadow-md"
                whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(139, 92, 246, 0.3)" }}
                whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(139, 92, 246, 0.3)" }}
              >
                <Activity className="mr-2 h-5 w-5" />
                Write Prescription
              </motion.button>

              <motion.button 
                className="w-full flex items-center justify-center px-4 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition shadow-md"
                whileHover={{ y: -3, boxShadow: "0 10px 15px -3px rgba(239, 68, 68, 0.3)" }}
                whileTap={{ y: 0, boxShadow: "0 0px 0px 0px rgba(239, 68, 68, 0.3)" }}
              >
                <Heart className="mr-2 h-5 w-5" />
                Cardiac Emergency
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;