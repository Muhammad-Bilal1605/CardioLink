import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, Check, X, RefreshCw, Video, 
  Bell, Copy, CheckCircle, XCircle, Edit, Phone, Mail
} from 'lucide-react';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState(null); // 'accept', 'reject', 'reschedule'
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Initialize with Millie's appointment
  useEffect(() => {
    const today = new Date();
    const appointmentTime = new Date(today);
    appointmentTime.setHours(16, 0, 0, 0); // 4:00 PM

    const initialAppointments = [
      {
        id: 'APT001',
        patientName: 'Millie',
        patientEmail: 'millie@example.com',
        patientPhone: '+92 300 1234567',
        patientAvatar: 'https://ui-avatars.com/api/?name=Millie&background=random',
        appointmentDate: appointmentTime.toISOString(),
        reason: 'Cardiac Evaluation',
        status: 'pending',
        notes: 'Patient experiencing mild chest discomfort',
        requestedDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'APT002',
        patientName: 'Millie',
        patientEmail: 'millie@example.com',
        patientPhone: '+92 300 1234567',
        patientAvatar: 'https://ui-avatars.com/api/?name=Millie&background=random',
        appointmentDate: new Date(today.setDate(today.getDate() + 1)).toISOString(),
        reason: 'Follow-up Consultation',
        status: 'pending',
        notes: 'Regular checkup after medication',
        requestedDate: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
      }
    ];

    setAppointments(initialAppointments);
  }, []);

  const generateVideoCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleAcceptAppointment = () => {
    const videoCode = generateVideoCode();
    const updatedAppointment = {
      ...selectedAppointment,
      status: 'confirmed',
      videoCode: videoCode,
      confirmedAt: new Date().toISOString()
    };

    setAppointments(prev => 
      prev.map(apt => apt.id === selectedAppointment.id ? updatedAppointment : apt)
    );

    // Show notification
    setNotificationData({
      type: 'success',
      title: 'Appointment Confirmed!',
      message: `Video consultation code: ${videoCode}`,
      appointment: updatedAppointment
    });
    setShowNotification(true);
    setShowActionModal(false);
    setSelectedAppointment(null);

    // Send notification to patient (simulation)
    console.log('📧 Sending notification to patient:', {
      to: selectedAppointment.patientEmail,
      subject: 'Appointment Confirmed',
      videoCode: videoCode,
      appointmentDate: selectedAppointment.appointmentDate
    });
  };

  const handleRejectAppointment = () => {
    const updatedAppointment = {
      ...selectedAppointment,
      status: 'rejected',
      rejectedAt: new Date().toISOString()
    };

    setAppointments(prev => 
      prev.map(apt => apt.id === selectedAppointment.id ? updatedAppointment : apt)
    );

    setNotificationData({
      type: 'error',
      title: 'Appointment Rejected',
      message: `Appointment with ${selectedAppointment.patientName} has been rejected.`,
      appointment: updatedAppointment
    });
    setShowNotification(true);
    setShowActionModal(false);
    setSelectedAppointment(null);
  };

  const handleRescheduleAppointment = () => {
    if (!rescheduleDate || !rescheduleTime) {
      alert('Please select both date and time for rescheduling');
      return;
    }

    const newDateTime = new Date(`${rescheduleDate}T${rescheduleTime}`);
    const updatedAppointment = {
      ...selectedAppointment,
      appointmentDate: newDateTime.toISOString(),
      status: 'rescheduled',
      rescheduledAt: new Date().toISOString(),
      originalDate: selectedAppointment.appointmentDate
    };

    setAppointments(prev => 
      prev.map(apt => apt.id === selectedAppointment.id ? updatedAppointment : apt)
    );

    setNotificationData({
      type: 'info',
      title: 'Appointment Rescheduled',
      message: `New time: ${newDateTime.toLocaleString()}`,
      appointment: updatedAppointment
    });
    setShowNotification(true);
    setShowActionModal(false);
    setSelectedAppointment(null);
    setRescheduleDate('');
    setRescheduleTime('');
  };

  const openActionModal = (appointment, action) => {
    setSelectedAppointment(appointment);
    setActionType(action);
    setShowActionModal(true);

    if (action === 'reschedule') {
      const aptDate = new Date(appointment.appointmentDate);
      setRescheduleDate(aptDate.toISOString().split('T')[0]);
      setRescheduleTime(aptDate.toTimeString().slice(0, 5));
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      case 'rescheduled': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'rescheduled': return <RefreshCw className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Appointment Management</h1>
          <p className="text-gray-600">Review and manage patient appointment requests</p>
        </motion.div>

        {/* Notification Toast */}
        <AnimatePresence>
          {showNotification && notificationData && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="fixed top-6 right-6 z-50 max-w-md"
            >
              <div className={`bg-white rounded-lg shadow-2xl p-6 border-l-4 ${
                notificationData.type === 'success' ? 'border-green-500' : 
                notificationData.type === 'error' ? 'border-red-500' : 'border-blue-500'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-bold text-gray-800">{notificationData.title}</h3>
                      <p className="text-sm text-gray-600">{notificationData.message}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowNotification(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {notificationData.appointment?.videoCode && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-700">Video Code:</span>
                      <button
                        onClick={() => copyToClipboard(notificationData.appointment.videoCode)}
                        className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                      >
                        {copiedCode ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-3xl font-bold text-center text-blue-600 tracking-widest">
                      {notificationData.appointment.videoCode}
                    </div>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      Share this code with {notificationData.appointment.patientName}
                    </p>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500">
                  <p>📧 Notification sent to {notificationData.appointment.patientEmail}</p>
                  <p>📱 SMS sent to {notificationData.appointment.patientPhone}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Appointments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {appointments.map((appointment, index) => (
            <motion.div
              key={appointment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              {/* Appointment Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={appointment.patientAvatar}
                      alt={appointment.patientName}
                      className="w-16 h-16 rounded-full border-4 border-white shadow-lg"
                    />
                    <div>
                      <h3 className="text-xl font-bold">{appointment.patientName}</h3>
                      <p className="text-blue-100 text-sm">ID: {appointment.id}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full border ${getStatusColor(appointment.status)} flex items-center gap-2 bg-white`}>
                    {getStatusIcon(appointment.status)}
                    <span className="text-xs font-semibold capitalize">{appointment.status}</span>
                  </div>
                </div>

                {appointment.videoCode && (
                  <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-100">Video Code</p>
                      <p className="text-2xl font-bold tracking-wider">{appointment.videoCode}</p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(appointment.videoCode)}
                      className="bg-white/30 hover:bg-white/40 p-2 rounded-lg transition"
                    >
                      <Copy className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Appointment Details */}
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Appointment Date & Time</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(appointment.appointmentDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      {new Date(appointment.appointmentDate).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Video className="w-5 h-5 text-green-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Reason for Visit</p>
                    <p className="font-semibold text-gray-800">{appointment.reason}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-purple-600 mt-1" />
                  <div>
                    <p className="text-sm text-gray-500">Contact Information</p>
                    <p className="text-sm text-gray-800">{appointment.patientEmail}</p>
                    <p className="text-sm text-gray-800">{appointment.patientPhone}</p>
                  </div>
                </div>

                {appointment.notes && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Patient Notes:</p>
                    <p className="text-sm text-gray-700">{appointment.notes}</p>
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  <p>Requested: {new Date(appointment.requestedDate).toLocaleString()}</p>
                  {appointment.confirmedAt && (
                    <p className="text-green-600">✓ Confirmed: {new Date(appointment.confirmedAt).toLocaleString()}</p>
                  )}
                  {appointment.rescheduledAt && (
                    <p className="text-blue-600">↻ Rescheduled: {new Date(appointment.rescheduledAt).toLocaleString()}</p>
                  )}
                </div>

                {/* Action Buttons */}
                {appointment.status === 'pending' && (
                  <div className="flex gap-3 pt-4 border-t">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openActionModal(appointment, 'accept')}
                      className="flex-1 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition flex items-center justify-center gap-2"
                    >
                      <Check className="w-5 h-5" />
                      Accept
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openActionModal(appointment, 'reschedule')}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                    >
                      <Edit className="w-5 h-5" />
                      Reschedule
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openActionModal(appointment, 'reject')}
                      className="flex-1 bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition flex items-center justify-center gap-2"
                    >
                      <X className="w-5 h-5" />
                      Reject
                    </motion.button>
                  </div>
                )}

                {appointment.status === 'confirmed' && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center justify-center gap-2"
                  >
                    <Video className="w-5 h-5" />
                    Start Video Consultation
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Modal */}
        <AnimatePresence>
          {showActionModal && selectedAppointment && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowActionModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              >
                <h2 className="text-2xl font-bold text-gray-800 mb-4 capitalize">
                  {actionType} Appointment
                </h2>

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={selectedAppointment.patientAvatar}
                      alt={selectedAppointment.patientName}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-gray-800">{selectedAppointment.patientName}</p>
                      <p className="text-sm text-gray-600">{selectedAppointment.reason}</p>
                    </div>
                  </div>

                  {actionType === 'accept' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 mb-2">
                        ✓ A 4-digit video consultation code will be generated
                      </p>
                      <p className="text-sm text-gray-700 mb-2">
                        ✓ Both you and the patient will receive the code
                      </p>
                      <p className="text-sm text-gray-700">
                        ✓ Notifications will be sent via email and SMS
                      </p>
                    </div>
                  )}

                  {actionType === 'reject' && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700">
                        ⚠️ This appointment will be rejected and the patient will be notified.
                      </p>
                    </div>
                  )}

                  {actionType === 'reschedule' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Date
                        </label>
                        <input
                          type="date"
                          value={rescheduleDate}
                          onChange={(e) => setRescheduleDate(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Time
                        </label>
                        <input
                          type="time"
                          value={rescheduleTime}
                          onChange={(e) => setRescheduleTime(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowActionModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (actionType === 'accept') handleAcceptAppointment();
                      else if (actionType === 'reject') handleRejectAppointment();
                      else if (actionType === 'reschedule') handleRescheduleAppointment();
                    }}
                    className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                      actionType === 'accept' ? 'bg-green-500 hover:bg-green-600' :
                      actionType === 'reject' ? 'bg-red-500 hover:bg-red-600' :
                      'bg-blue-500 hover:bg-blue-600'
                    }`}
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AppointmentManagement;