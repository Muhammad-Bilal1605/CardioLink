// frontend/src/components/Chats/DoctorChatsRefactored.jsx - TELECONSULTATION ONLY
import React, { useState, useEffect, useRef } from 'react';
import { Video, Search, AlertCircle, Wifi, WifiOff, User, MessageCircle, Stethoscope, RefreshCw, Calendar, Clock, MapPin, Hash, Phone, Mail, UserCheck } from 'lucide-react';
import { io } from 'socket.io-client';
import NewVideocallComponent from './NewVideocallComponent';
import { useAuthStore } from '../../store/authStore';

const DOCTOR_PROFILE = {
  id: 'doctor_001',
  name: "Dr. Sarah Williams",
  email: "dr.williams@medconnect.com",
  specialization: "General Medicine",
  avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
};

const DoctorChats = () => {
  const { user } = useAuthStore();
  
  // Connection & Chat State
  const [socket, setSocket] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [patients, setPatients] = useState([]);
  const [confirmedPatients, setConfirmedPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showTelehealth, setShowTelehealth] = useState(false);

  // Refs
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);

  // Fetch patients with confirmed appointments
  useEffect(() => {
    fetchConfirmedPatients();
  }, []);

  const fetchConfirmedPatients = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const doctorId = user?._id || localStorage.getItem('doctorId') || DOCTOR_PROFILE.id;

      console.log('🔍 Fetching data for doctor:', doctorId);

      // Step 1: Fetch all patients
      const patientsResponse = await fetch('http://localhost:5000/api/patients');
      if (!patientsResponse.ok) {
        throw new Error('Failed to fetch patients');
      }
      const patientsData = await patientsResponse.json();
      console.log('✅ Patients fetched:', patientsData.data.length);

      // Step 2: Fetch all appointments
      const appointmentsResponse = await fetch('http://localhost:5000/api/appointments/', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (!appointmentsResponse.ok) {
        throw new Error('Failed to fetch appointments');
      }
      const appointmentsData = await appointmentsResponse.json();
      console.log('✅ Appointments fetched:', appointmentsData.data?.length || 0);

      // Step 3: Filter confirmed appointments for this doctor
      const confirmedAppointments = (appointmentsData.data || []).filter(apt => 
        apt.status === "confirmed" && apt.doctorId === doctorId
      );
      console.log('✅ Confirmed appointments for this doctor:', confirmedAppointments.length);

      // Step 4: Create a Set of patient IDs with confirmed appointments
      const confirmedPatientIds = new Set(
        confirmedAppointments.map(apt => apt.patientId)
      );
      console.log('✅ Unique patients with confirmed appointments:', confirmedPatientIds.size);

      // Step 5: Filter and format patients who have confirmed appointments
      const filteredPatients = patientsData.data
        .filter(patient => confirmedPatientIds.has(patient._id))
        .map(patient => {
          // Find the latest appointment for this patient
          const patientAppointments = confirmedAppointments
            .filter(apt => apt.patientId === patient._id)
            .sort((a, b) => new Date(b.appointmentDate) - new Date(a.appointmentDate));
          
          const latestAppointment = patientAppointments[0];

          return {
            id: patient._id,
            name: patient.firstName 
              ? `${patient.firstName} ${patient.lastName || ''}`.trim() 
              : patient.name,
            firstName: patient.firstName,
            lastName: patient.lastName,
            email: patient.email,
            phoneNumber: patient.phoneNumber,
            age: patient.age,
            gender: patient.gender,
            bloodGroup: patient.bloodGroup,
            address: patient.address,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
              patient.firstName || patient.name || 'P'
            )}&background=random`,
            lastMessage: `Appointment: ${latestAppointment.reason || 'Consultation'}`,
            timestamp: new Date(latestAppointment.appointmentDate).toLocaleDateString(),
            appointmentDate: latestAppointment.appointmentDate,
            appointmentTime: latestAppointment.appointmentTime,
            appointmentReason: latestAppointment.reason,
            location: latestAppointment.location,
            roomNumber: latestAppointment.roomNumber,
            joiningCode: latestAppointment.joiningCode,
            unread: 0,
            status: "offline"
          };
        });

      console.log('✅ Final filtered patients for chat:', filteredPatients.length);
      
      setPatients(patientsData.data);
      setConfirmedPatients(filteredPatients);
      
    } catch (err) {
      console.error('❌ Error fetching confirmed patients:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Socket.IO Connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    const doctorId = user?._id || localStorage.getItem('doctorId') || DOCTOR_PROFILE.id;
    const doctorName = user?.name || DOCTOR_PROFILE.name;
    
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      setReconnectAttempts(0);
      
      newSocket.emit('authenticate', {
        userId: doctorId,
        userType: 'doctor',
        name: doctorName,
        avatar: user?.avatar || DOCTOR_PROFILE.avatar,
        email: user?.email || DOCTOR_PROFILE.email,
        specialization: user?.specialization || DOCTOR_PROFILE.specialization
      });
    });

    newSocket.on('authenticated', (data) => {
      console.log('Authentication successful:', data);
      setIsAuthenticated(true);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionError(`Connection lost: ${reason}. Attempting to reconnect...`);
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setReconnectAttempts(prev => prev + 1);
      
      if (reconnectAttempts < 5) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Attempting to reconnect...');
          newSocket.connect();
        }, delay);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
    });

    newSocket.on('user_status_change', (data) => {
      console.log('User status change:', data);
      if (data.userType === 'patient') {
        setConfirmedPatients(prev => 
          prev.map(p => {
            if (p.id === data.userId) {
              return { ...p, status: data.status };
            }
            return p;
          })
        );
      }
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(error.message || 'Unknown error occurred');
    });

    return () => {
      console.log('Cleaning up socket connection...');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      newSocket.disconnect();
    };
  }, [user]);

  const handleSelectChat = (patient) => {
    console.log('Selecting patient for teleconsultation:', patient);
    setCurrentChat(patient);
  };

  const handleTeleconsultation = () => {
    if (!currentChat) {
      alert('Please select a patient first to start teleconsultation');
      return;
    }
    setShowTelehealth(true);
  };

  const handleRetryConnection = () => {
    if (socket && !socket.connected) {
      console.log('Manual reconnection attempt...');
      setConnectionError(null);
      socket.connect();
    }
  };

  const handleRefresh = () => {
    fetchConfirmedPatients();
  };

  const StatusIndicator = ({ status }) => {
    const statusColors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500'
    };
    return (
      <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${statusColors[status]} ring-2 ring-white`}></span>
    );
  };

  const ConnectionStatus = () => {
    const getStatusColor = () => {
      if (isConnected && isAuthenticated) return 'bg-green-100 text-green-800';
      if (isConnected && !isAuthenticated) return 'bg-yellow-100 text-yellow-800';
      return 'bg-red-100 text-red-800';
    };

    const getStatusText = () => {
      if (isConnected && isAuthenticated) return 'Connected';
      if (isConnected && !isAuthenticated) return 'Authenticating...';
      return `Disconnected ${reconnectAttempts > 0 ? `(${reconnectAttempts})` : ''}`;
    };

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs ${getStatusColor()}`}>
        {isConnected && isAuthenticated ? 
          <Wifi className="w-3 h-3" /> : 
          <WifiOff className="w-3 h-3" />
        }
        {getStatusText()}
      </div>
    );
  };

  if (showTelehealth) {
    return (
      <NewVideocallComponent 
        patient={currentChat}
        doctor={user || DOCTOR_PROFILE}
        onClose={() => setShowTelehealth(false)}
      />
    );
  }

  const filteredPatients = confirmedPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading confirmed appointments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600 mb-4">Error: {error}</p>
          <button
            onClick={handleRefresh}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* PATIENTS SIDEBAR */}
      <div className="w-80 bg-white flex flex-col border-r border-gray-200 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={user?.avatar || DOCTOR_PROFILE.avatar} 
                  alt={user?.name || DOCTOR_PROFILE.name}
                  className="w-12 h-12 rounded-full object-cover ring-3 ring-white shadow-lg"
                />
                <StatusIndicator status="online" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{user?.name || DOCTOR_PROFILE.name}</h2>
                <p className="text-blue-100 text-sm">{user?.specialization || DOCTOR_PROFILE.specialization}</p>
              </div>
            </div>
            <ConnectionStatus />
          </div>
        </div>
        
        {/* Search & Refresh */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search confirmed patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh List
          </button>
        </div>
        
        {/* Connection Error */}
        {connectionError && (
          <div className="mx-4 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <span className="text-sm text-yellow-800">{connectionError}</span>
            </div>
            {!isConnected && (
              <button
                onClick={handleRetryConnection}
                className="text-xs bg-yellow-600 text-white px-3 py-1 rounded-lg hover:bg-yellow-700 transition-colors shadow-sm"
              >
                Retry Connection
              </button>
            )}
          </div>
        )}
        
        {/* Confirmed Patients Count */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100">
          <p className="text-sm text-blue-700 font-medium">
            ✅ {confirmedPatients.length} Confirmed Appointment{confirmedPatients.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        {/* Patients List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.length > 0 ? (
            filteredPatients.map((patient) => (
              <div
                key={patient.id}
                onClick={() => handleSelectChat(patient)}
                className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-blue-50 transition-all duration-200 ${
                  currentChat?.id === patient.id 
                    ? 'bg-blue-50 border-r-4 border-r-blue-500 shadow-inner' 
                    : 'hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={patient.avatar} 
                      alt={patient.name}
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-white shadow-md"
                    />
                    <StatusIndicator status={patient.status} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900 truncate">{patient.name}</h3>
                      <span className="text-xs text-gray-500">{patient.appointmentTime}</span>
                    </div>
                    <p className="text-sm text-gray-600 truncate mt-1">{patient.appointmentReason}</p>
                    <p className="text-xs text-blue-600 mt-1">📅 {patient.timestamp}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Confirmed Appointments</h3>
              <p className="text-sm text-gray-500">
                {searchTerm 
                  ? 'No patients match your search' 
                  : 'No patients with confirmed appointments yet'}
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* PATIENT INFO & TELECONSULTATION AREA */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <div className="flex-1 overflow-y-auto bg-gradient-to-br from-white via-blue-50 to-indigo-50 p-8">
            <div className="max-w-4xl mx-auto">
              {/* Patient Header Card */}
              <div className="bg-white rounded-2xl shadow-xl p-8 mb-6 border border-gray-100">
                <div className="flex items-start gap-6">
                  <div className="relative">
                    <img 
                      src={currentChat.avatar} 
                      alt={currentChat.name}
                      className="w-24 h-24 rounded-2xl object-cover ring-4 ring-blue-100 shadow-lg"
                    />
                    <StatusIndicator status={currentChat.status} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">{currentChat.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <UserCheck className="w-4 h-4 text-green-500" />
                            {currentChat.status === 'online' ? 'Online' : 'Offline'}
                          </span>
                          {currentChat.age && (
                            <span>Age: {currentChat.age}</span>
                          )}
                          {currentChat.gender && (
                            <span>Gender: {currentChat.gender}</span>
                          )}
                        </div>
                      </div>
                      <div className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        ✅ Confirmed
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Patient Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Contact Information */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Phone className="w-5 h-5 text-blue-500" />
                    Contact Information
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Email</p>
                        <p className="text-sm font-medium text-gray-900">{currentChat.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900">{currentChat.phoneNumber || 'Not provided'}</p>
                      </div>
                    </div>
                    {currentChat.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Address</p>
                          <p className="text-sm font-medium text-gray-900">{currentChat.address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Medical Information */}
                <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5 text-red-500" />
                    Medical Information
                  </h3>
                  <div className="space-y-3">
                    {currentChat.bloodGroup && (
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 flex items-center justify-center text-red-500 font-bold mt-0.5">
                          🩸
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase">Blood Group</p>
                          <p className="text-sm font-medium text-gray-900">{currentChat.bloodGroup}</p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Patient ID</p>
                        <p className="text-sm font-medium text-gray-900 font-mono">{currentChat.id.slice(-8).toUpperCase()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Appointment Details */}
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-xl p-6 mb-6 text-white">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Appointment Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-blue-100 uppercase">Date</p>
                        <p className="text-sm font-semibold">{currentChat.timestamp}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-blue-100 uppercase">Time</p>
                        <p className="text-sm font-semibold">{currentChat.appointmentTime}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-blue-100 uppercase">Location</p>
                        <p className="text-sm font-semibold">{currentChat.location || 'Virtual'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Hash className="w-5 h-5" />
                      <div>
                        <p className="text-xs text-blue-100 uppercase">Room</p>
                        <p className="text-sm font-semibold">Room {currentChat.roomNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-xs text-blue-100 uppercase mb-1">Reason for Visit</p>
                  <p className="text-base font-medium">{currentChat.appointmentReason}</p>
                </div>
                {currentChat.joiningCode && (
                  <div className="mt-4 bg-white/20 backdrop-blur-sm rounded-lg p-4 border border-white/30">
                    <p className="text-xs text-blue-100 uppercase mb-1">Joining Code</p>
                    <p className="text-2xl font-bold tracking-wider">{currentChat.joiningCode}</p>
                  </div>
                )}
              </div>

              {/* Start Teleconsultation Button */}
              <div className="flex justify-center">
                <button
                  onClick={handleTeleconsultation}
                  disabled={!isConnected || !isAuthenticated}
                  className="group relative px-12 py-6 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xl font-bold rounded-2xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-4"
                >
                  <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300"></div>
                  <Video className="w-8 h-8 relative z-10" />
                  <span className="relative z-10">Start Teleconsultation</span>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full animate-pulse"></div>
                </button>
              </div>

              {/* Connection Status */}
              {(!isConnected || !isAuthenticated) && (
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {!isConnected ? 'Connecting to server...' : 'Authenticating...'}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <Stethoscope className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Patient</h3>
              <p className="text-gray-600 mb-4">Choose a patient with confirmed appointment to view details and start teleconsultation</p>
              {confirmedPatients.length === 0 && (
                <div className="text-sm text-blue-600 mt-4 bg-blue-50 px-4 py-3 rounded-lg">
                  ℹ️ No confirmed appointments available yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChats;