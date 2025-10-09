//c:CardioLink/frontend/src/components/Chats/DoctorChats.jsx (Mern Stack)
import React, { useState, useEffect, useRef } from 'react';
import { Phone, Video, Mic, Send, MoreVertical, Search, PauseCircle, Check, AlertCircle, Wifi, WifiOff, PhoneOff, VideoOff, Volume2, MicOff, User, MessageCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import NewVideocallComponent from './NewVideocallComponent';

const DOCTOR_PROFILE = {
  id: 'doctor_001',
  name: "Dr. Bilal",
  email: "Zaheermbilal@gmail.com",
  specialization: "General Medicine",
  avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
};

// ICE servers configuration for WebRTC
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

const DoctorChats = () => {
  // ALL YOUR EXISTING STATE AND LOGIC REMAINS EXACTLY THE SAME
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
  const [onlinePatients, setOnlinePatients] = useState(new Set());
  const [connectionError, setConnectionError] = useState(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // WebRTC Call States
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState(null);
  const [isCallIncoming, setIsCallIncoming] = useState(false);
  const [incomingCallData, setIncomingCallData] = useState(null);
  const [callStatus, setCallStatus] = useState('idle');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callStartTime, setCallStartTime] = useState(null);
  const [callDuration, setCallDuration] = useState(0);

  // New State for Video Call Component
  const [showVideoCallComponent, setShowVideoCallComponent] = useState(false);

  // Refs
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const socketRef = useRef(null);
  
  // WebRTC Refs
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const callDurationIntervalRef = useRef(null);

  // KEEP ALL YOUR EXISTING useEffect HOOKS AND FUNCTIONS EXACTLY AS THEY ARE
  // Fetch patients from backend
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('http://localhost:5000/api/patients');
        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }
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
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  // ALL YOUR EXISTING SOCKET.IO LOGIC REMAINS THE SAME
  useEffect(() => {
    console.log('🔌 Doctor initializing socket connection...');
    
    const newSocket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      autoConnect: true,
      forceNew: false,
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events - KEEP ALL YOUR EXISTING SOCKET EVENT HANDLERS
    newSocket.on('connect', () => {
      console.log('✅ Doctor socket connected:', newSocket.id);
      setIsConnected(true);
      setConnectionStatus('connected');
      setConnectionError(null);
      setReconnectAttempts(0);
      
      console.log('🔐 Doctor authenticating user...');
      newSocket.emit('authenticate', {
        userId: DOCTOR_PROFILE.id,
        userType: 'doctor',
        name: DOCTOR_PROFILE.name,
        avatar: DOCTOR_PROFILE.avatar,
        email: DOCTOR_PROFILE.email,
        specialization: DOCTOR_PROFILE.specialization
      });
    });

    // ... KEEP ALL YOUR EXISTING SOCKET EVENT LISTENERS EXACTLY AS THEY ARE ...
    newSocket.on('connected', (data) => {
      console.log('🔌 Doctor connection confirmed:', data);
    });

    newSocket.on('authenticated', (data) => {
      console.log('✅ Doctor authentication successful:', data);
      setIsAuthenticated(true);
      setConnectionStatus('authenticated');
    });

    newSocket.on('auth_error', (error) => {
      console.error('❌ Doctor authentication failed:', error);
      setConnectionError(`Authentication failed: ${error.message}`);
      setIsAuthenticated(false);
      setConnectionStatus('auth_error');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Doctor socket disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionStatus('disconnected');
      setCurrentRoom(null);
      setConnectionError(`Connection lost: ${reason}. Attempting to reconnect...`);
      
      if (isInCall) {
        endCall();
      }
      
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      setReconnectAttempts(prev => prev + 1);
      
      if (reconnectAttempts < 5) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('🔄 Doctor attempting to reconnect...');
          newSocket.connect();
        }, delay);
      }
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Doctor connection error:', error);
      setConnectionError(`Connection failed: ${error.message}`);
      setIsConnected(false);
      setIsAuthenticated(false);
      setConnectionStatus('error');
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Doctor reconnected after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      setReconnectAttempts(0);
    });

    // Message events
    newSocket.on('new_message', (messageData) => {
      console.log('📨 Doctor received new message:', messageData);
      const patientId = messageData.senderType === 'doctor' ? messageData.patientId : messageData.senderId;
      
      setMessages(prev => {
        const newMessages = { ...prev };
        if (!newMessages[patientId]) newMessages[patientId] = [];
        
        const messageExists = newMessages[patientId].some(msg => 
          msg.id === messageData.id || 
          (msg.timestamp === messageData.timestamp && msg.text === messageData.text)
        );
        
        if (!messageExists) {
          newMessages[patientId] = [...newMessages[patientId], messageData];
        }
        
        return newMessages;
      });

      if (messageData.senderType === 'patient') {
        setPatients(prev => 
          prev.map(p => {
            if (p.id === patientId) {
              return {
                ...p,
                lastMessage: messageData.text || `${messageData.type} message`,
                timestamp: 'Just now',
                unread: currentChat?.id === patientId ? 0 : (p.unread || 0) + 1
              };
            }
            return p;
          })
        );
      }
    });

    newSocket.on('message_sent', (data) => {
      console.log('✅ Doctor message sent confirmation:', data);
    });

    newSocket.on('room_joined', (data) => {
      console.log('🏠 Doctor room joined:', data);
      setCurrentRoom(data.roomId);
      
      if (data.messages && data.messages.length > 0) {
        const patientId = data.patientId || (currentChat && currentChat.id);
        if (patientId) {
          setMessages(prev => ({
            ...prev,
            [patientId]: data.messages
          }));
        }
      } else if (currentChat) {
        setMessages(prev => ({
          ...prev,
          [currentChat.id]: []
        }));
      }
    });

    // Status events
    newSocket.on('user_status_change', (data) => {
      console.log('👤 Doctor received user status change:', data);
      if (data.userType === 'patient') {
        setPatients(prev => 
          prev.map(p => {
            if (p.id === data.userId) {
              return { ...p, status: data.status };
            }
            return p;
          })
        );
        
        if (data.status === 'online') {
          setOnlinePatients(prev => new Set([...prev, data.userId]));
        } else {
          setOnlinePatients(prev => {
            const newSet = new Set(prev);
            newSet.delete(data.userId);
            return newSet;
          });
        }
      }
    });

    newSocket.on('user_typing', (data) => {
      console.log('⌨️ Doctor received user typing:', data);
      if (data.userType === 'patient') {
        setTypingUsers(prev => new Set([...prev, data.userId]));
      }
    });

    newSocket.on('user_stop_typing', (data) => {
      console.log('⌨️ Doctor received user stopped typing:', data);
      if (data.userType === 'patient') {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
    });

    // WebRTC Call Events - KEEP ALL YOUR EXISTING WEBRTC HANDLERS
    newSocket.on('call_request', handleIncomingCall);
    newSocket.on('call_accepted', handleCallAccepted);
    newSocket.on('call_rejected', handleCallRejected);
    newSocket.on('call_ended', handleCallEnded);
    newSocket.on('webrtc_offer', handleWebRTCOffer);
    newSocket.on('webrtc_answer', handleWebRTCAnswer);
    newSocket.on('webrtc_ice_candidate', handleWebRTCIceCandidate);
    newSocket.on('call_timeout', handleCallTimeout);

    // Room management events
    newSocket.on('user_joined_room', (data) => {
      console.log('🏠 User joined room:', data);
    });

    newSocket.on('user_left_room', (data) => {
      console.log('🚪 User left room:', data);
    });

    // Error events
    newSocket.on('error', (error) => {
      console.error('🚨 Doctor socket error:', error);
      setConnectionError(error.message || 'Unknown error occurred');
    });

    newSocket.on('force_disconnect', (data) => {
      console.log('🔌 Doctor force disconnect:', data);
      setConnectionError(data.reason || 'Disconnected by server');
    });

    // Ping/Pong for connection health
    newSocket.on('pong', (data) => {
      console.log('🏓 Pong received:', data);
    });

    return () => {
      console.log('🧹 Doctor cleaning up socket connection...');
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (callDurationIntervalRef.current) clearInterval(callDurationIntervalRef.current);
      
      cleanupWebRTC();
      
      newSocket.disconnect();
    };
  }, []);

  // KEEP ALL YOUR EXISTING WEBRTC FUNCTIONS EXACTLY THE SAME
  const handleIncomingCall = (data) => {
    console.log('📞 Incoming call from:', data.callerId);
    setIsCallIncoming(true);
    setIncomingCallData(data);
    setCallStatus('ringing');
  };

  const handleCallAccepted = async (data) => {
    console.log('✅ Call accepted by patient');
    setCallStatus('connecting');
    setIsCallIncoming(false);
    
    try {
      await initializeWebRTC(data.callType, true);
      setCallStatus('connected');
      startCallTimer();
    } catch (error) {
      console.error('❌ Error initializing WebRTC:', error);
      endCall();
    }
  };

  const handleCallRejected = (data) => {
    console.log('❌ Call rejected by patient');
    setCallStatus('ended');
    cleanupCall();
  };

  const handleCallEnded = (data) => {
    console.log('📴 Call ended by patient');
    setCallStatus('ended');
    endCall();
  };

  const handleCallTimeout = (data) => {
    console.log('⏰ Call timed out');
    setCallStatus('ended');
    cleanupCall();
  };

  const handleWebRTCOffer = async (data) => {
    console.log('📡 Received WebRTC offer');
    
    if (!peerConnectionRef.current) {
      await setupPeerConnection();
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.offer));
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('webrtc_answer', {
        answer: answer,
        callerId: data.callerId,
        calleeId: DOCTOR_PROFILE.id
      });
    } catch (error) {
      console.error('❌ Error handling WebRTC offer:', error);
    }
  };

  const handleWebRTCAnswer = async (data) => {
    console.log('📡 Received WebRTC answer');
    
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (error) {
      console.error('❌ Error handling WebRTC answer:', error);
    }
  };

  const handleWebRTCIceCandidate = async (data) => {
    console.log('🧊 Received ICE candidate');
    
    if (peerConnectionRef.current && data.candidate) {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch (error) {
        console.error('❌ Error adding ICE candidate:', error);
      }
    }
  };

  // KEEP ALL YOUR EXISTING WEBRTC SETUP FUNCTIONS
  const setupPeerConnection = async () => {
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_ice_candidate', {
          candidate: event.candidate,
          callerId: DOCTOR_PROFILE.id,
          calleeId: currentChat.id
        });
      }
    };

    peerConnection.ontrack = (event) => {
      console.log('📹 Received remote stream');
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'connected') {
        setCallStatus('connected');
        startCallTimer();
      } else if (peerConnection.connectionState === 'disconnected' || 
                 peerConnection.connectionState === 'failed') {
        endCall();
      }
    };

    return peerConnection;
  };

  const initializeWebRTC = async (type, isInitiator = false) => {
    try {
      const constraints = {
        audio: true,
        video: type === 'video'
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      const peerConnection = await setupPeerConnection();
      
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      if (isInitiator) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socket.emit('webrtc_offer', {
          offer: offer,
          callerId: DOCTOR_PROFILE.id,
          calleeId: currentChat.id
        });
      }

    } catch (error) {
      console.error('❌ Error initializing WebRTC:', error);
      throw error;
    }
  };

  // KEEP ALL YOUR EXISTING CALL FUNCTIONS
  const initiateCall = async (type) => {
    if (!currentChat || !socket || !socket.connected || !isAuthenticated) {
      console.warn('⚠️ Cannot initiate call: missing requirements');
      return;
    }

    console.log(`📞 Doctor initiating ${type} call to:`, currentChat.name);
    
    setIsInCall(true);
    setCallType(type);
    setCallStatus('calling');
    
    socket.emit('call_request', {
      callerId: DOCTOR_PROFILE.id,
      calleeId: currentChat.id,
      callerName: DOCTOR_PROFILE.name,
      callerAvatar: DOCTOR_PROFILE.avatar,
      callType: type,
      roomId: currentRoom
    });

    setTimeout(() => {
      if (callStatus === 'calling') {
        console.log('⏰ Call request timed out');
        setCallStatus('timeout');
        cleanupCall();
      }
    }, 30000);
  };

  const acceptCall = async () => {
    if (!incomingCallData) return;
    
    console.log('✅ Doctor accepting call');
    setIsCallIncoming(false);
    setIsInCall(true);
    setCallType(incomingCallData.callType);
    setCallStatus('connecting');
    
    socket.emit('call_accepted', {
      callerId: incomingCallData.callerId,
      calleeId: DOCTOR_PROFILE.id,
      callType: incomingCallData.callType
    });

    try {
      await initializeWebRTC(incomingCallData.callType, false);
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      endCall();
    }
  };

  const rejectCall = () => {
    if (!incomingCallData) return;
    
    console.log('❌ Doctor rejecting call');
    setIsCallIncoming(false);
    
    socket.emit('call_rejected', {
      callerId: incomingCallData.callerId,
      calleeId: DOCTOR_PROFILE.id
    });
    
    setIncomingCallData(null);
    setCallStatus('idle');
  };

  const endCall = () => {
    console.log('📴 Doctor ending call');
    
    if (socket && (isInCall || isCallIncoming)) {
      socket.emit('call_ended', {
        callerId: DOCTOR_PROFILE.id,
        calleeId: currentChat?.id || incomingCallData?.callerId
      });
    }
    
    cleanupCall();
  };

  const cleanupCall = () => {
    console.log('🧹 Cleaning up call');
    
    if (callDurationIntervalRef.current) {
      clearInterval(callDurationIntervalRef.current);
      callDurationIntervalRef.current = null;
    }
    
    setIsInCall(false);
    setCallType(null);
    setIsCallIncoming(false);
    setIncomingCallData(null);
    setCallStatus('idle');
    setCallStartTime(null);
    setCallDuration(0);
    
    cleanupWebRTC();
  };

  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    remoteStreamRef.current = null;
  };

  const startCallTimer = () => {
    setCallStartTime(Date.now());
    setCallDuration(0);
    
    callDurationIntervalRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // --- NEW VIDEO CALL COMPONENT HANDLER ---
  const handleNewVideoCall = () => {
    if (!currentChat) {
      alert('Please select a patient first to start teleconsultation');
      return;
    }
    setShowVideoCallComponent(true);
  };

  const handleCloseVideoCall = () => {
    setShowVideoCallComponent(false);
  };

  // --- AUTO SCROLL ON MESSAGE ---
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentChat]);

  // --- MESSAGE HANDLING - KEEP ALL YOUR EXISTING LOGIC ---
  const getRoomId = (patientId) => {
    const ids = [DOCTOR_PROFILE.id, patientId].sort();
    return `room_${ids.join('_')}`;
  };

  const fetchMessages = async (roomId) => {
    if (!roomId) {
      console.error('No roomId provided to fetchMessages');
      return;
    }
    
    try {
      console.log('🔍 Fetching messages for room:', roomId);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/messages/conversation/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Failed to fetch messages: ${response.status} - ${errorText}`);
        throw new Error(`Failed to fetch messages: ${response.statusText}`);
      }

      const data = await response.json();
      
      setMessages(prev => ({
        ...prev,
        [roomId]: Array.isArray(data.messages) ? data.messages : (data || [])
      }));
    } catch (error) {
      console.error('❌ Error in fetchMessages:', error);
      setError(error.message);
    }
  };

  const handleSelectChat = (patient) => {
    console.log('Selecting chat with patient:', patient);
    setCurrentChat(patient);
    const roomId = getRoomId(patient.id);
    console.log('Generated roomId:', roomId);
    setCurrentRoom(roomId);
    
    if (socket) {
      console.log('Joining room from handleSelectChat:', roomId);
      socket.emit('join_room', { 
        roomId, 
        userId: DOCTOR_PROFILE.id,
        userType: 'doctor'
      }, (response) => {
        console.log('Join room response:', response);
        if (response?.success) {
          fetchMessages(roomId);
        } else {
          console.error('Failed to join room:', response?.error);
        }
      });
    } else {
      console.error('Socket not available when selecting chat');
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !currentChat || !currentRoom) {
      console.log('Cannot send message - missing data');
      return;
    }

    const messageData = {
      roomId: currentRoom,
      doctorId: DOCTOR_PROFILE.id,
      patientId: currentChat.id,
      text: message,
      type: 'text',
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', messageData);

    if (socket) {
      socket.emit('send_message', messageData, (acknowledgement) => {
        console.log('Message sent - server acknowledgement:', acknowledgement);
        
        if (acknowledgement?.success) {
          setMessages(prev => {
            const updated = { ...prev };
            if (updated[currentRoom]) {
              updated[currentRoom] = updated[currentRoom].map(msg => 
                msg._id === `temp-${acknowledgement.timestamp}`
                  ? { ...msg, status: 'delivered', _id: acknowledgement.messageId }
                  : msg
              );
            }
            return updated;
          });
        }
      });
    }

    const tempId = `temp-${Date.now()}`;
    setMessages(prev => ({
      ...prev,
      [currentRoom]: [
        ...(prev[currentRoom] || []), 
        {
          ...messageData,
          _id: tempId,
          senderId: DOCTOR_PROFILE.id,
          status: 'sending',
          createdAt: new Date().toISOString(),
          senderType: 'doctor'
        }
      ]
    }));

    setMessage('');
    setTimeout(() => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }, 100);
  };

  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      console.log('✅ Socket connected:', socket.id);
      setIsConnected(true);
      
      if (currentRoom) {
        console.log('Rejoining room after reconnect:', currentRoom);
        socket.emit('join_room', { 
          roomId: currentRoom,
          userId: DOCTOR_PROFILE.id,
          userType: 'doctor'
        });
      }
    };

    const onDisconnect = () => {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    };

    const onNewMessage = (message) => {
      console.log('📩 New message received:', message);
      
      setMessages(prev => ({
        ...prev,
        [message.roomId]: [...(prev[message.roomId] || []), message]
      }));

      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('receive_message', onNewMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('receive_message', onNewMessage);
    };
  }, [socket, currentRoom]);

  // --- HANDLE TYPING INDICATOR ---
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTyping = () => {
    if (!currentChat || !socket || !socket.connected || !isAuthenticated) return;
    
    socket.emit('typing', {
      doctorId: DOCTOR_PROFILE.id,
      patientId: currentChat.id,
      roomId: currentRoom
    });
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        doctorId: DOCTOR_PROFILE.id,
        patientId: currentChat.id,
        roomId: currentRoom
      });
    }, 2000);
  };

  // --- AUDIO RECORDING ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        if (socket && socket.connected && isAuthenticated && currentChat) {
          socket.emit('send_message', {
            doctorId: DOCTOR_PROFILE.id,
            patientId: currentChat.id,
            type: 'audio',
            audioUrl,
            roomId: currentRoom
          });
        }
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      console.log('🎤 Recording started');
    } catch (err) {
      console.error('❌ Microphone access error:', err);
      setConnectionError("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log('🎤 Recording stopped');
    }
  };

  // --- FILTER PATIENTS ---
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- FORMAT TIMESTAMP ---
  const formatTime = (timestamp) => {
    if (!timestamp || timestamp === 'Just now') return timestamp || '';
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return timestamp;
    }
  };

  // --- STATUS INDICATOR ---
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

  // --- CONNECTION STATUS ---
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

  // --- HANDLE CONNECTION RETRY ---
  const handleRetryConnection = () => {
    if (socket && !socket.connected) {
      console.log('🔄 Manual reconnection attempt...');
      setConnectionError(null);
      socket.connect();
    }
  };

  // --- INCOMING CALL MODAL ---
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

  // --- CALL INTERFACE ---
  const CallInterface = () => {
    if (!isInCall) return null;

    return (
      <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
        {/* Call Header */}
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

        {/* Video Area */}
        <div className="flex-1 relative">
          {callType === 'video' ? (
            <>
              {/* Remote Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              
              {/* Local Video */}
              <div className="absolute top-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>
            </>
          ) : (
            /* Audio Call UI */
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <img 
                  src={currentChat?.avatar} 
                  alt={currentChat?.name}
                  className="w-32 h-32 rounded-full mx-auto mb-4"
                />
                <h2 className="text-2xl font-semibold mb-2">{currentChat?.name}</h2>
                <p className="text-gray-300">
                  {callStatus === 'connected' ? formatCallDuration(callDuration) : 
                   callStatus === 'calling' ? 'Calling...' :
                   callStatus === 'connecting' ? 'Connecting...' : callStatus}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Call Controls */}
        <div className="bg-gray-800 p-6">
          <div className="flex justify-center gap-4">
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted ? 'bg-red-500 text-white' : 'bg-gray-600 text-white hover:bg-gray-500'
              }`}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Toggle (only for video calls) */}
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

            {/* Volume Button */}
            <button className="p-4 bg-gray-600 text-white rounded-full hover:bg-gray-500 transition-colors">
              <Volume2 className="w-6 h-6" />
            </button>

            {/* End Call Button */}
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

  // If showing video call component, render it instead of the chat interface
  if (showVideoCallComponent) {
    return (
      <NewVideocallComponent 
        patient={currentChat}
        doctor={DOCTOR_PROFILE}
        onClose={handleCloseVideoCall}
      />
    );
  }

  // ONLY UI IMPROVEMENTS BELOW - ALL LOGIC REMAINS THE SAME
  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Incoming Call Modal */}
      <IncomingCallModal />
      
      {/* Call Interface */}
      <CallInterface />

      {/* --- PATIENTS SIDEBAR --- */}
      <div className="w-80 bg-white flex flex-col border-r border-gray-200 shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={DOCTOR_PROFILE.avatar} 
                  alt={DOCTOR_PROFILE.name}
                  className="w-12 h-12 rounded-full object-cover ring-3 ring-white shadow-lg"
                />
                <StatusIndicator status="online" />
              </div>
              <div>
                <h2 className="font-bold text-white text-lg">{DOCTOR_PROFILE.name}</h2>
                <p className="text-blue-100 text-sm">{DOCTOR_PROFILE.specialization}</p>
              </div>
            </div>
            <ConnectionStatus />
          </div>
        </div>
        
        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-white">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            />
          </div>
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
        
        {/* Patients List */}
        <div className="flex-1 overflow-y-auto">
          {filteredPatients.map((patient) => (
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
                    <span className="text-xs text-gray-500">{formatTime(patient.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-600 truncate mt-1">{patient.lastMessage}</p>
                  {typingUsers.has(patient.id) && (
                    <p className="text-xs text-blue-600 italic mt-1 animate-pulse">Typing...</p>
                  )}
                </div>
                {patient.unread > 0 && (
                  <div className="bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-md">
                    {patient.unread}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* --- CHAT AREA --- */}
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <>
            {/* Chat Header */}
            <div className="p-6 border-b border-gray-200 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img 
                      src={currentChat.avatar} 
                      alt={currentChat.name}
                      className="w-12 h-12 rounded-full object-cover ring-3 ring-blue-100 shadow-md"
                    />
                    <StatusIndicator status={currentChat.status} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{currentChat.name}</h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {currentChat.status === 'online' ? '🟢 Online' : '⚫ Offline'}
                      {currentRoom && ` • Room: ${currentRoom.split('_').pop()}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => initiateCall('audio')}
                    disabled={!isConnected || !isAuthenticated || isInCall}
                    className="p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Phone className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={() => initiateCall('video')}
                    disabled={!isConnected || !isAuthenticated || isInCall}
                    className="p-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  >
                    <Video className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleNewVideoCall}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Teleconsultation
                  </button>
                  <button className="p-3 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-xl transition-all duration-200 shadow-sm">
                    <MoreVertical className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Messages */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-white to-blue-50"
            >
              {currentRoom && messages[currentRoom]?.length > 0 ? (
                messages[currentRoom].map((msg) => (
                  <div 
                    key={msg._id || msg.timestamp}
                    className={`flex ${msg.senderId === DOCTOR_PROFILE.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        msg.senderId === DOCTOR_PROFILE.id 
                          ? 'bg-blue-500 text-white rounded-br-none' 
                          : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
                      } transition-all duration-200 hover:shadow-md`}
                    >
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs opacity-70 text-right mt-2">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {msg.status === 'sent' && <Check className="inline ml-1 h-3 w-3" />}
                        {msg.status === 'delivered' && <Check className="inline ml-1 h-3 w-3" />}
                        {msg.status === 'read' && <Check className="inline ml-1 h-3 w-3 text-blue-300" />}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-lg font-medium">No messages yet</p>
                    <p className="text-sm">Start the conversation with {currentChat.name}!</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Message Input */}
            <div className="p-6 border-t border-gray-200 bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <textarea
                    value={message}
                    onChange={(e) => {
                      setMessage(e.target.value);
                      handleTyping();
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder={isAuthenticated ? "Type your message..." : "Connecting..."}
                    className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                    rows="1"
                    style={{ minHeight: '52px', maxHeight: '120px' }}
                    disabled={!isConnected || !isAuthenticated || isInCall}
                  />
                </div>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={!isConnected || !isAuthenticated || isInCall}
                  className={`p-4 rounded-xl transition-all duration-200 disabled:opacity-50 shadow-sm ${
                    isRecording 
                      ? 'bg-red-500 text-white hover:bg-red-600' 
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {isRecording ? <PauseCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || !isConnected || !isAuthenticated || isInCall}
                  className="p-4 bg-blue-500 text-white rounded-xl hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              
              {/* Status info */}
              <div className="mt-3 text-xs text-gray-500 text-center">
                {!isConnected ? '🔴 Connecting to server...' : 
                 !isAuthenticated ? '🟡 Authenticating...' : 
                 isInCall ? `📞 In ${callType} call with ${currentChat.name}` :
                 currentChat ? `🟢 Chatting with ${currentChat.name}${currentRoom ? ` in ${currentRoom}` : ''}` : 'Select a patient to start chatting'}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center p-8 bg-white rounded-2xl shadow-xl max-w-md mx-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <User className="w-12 h-12 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Select a Patient</h3>
              <p className="text-gray-600 mb-6">Choose a patient from the sidebar to start consultation and messaging</p>
              {!isConnected && (
                <div className="space-y-3">
                  <p className="text-red-600 text-sm font-medium">⚠️ Not connected to server</p>
                  <button
                    onClick={handleRetryConnection}
                    className="bg-blue-500 text-white px-6 py-3 rounded-xl hover:bg-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Retry Connection
                  </button>
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