import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from "../../store/authStore";
import { Phone, Video, Mic, Send, MoreVertical, Search, X, PauseCircle, User } from 'lucide-react';
import io from 'socket.io-client';

// Initialize socket connection
const socket = io('http://localhost:5000'); // Replace with your actual server URL

const DoctorChats = () => {
  const { auth } = useAuthStore();
  const [currentChat, setCurrentChat] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState({});
  const [isRecording, setIsRecording] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const chatContainerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Dummy patients data (in a real app, this would come from your backend)
  const [patients, setPatients] = useState([
    {
      id: 1,
      name: "Sarah Johnson",
      avatar: "/api/placeholder/50/50",
      lastMessage: "I'll send you my latest vitals",
      timestamp: "09:45 AM",
      unread: 2,
      status: "online"
    },
    {
      id: 2,
      name: "Michael Chen",
      avatar: "/api/placeholder/50/50", 
      lastMessage: "Thank you for the prescription",
      timestamp: "Yesterday",
      unread: 0,
      status: "offline"
    },
    {
      id: 3,
      name: "Lisa Rodriguez",
      avatar: "/api/placeholder/50/50",
      lastMessage: "When should I schedule my follow-up?",
      timestamp: "Yesterday",
      unread: 1,
      status: "online"
    },
    {
      id: 4,
      name: "Robert Kim",
      avatar: "/api/placeholder/50/50",
      lastMessage: "My fever has reduced",
      timestamp: "Monday",
      unread: 0,
      status: "offline"
    },
    {
      id: 5,
      name: "Emma Thompson",
      avatar: "/api/placeholder/50/50",
      lastMessage: "Is this medication correct?",
      timestamp: "Sunday",
      unread: 0,
      status: "away"
    }
  ]);

  // Dummy message history
  useEffect(() => {
    const initialMessages = {};
    patients.forEach(patient => {
      initialMessages[patient.id] = [
        {
          id: `${patient.id}-1`,
          sender: patient.id,
          text: patient.lastMessage,
          timestamp: patient.timestamp,
          type: 'text'
        },
        {
          id: `${patient.id}-2`,
          sender: 'doctor',
          text: "Thanks for the update. How are you feeling today?",
          timestamp: "Just now",
          type: 'text'
        }
      ];
    });
    setMessages(initialMessages);
  }, []);

  // Socket.io event listeners
  useEffect(() => {
    // Listen for incoming messages
    socket.on('receive_message', (data) => {
      setMessages(prev => {
        const patientId = data.sender;
        const newMessages = { ...prev };
        if (newMessages[patientId]) {
          newMessages[patientId] = [...newMessages[patientId], data];
        } else {
          newMessages[patientId] = [data];
        }
        return newMessages;
      });
      
      // Update the last message for the patient
      setPatients(prev => 
        prev.map(p => {
          if (p.id === data.sender) {
            return {
              ...p,
              lastMessage: data.text,
              timestamp: 'Just now',
              unread: currentChat?.id === data.sender ? 0 : (p.unread || 0) + 1
            };
          }
          return p;
        })
      );
    });

    // Listen for online status changes
    socket.on('status_change', (data) => {
      setPatients(prev => 
        prev.map(p => {
          if (p.id === data.userId) {
            return { ...p, status: data.status };
          }
          return p;
        })
      );
    });

    return () => {
      socket.off('receive_message');
      socket.off('status_change');
    };
  }, [currentChat]);

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, currentChat]);

  // Handle message sending
  const sendMessage = () => {
    if (!message.trim() || !currentChat) return;
    
    const newMessage = {
      id: `${Date.now()}`,
      sender: 'doctor',
      text: message,
      timestamp: 'Just now',
      type: 'text'
    };
    
    // Update messages state
    setMessages(prev => {
      const patientId = currentChat.id;
      const newMessages = { ...prev };
      if (newMessages[patientId]) {
        newMessages[patientId] = [...newMessages[patientId], newMessage];
      } else {
        newMessages[patientId] = [newMessage];
      }
      return newMessages;
    });
    
    // Update last message for patient
    setPatients(prev => 
      prev.map(p => {
        if (p.id === currentChat.id) {
          return {
            ...p,
            lastMessage: message,
            timestamp: 'Just now',
            unread: 0
          };
        }
        return p;
      })
    );
    
    // Send message via socket
    socket.emit('send_message', {
      sender: 'doctor',
      receiver: currentChat.id,
      text: message,
      timestamp: 'Just now',
      type: 'text'
    });
    
    setMessage('');
  };

  // Handle audio recording start
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // In a real app, you would upload this to your server
        // and then send the URL via socket.io
        
        // For this demo, we'll just use the local URL
        const newMessage = {
          id: `${Date.now()}`,
          sender: 'doctor',
          audioUrl,
          timestamp: 'Just now',
          type: 'audio'
        };
        
        setMessages(prev => {
          const patientId = currentChat.id;
          return {
            ...prev,
            [patientId]: [...(prev[patientId] || []), newMessage]
          };
        });
        
        // Update last message for patient
        setPatients(prev => 
          prev.map(p => {
            if (p.id === currentChat.id) {
              return {
                ...p,
                lastMessage: '🎤 Audio message',
                timestamp: 'Just now',
                unread: 0
              };
            }
            return p;
          })
        );
        
        // In a real app, you'd emit this with the actual URL after upload
        socket.emit('send_message', {
          sender: 'doctor',
          receiver: currentChat.id,
          audioUrl, // This would be a server URL in production
          timestamp: 'Just now',
          type: 'audio'
        });
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  // Handle audio recording stop
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  // Handle initiating calls
  const initiateCall = (type) => {
    if (!currentChat) return;
    
    // In a real application, this would trigger your WebRTC logic
    // For this demo, we'll just add a system message
    const newMessage = {
      id: `${Date.now()}`,
      sender: 'system',
      text: `${type === 'audio' ? 'Audio' : 'Video'} call initiated`,
      timestamp: 'Just now',
      type: 'system'
    };
    
    setMessages(prev => {
      const patientId = currentChat.id;
      return {
        ...prev,
        [patientId]: [...(prev[patientId] || []), newMessage]
      };
    });
    
    alert(`Initiating ${type} call with ${currentChat.name}`);
  };

  // Handle patient selection
  const selectPatient = (patient) => {
    setCurrentChat(patient);
    // Mark messages as read
    setPatients(prev => 
      prev.map(p => {
        if (p.id === patient.id) {
          return { ...p, unread: 0 };
        }
        return p;
      })
    );
  };

  // Filter patients based on search term
  const filteredPatients = patients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format message timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return timestamp;
    // In a real app, you'd use proper date formatting
  };

  // Status indicator component
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

  return (
    <div className="flex h-screen bg-gradient-to-br from-base-100 to-base-200 transition-all duration-500">
      {/* Patients sidebar */}
      <div className="w-80 bg-white flex flex-col border-r border-gray-200 shadow-lg">
        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <User size={20} />
            <span>Dr. {auth?.user?.name || 'Doctor'}</span>
          </h2>
          <p className="text-sm text-white/80">{auth?.user?.email || 'doctor@example.com'}</p>
        </div>
        
        {/* Search box */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search patients..."
              className="input w-full pl-10 bg-gray-50 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 hover:scale-110 transition-transform duration-300"
              >
                <X size={16} className="text-gray-400" />
              </button>
            )}
          </div>
        </div>
        
        {/* Patients list */}
        <div className="overflow-y-auto flex-1">
          {filteredPatients.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No patients found
            </div>
          ) : (
            filteredPatients.map(patient => (
              <div
                key={patient.id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-300 hover:bg-emerald-50 ${
                  currentChat?.id === patient.id ? 'bg-emerald-100' : ''
                }`}
                onClick={() => selectPatient(patient)}
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="avatar">
                      <div className="w-12 h-12 rounded-full ring-2 ring-offset-2 ring-white">
                        <img src={patient.avatar} alt={patient.name} className="object-cover" />
                      </div>
                    </div>
                    <StatusIndicator status={patient.status} />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium truncate text-gray-800">{patient.name}</h3>
                      <span className="text-xs text-gray-500">{patient.timestamp}</span>
                    </div>
                    <p className="text-sm truncate text-gray-500">{patient.lastMessage}</p>
                  </div>
                  
                  {patient.unread > 0 && (
                    <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-500 text-white text-xs">
                      {patient.unread}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-white">
        {currentChat ? (
          <>
            {/* Chat header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="avatar">
                    <div className="w-10 h-10 rounded-full ring-2 ring-white">
                      <img src={currentChat.avatar} alt={currentChat.name} className="object-cover" />
                    </div>
                  </div>
                  <StatusIndicator status={currentChat.status} />
                </div>
                <div>
                  <h3 className="font-medium">{currentChat.name}</h3>
                  <p className="text-xs text-white/80">
                    {currentChat.status === 'online' ? 'Online' : 
                     currentChat.status === 'away' ? 'Away' : 'Last seen recently'}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => initiateCall('audio')}
                  className="btn btn-circle btn-ghost hover:bg-white/20 transition-all duration-300 tooltip"
                  data-tip="Audio call"
                >
                  <Phone size={20} />
                </button>
                <button 
                  onClick={() => initiateCall('video')}
                  className="btn btn-circle btn-ghost hover:bg-white/20 transition-all duration-300 tooltip"
                  data-tip="Video call"
                >
                  <Video size={20} />
                </button>
                <button className="btn btn-circle btn-ghost hover:bg-white/20 transition-all duration-300 tooltip" data-tip="More options">
                  <MoreVertical size={20} />
                </button>
              </div>
            </div>
            
            {/* Messages area */}
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {messages[currentChat.id]?.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex ${msg.sender === 'doctor' ? 'justify-end' : 
                               msg.sender === 'system' ? 'justify-center' : 'justify-start'} transition-all duration-300`}
                >
                  {msg.sender !== 'system' && (
                    <div className="avatar mr-2 self-end">
                      <div className="w-8 rounded-full ring-2 ring-white">
                        <img 
                          src={msg.sender === 'doctor' ? 
                            (auth?.user?.avatar || "/api/placeholder/50/50") : 
                            currentChat.avatar} 
                          alt={msg.sender === 'doctor' ? 'Doctor' : currentChat.name} 
                          className="object-cover"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl ${
                    msg.sender === 'system' ? 'text-center' : ''
                  }`}>
                    {msg.sender !== 'system' && (
                      <div className={`text-xs opacity-70 mb-1 ${
                        msg.sender === 'doctor' ? 'text-right' : 'text-left'
                      }`}>
                        {msg.sender === 'doctor' ? 'You' : currentChat.name}
                        {msg.timestamp && <span className="ml-1">{formatTime(msg.timestamp)}</span>}
                      </div>
                    )}
                    
                    {msg.type === 'system' ? (
                      <div className="inline-block px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-sm">
                        {msg.text}
                      </div>
                    ) : msg.type === 'audio' ? (
                      <div className={`p-3 rounded-xl ${
                        msg.sender === 'doctor' ? 
                        'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 
                        'bg-gray-200 text-gray-800'
                      }`}>
                        <audio controls src={msg.audioUrl} className="max-w-xs"></audio>
                      </div>
                    ) : (
                      <div className={`p-3 rounded-xl ${
                        msg.sender === 'doctor' ? 
                        'bg-gradient-to-r from-green-500 to-emerald-600 text-white' : 
                        'bg-gray-200 text-gray-800'
                      } transition-all duration-300 hover:shadow-md`}>
                        {msg.text}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Message input */}
            <div className="p-4 bg-white border-t border-gray-200">
              {isRecording ? (
                <div className="flex items-center justify-between bg-red-50 p-3 rounded-xl border border-red-100 animate-pulse">
                  <div className="flex items-center gap-2 text-red-600">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <span>Recording audio message...</span>
                  </div>
                  <button 
                    onClick={stopRecording}
                    className="btn btn-circle btn-sm btn-ghost text-red-600 hover:bg-red-100 transition-all duration-300"
                  >
                    <PauseCircle size={20} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={startRecording}
                    className="btn btn-circle btn-ghost hover:bg-emerald-100 text-emerald-600 transition-all duration-300 hover:scale-110" 
                    title="Record audio message"
                  >
                    <Mic size={20} />
                  </button>
                  
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="input flex-1 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all duration-300"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  />
                  
                  <button 
                    onClick={sendMessage}
                    className={`btn btn-circle transition-all duration-300 ${
                      message.trim() ? 
                      'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700' : 
                      'btn-ghost opacity-50'
                    } hover:shadow-lg hover:-translate-y-1`}
                    disabled={!message.trim()}
                  >
                    <Send size={20} />
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-br from-gray-50 to-white">
            <div className="avatar placeholder">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full w-24 h-24 flex items-center justify-center shadow-lg">
                <User size={40} />
              </div>
            </div>
            <h3 className="mt-6 text-2xl font-bold text-gray-800">Welcome, Dr. {auth?.user?.name || 'Doctor'}</h3>
            <p className="text-gray-600 mt-3 max-w-md">
              Select a patient from the list to start a conversation.
              You can send messages, voice recordings, and initiate audio/video calls.
            </p>
            <div className="mt-6 flex gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <Phone size={24} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Audio Calls</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <Video size={24} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Video Calls</p>
              </div>
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                <Mic size={24} className="text-emerald-600 mx-auto mb-2" />
                <p className="text-sm text-gray-700">Voice Messages</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorChats;