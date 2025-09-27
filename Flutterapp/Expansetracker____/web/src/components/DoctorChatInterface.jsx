import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import axios from 'axios';
import './DoctorChatInterface.css';

const DoctorChatInterface = ({ doctorId, patientId, doctorName, patientName }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  const roomId = `room_${doctorId}_${patientId}`;
  const API_BASE_URL = 'http://192.168.56.1:5000/api';

  useEffect(() => {
    initializeChat();
    return () => {
      socketService.leaveChatRoom(roomId);
      socketService.disconnect();
    };
  }, [doctorId, patientId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeChat = async () => {
    try {
      // Initialize socket connection
      socketService.init(doctorId, 'doctor', 'doctor_token_placeholder');
      
      // Join the chat room
      socketService.joinChatRoom(roomId);
      
      // Set up event listeners
      setupSocketListeners();
      
      // Load message history from database
      await loadMessageHistory();
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      setIsLoading(false);
    }
  };

  const setupSocketListeners = () => {
    // Connection status
    socketService.socket?.on('connect', () => {
      setIsConnected(true);
      console.log('🔌 Doctor connected to chat server');
    });

    socketService.socket?.on('disconnect', () => {
      setIsConnected(false);
      console.log('❌ Doctor disconnected from chat server');
    });

    // New messages from database
    socketService.onNewMessage((message) => {
      console.log('📨 New message received:', message);
      setMessages(prev => {
        // Avoid duplicates
        const exists = prev.some(m => m._id === message._id || m.id === message.id);
        if (exists) return prev;
        return [...prev, message];
      });
    });

    // Typing indicators
    socketService.onUserTyping((data) => {
      if (data.userId !== doctorId) {
        setIsTyping(true);
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    });

    // Message read receipts
    socketService.onMessagesRead((data) => {
      setMessages(prev => prev.map(msg => 
        data.messageIds.includes(msg._id || msg.id) 
          ? { ...msg, read: true }
          : msg
      ));
    });
  };

  const loadMessageHistory = async () => {
    try {
      console.log('📚 Loading message history for room:', roomId);
      const response = await axios.get(`${API_BASE_URL}/messages/conversation/${roomId}`);
      
      if (response.data.status === 'success') {
        const historyMessages = response.data.data.messages || [];
        console.log('📚 Loaded messages:', historyMessages.length);
        setMessages(historyMessages);
      }
    } catch (error) {
      console.error('❌ Failed to load message history:', error);
      // Initialize with empty array if no history exists
      setMessages([]);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      console.log('📤 Doctor sending message:', messageText);
      
      // Send message to database via API
      const response = await axios.post(`${API_BASE_URL}/messages`, {
        roomId: roomId,
        receiverId: patientId,
        message: messageText,
        messageType: 'text'
      }, {
        headers: {
          'Authorization': `Bearer doctor_token_placeholder`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        console.log('✅ Message sent successfully:', response.data.data.message);
        
        // Message will be added to UI via socket event
        // No need to manually add here as socket will emit newMessage event
      }
    } catch (error) {
      console.error('❌ Failed to send message:', error);
      
      // Add message optimistically to UI even if API fails
      const optimisticMessage = {
        id: Date.now().toString(),
        roomId: roomId,
        senderId: doctorId,
        receiverId: patientId,
        message: messageText,
        messageType: 'text',
        createdAt: new Date().toISOString(),
        read: false,
        status: 'sent'
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
    }
  };

  const handleTyping = () => {
    socketService.emitTyping(roomId, doctorId);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    } else {
      handleTyping();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message) => {
    return message.senderId === doctorId;
  };

  if (isLoading) {
    return (
      <div className="doctor-chat-loading">
        <div className="loading-spinner"></div>
        <p>Loading chat...</p>
      </div>
    );
  }

  return (
    <div className="doctor-chat-interface">
      {/* Header */}
      <div className="chat-header">
        <div className="patient-info">
          <div className="patient-avatar">
            <span>{patientName.charAt(0).toUpperCase()}</span>
          </div>
          <div className="patient-details">
            <h3>{patientName}</h3>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="chat-actions">
          <button className="action-btn">📞</button>
          <button className="action-btn">📹</button>
          <button className="action-btn">ℹ️</button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message._id || message.id || index}
              className={`message ${isMyMessage(message) ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{message.message}</p>
                <div className="message-meta">
                  <span className="time">{formatTime(message.createdAt)}</span>
                  {isMyMessage(message) && (
                    <span className={`status ${message.read ? 'read' : 'delivered'}`}>
                      {message.read ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {/* Typing Indicator */}
        {isTyping && (
          <div className="message received">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="message-input-container">
        <div className="input-wrapper">
          <button className="attachment-btn">📎</button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows="1"
            className="message-input"
          />
          <button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="send-btn"
          >
            📤
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '🟢 Connected to chat server' : '🔴 Disconnected from server'}
      </div>
    </div>
  );
};

export default DoctorChatInterface;
