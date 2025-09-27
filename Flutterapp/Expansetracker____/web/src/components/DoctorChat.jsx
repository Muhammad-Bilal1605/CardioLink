import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './DoctorChat.css';

const DoctorChat = () => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [currentRoom, setCurrentRoom] = useState('');
  const [doctorId] = useState('68320f2b9dad89de97c68e60'); // Your doctor ID
  const [patientId] = useState('68939b1445d55e455ddb0f2d'); // Patient ID from your logs
  const messagesEndRef = useRef(null);

  const roomId = `room_${doctorId}_${patientId}`;

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io('http://YOUR_LOCAL_IP:5001', {
      transports: ['websocket', 'polling'],
      query: { from: 'web' }
    });

    newSocket.on('connect', () => {
      console.log('🔌 Connected to server:', newSocket.id);
      setIsConnected(true);
      
      // Join as doctor user
      newSocket.emit('join_user', {
        userId: doctorId,
        userType: 'doctor',
        name: 'Dr. Muhammad Bilal'
      });

      // Join the chat room
      newSocket.emit('join_room', {
        roomId: roomId,
        userId: doctorId
      });
      
      setCurrentRoom(roomId);
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('receive_message', (messageData) => {
      console.log('📥 Received message:', messageData);
      setMessages(prev => [...prev, {
        ...messageData,
        isFromCurrentUser: messageData.senderId === doctorId
      }]);
    });

    newSocket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [doctorId, patientId, roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (newMessage.trim() && socket && isConnected) {
      const messageData = {
        roomId: roomId,
        senderId: doctorId,
        receiverId: patientId,
        text: newMessage,
        type: 'text',
        timestamp: new Date().toISOString(),
        messageId: `${Date.now()}_${doctorId}`
      };

      // Add to local messages immediately
      setMessages(prev => [...prev, {
        ...messageData,
        isFromCurrentUser: true,
        status: 'sent'
      }]);

      // Send via socket
      socket.emit('send_message', messageData);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="doctor-chat-container">
      <div className="chat-header">
        <div className="patient-info">
          <div className="patient-avatar">
            <span>P</span>
          </div>
          <div className="patient-details">
            <h3>Patient Chat</h3>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.messageId || index}
              className={`message ${message.isFromCurrentUser ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{message.text}</p>
                <div className="message-info">
                  <span className="time">{formatTime(message.timestamp)}</span>
                  {message.isFromCurrentUser && (
                    <span className={`status ${message.status || 'sent'}`}>
                      {message.status === 'sent' && '✓'}
                      {message.status === 'delivered' && '✓✓'}
                      {message.status === 'read' && '✓✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input-container">
        <div className="input-wrapper">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            rows="1"
            disabled={!isConnected}
          />
          <button 
            onClick={sendMessage} 
            disabled={!newMessage.trim() || !isConnected}
            className="send-button"
          >
            <span>📤</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorChat;
