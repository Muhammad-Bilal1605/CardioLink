// frontend/src/components/Chats/DoctorChatsAgora.jsx - WITH "New Video Call" BUTTON
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, Send, MoreVertical, Search, PauseCircle, Check, AlertCircle, Wifi, WifiOff, PhoneOff, VideoOff, Volume2, MicOff, Minimize2 } from 'lucide-react';
import { io } from 'socket.io-client';
import AgoraRTC from 'agora-rtc-sdk-ng';
import NewVideocallComponent from './NewVideocallComponent';

// Agora Configuration
const AGORA_APP_ID = '88a403916325401a8e5f04beff756692';

const DOCTOR_PROFILE = {
  id: 'doctor_001',
  name: "Dr. Sarah Williams",
  email: "dr.williams@medconnect.com",
  specialization: "General Medicine",
  avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
};

const DoctorChatsAgora = () => {
  const [socket, setSocket] = useState(null);
  const [currentChat, setCurrentChat] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [connectionError, setConnectionError] = useState(null);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Agora Call States
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [showVideoCall, setShowVideoCall] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  const callDurationIntervalRef = useRef(null);
  
  // Agora Refs
  const agoraClientRef = useRef(null);
  const localAudioTrackRef = useRef(null);
  const localVideoTrackRef = useRef(null);

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/patients');
        if (!response.ok) throw new Error('Failed to fetch patients');
        
        const data = await response.json();
        const formattedPatients = data.data.map(patient => ({
          id: patient._id,
          name: patient.firstName ? `${patient.firstName} ${patient.lastName || ''}`.trim() : patient.name,
          email: patient.email,
          phoneNumber: patient.phoneNumber,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(patient.firstName || patient.name || 'P')}&background=random`,
          lastMessage: "No messages yet",
          timestamp: new Date(patient.updatedAt || patient.createdAt).toLocaleDateString(),
          unread: 0,
          status: "offline"
        }));
        
        setPatients(formattedPatients);
      } catch (err) {
        console.error('Error fetching patients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // Initialize Agora Client
  useEffect(() => {
    const initAgoraClient = async () => {
      try {
        const client = AgoraRTC.createClient({ 
          mode: 'rtc', 
          codec: 'vp8' 
        });

        client.on('user-published', async (user, mediaType) => {
          console.log('User published:', user.uid, mediaType);
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            setRemoteUsers(prev => {
              const exists = prev.find(u => u.uid === user.uid);
              if (!exists) {
                return [...prev, user];
              }
              return prev;
            });
            
            setTimeout(() => {
              const remoteContainer = document.getElementById(`remote-video-${user.uid}`);
              if (remoteContainer && user.videoTrack) {
                user.videoTrack.play(remoteContainer);
              }
            }, 100);
          }
          
          if (mediaType === 'audio' && user.audioTrack) {
            user.audioTrack.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished:', user.uid, mediaType);
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          }
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          if (remoteUsers.length === 0) {
            endCall();
          }
        });

        agoraClientRef.current = client;
        console.log('Agora client initialized');
      } catch (error) {
        console.error('Failed to initialize Agora:', error);
      }
    };

    initAgoraClient();

    return () => {
      if (agoraClientRef.current) {
        agoraClientRef.current.leave();
      }
    };
  }, []);

  // Socket.IO Connection
  useEffect(() => {
    console.log('Initializing socket connection...');
    
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionError(null);
      
      newSocket.emit('authenticate', {
        userId: DOCTOR_PROFILE.id,
        userType: 'doctor',
        name: DOCTOR_PROFILE.name,
        avatar: DOCTOR_PROFILE.avatar,
        email: DOCTOR_PROFILE.email,
        specialization: DOCTOR_PROFILE.specialization
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
      if (isInCall) endCall();
    });

    newSocket.on('call_request', handleIncomingCall);
    newSocket.on('call_accepted', handleCallAccepted);
    newSocket.on('call_rejected', handleCallRejected);
    newSocket.on('call_ended', handleCallEnded);

    newSocket.on('new_message', (messageData) => {
      console.log('New message:', messageData);
      const patientId = messageData.senderType === 'doctor' ? messageData.patientId : messageData.senderId;
      
      setMessages(prev => {
        const newMessages = { ...prev };
        if (!newMessages[patientId]) newMessages[patientId] = [];
        
        const messageExists = newMessages[patientId].some(msg => 
          msg.id === messageData.id || msg.timestamp === messageData.timestamp
        );
        
        if (!messageExists) {
          newMessages[patientId] = [...newMessages[patientId], messageData];
        }
        
        return newMessages;
      });
    });

    newSocket.on('room_joined', (data) => {
      console.log('Room joined:', data);
      setCurrentRoom(data.roomId);
      
      if (data.messages && data.messages.length > 0) {
        const patientId = data.patientId || currentChat?.id;
        if (patientId) {
          setMessages(prev => ({
            ...prev,
            [patientId]: data.messages
          }));
        }
      }
    });

    newSocket.on('user_typing', (data) => {
      if (data.userType === 'patient') {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    });

    newSocket.on('user_stop_typing', (data) => {
      if (data.userType === 'patient') {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    return () => {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
      cleanupAgoraResources();
      newSocket.disconnect();
    };
  }, []);

  const handleIncomingCall = (data) => {
    console.log('Incoming call:', data);
    setIsCallIncoming(true);
    setIncomingCallData(data);
    setCallStatus('ringing');
  };

  const handleCallAccepted = async (data) => {
    console.log('Call accepted:', data);
    setCallStatus('connecting');
    setIsCallIncoming(false);
    
    try {
      await joinAgoraChannel(data.roomId, data.callType);
      setCallStatus('connected');
      startCallTimer();
    } catch (error) {
      console.error('Error joining channel:', error);
      endCall();
    }
  };

  const handleCallRejected = (data) => {
    console.log('Call rejected:', data);
    setCallStatus('ended');
    cleanupCall();
  };

  const handleCallEnded = (data) => {
    console.log('Call ended:', data);
    setCallStatus('ended');
    endCall();
  };

  const joinAgoraChannel = async (channelName, type) => {
    try {
      const client = agoraClientRef.current;
      if (!client) throw new Error('Agora client not initialized');

      const uid = DOCTOR_PROFILE.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 1000000;

      await client.join(AGORA_APP_ID, channelName, null, uid);
      console.log('Joined Agora channel:', channelName);

      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      localAudioTrackRef.current = audioTrack;

      if (type === 'video') {
        const videoTrack = await AgoraRTC.createCameraVideoTrack();
        localVideoTrackRef.current = videoTrack;
        
        setTimeout(() => {
          const localContainer = document.getElementById('local-video');
          if (localContainer && videoTrack) {
            videoTrack.play(localContainer);
          }
        }, 100);
        
        await client.publish([audioTrack, videoTrack]);
      } else {
        await client.publish([audioTrack]);
      }

      setIsInCall(true);
      console.log('Local tracks published');
    } catch (error) {
      console.error('Failed to join Agora channel:', error);
      throw error;
    }
  };

  const initiateCall = async (type) => {
    if (!currentChat || !socket || !isAuthenticated) {
      console.warn('Cannot initiate call');
      return;
    }

    console.log(`Initiating ${type} call to:`, currentChat.name);
    
    setIsInCall(true);
    setCallType(type);
    setCallStatus('calling');
    
    const channelId = `call_${[DOCTOR_PROFILE.id, currentChat.id].sort().join('_')}`;
    
    socket.emit('call_request', {
      callerId: DOCTOR_PROFILE.id,
      calleeId: currentChat.id,
      callerName: DOCTOR_PROFILE.name,
      callerAvatar: DOCTOR_PROFILE.avatar,
      callType: type,
      roomId: channelId,
    });

    setTimeout(() => {
      if (callStatus === 'calling') {
        console.log('Call timeout');
        setCallStatus('timeout');
        cleanupCall();
      }
    }, 30000);
  };

  const acceptCall = async () => {
    if (!incomingCallData) return;
    
    console.log('Accepting call');
    setIsCallIncoming(false);
    setIsInCall(true);
    setCallType(incomingCallData.callType);
    setCallStatus('connecting');
    
    socket.emit('call_accepted', {
      callerId: incomingCallData.callerId,
      calleeId: DOCTOR_PROFILE.id,
      callType: incomingCallData.callType,
      roomId: incomingCallData.roomId,
    });

    try {
      await joinAgoraChannel(incomingCallData.roomId, incomingCallData.callType);
      setCallStatus('connected');
      startCallTimer();
    } catch (error) {
      console.error('Error accepting call:', error);
      endCall();
    }
  };

  const rejectCall = () => {
    if (!incomingCallData) return;
    
    console.log('Rejecting call');
    setIsCallIncoming(false);
    
    socket.emit('call_rejected', {
      callerId: incomingCallData.callerId,
      calleeId: DOCTOR_PROFILE.id,
      roomId: incomingCallData.roomId,
    });
    
    setIncomingCallData(null);
    setCallStatus('idle');
  };

  const endCall = async () => {
    console.log('Ending call');
    
    if (socket && isInCall) {
      socket.emit('call_ended', {
        callerId: DOCTOR_PROFILE.id,
        calleeId: currentChat?.id || incomingCallData?.callerId,
        roomId: agoraClientRef.current?.channelName,
      });
    }
    
    await cleanupAgoraResources();
    cleanupCall();
  };

  const cleanupAgoraResources = async () => {
    try {
      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
        localAudioTrackRef.current = null;
      }

      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
        localVideoTrackRef.current = null;
      }

      if (agoraClientRef.current && agoraClientRef.current.channelName) {
        await agoraClientRef.current.leave();
      }

      setRemoteUsers([]);
      console.log('Agora resources cleaned');
    } catch (error) {
      console.error('Error cleaning Agora resources:', error);
    }
  };

  const cleanupCall = () => {
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }
    
    setIsInCall(false);
    setCallType(null);
    setIsCallIncoming(false);
    setIncomingCallData(null);
    setCallStatus('idle');
    setCallDuration(0);
    setIsMuted(false);
    setIsVideoEnabled(true);
  };

  const startCallTimer = () => {
    setCallDuration(0);
    callDurationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setEnabled(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (localVideoTrackRef.current) {
      await localVideoTrackRef.current.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectChat = (patient) => {
    setCurrentChat(patient);
    const roomId = `room_${DOCTOR_PROFILE.id}_${patient.id}`;
    setCurrentRoom(roomId);
    
    if (socket && isAuthenticated) {
      socket.emit('join_chat', {
        doctorId: DOCTOR_PROFILE.id,
        patientId: patient.id,
      });
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentChat || !socket) return;

    socket.emit('send_message', {
      doctorId: DOCTOR_PROFILE.id,
      patientId: currentChat.id,
      text: message,
      type: 'text',
    });

    setMessage('');
  };

  const filteredPatients = patients.filter(patient =>
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTime = (timestamp) => {
    if (!timestamp || timestamp === 'Just now') return timestamp || '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  const StatusIndicator = ({ status }) => {
    const colors = {
      online: 'bg-green-500',
      offline: 'bg-gray-400',
      away: 'bg-yellow-500'
    };
    return <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ${colors[status]} ring-2 ring-white`}></span>;
  };

  const IncomingCallModal = () => {
    if (!isCallIncoming || !incomingCallData) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 text-center">
          <div className="mb-4">
            <img
              src={incomingCallData.callerAvatar}
              alt={incomingCallData.callerName}
              className="w-20 h-20 rounded-full mx-auto mb-4"
            />
            <h3 className="text-lg font-semibold text-gray-900">{incomingCallData.callerName}</h3>
            <p className="text-gray-600 capitalize">Incoming {incomingCallData.callType} call</p>
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={rejectCall}
              className="bg-red-500 text-white p-4 rounded-full hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <button
              onClick={acceptCall}
              className="bg-green-500 text-white p-4 rounded-full hover:bg-green-600 transition-colors"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const CallInterface = () => {
    if (!isInCall) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
        <div className="bg-gray-800 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={currentChat?.avatar}
                alt={currentChat?.name}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold">{currentChat?.name}</h3>
                <p className="text-sm text-gray-300 capitalize">
                  {callStatus === 'connected' ? `${callType} call • ${formatCallDuration(callDuration)}` :
                   callStatus === 'calling' ? 'Calling...' :
                   callStatus === 'connecting' ? 'Connecting...' : callStatus}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 relative bg-black">
          {remoteUsers.length > 0 ? (
            <div className="w-full h-full">
              {remoteUsers.map(user => (
                <div
                  key={user.uid}
                  id={`remote-video-${user.uid}`}
                  className="w-full h-full"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl font-bold">
                  {currentChat?.name[0]}
                </div>
                <h2 className="text-2xl font-semibold mb-2">{currentChat?.name}</h2>
                <p className="text-gray-300">
                  {callStatus === 'calling' ? 'Calling...' :
                   callStatus === 'connecting' ? 'Connecting...' :
                   'Waiting to join...'}
                </p>
              </div>
            </div>
          )}

          {callType === 'video' && (
            <div
              id="local-video"
              className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden border-2 border-green-500"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}
        </div>

        <div className="bg-gray-800 p-6">
          <div className="flex justify-center gap-4">
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-full transition-colors ${
                  !isVideoEnabled ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
                }`}
              >
                {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
              </button>
            )}

            <button
              onClick={endCall}
              className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {showVideoCall ? (
        <div className="fixed inset-0 z-50 bg-white">
          <div className="p-4 bg-blue-600 flex items-center justify-between">
            <h2 className="text-white font-semibold text-lg">New Video Call</h2>
            <button
              onClick={() => setShowVideoCall(false)}
              className="text-white hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Back to Chat
            </button>
          </div>
          <NewVideocallComponent />
        </div>
      ) : null}

      <IncomingCallModal />
      <CallInterface />

      <div className="w-80 bg-white flex flex-col border-r border-gray-200 shadow-lg">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src={DOCTOR_PROFILE.avatar}
                alt={DOCTOR_PROFILE.name}
                className="w-10 h-10 rounded-full ring-2 ring-white"
              />
              <div>
                <h2 className="font-semibold text-white">{DOCTOR_PROFILE.name}</h2>
                <p className="text-blue-100 text-sm">{DOCTOR_PROFILE.specialization}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map((patient) => (
            <div
              key={patient.id}
              onClick={() => handleSelectChat(patient)}
              className={`p-4 cursor-pointer border-b border-gray-100 hover:bg-gray-50 ${
                currentChat?.id === patient.id ? 'bg-blue-50 border-r-4 border-r-blue-500' : ''
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={patient.avatar} alt={patient.name} className="w-12 h-12 rounded-full" />
                  <StatusIndicator status={patient.status} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate">{patient.name}</h3>
                    <span className="text-xs text-gray-500">{formatTime(patient.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">{patient.lastMessage}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={currentChat.avatar} alt={currentChat.name} className="w-12 h-12 rounded-full" />
                  <div>
                    <h3 className="font-semibold text-gray-900">{currentChat.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">{currentChat.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => initiateCall('audio')}
                    disabled={!isAuthenticated || isInCall}
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50"
                  >
                    <Phone className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => initiateCall('video')}
                    disabled={!isAuthenticated || isInCall}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowVideoCall(true)}
                    className="px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-md font-medium"
                  >
                    New Video Call
                  </button>
                </div>
              </div>
            </div>

            <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentRoom && messages[currentChat.id]?.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.senderId === DOCTOR_PROFILE.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === DOCTOR_PROFILE.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                }`}>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                placeholder="Type your message..."
                className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500"
                rows="1"
                disabled={!isAuthenticated || isInCall}
              />
              <button
                onClick={handleSendMessage}
                disabled={!message.trim() || !isAuthenticated || isInCall}
                className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Search className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Select a Patient</h3>
            <p className="text-gray-600">Choose a patient to start chatting</p>
          </div>
        </div>
      )}
    </div>
  </div>
);
};

export default DoctorChatsAgora;