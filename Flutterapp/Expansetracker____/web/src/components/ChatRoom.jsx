import React, { useState, useEffect, useRef } from 'react';
import socketService from '../services/socketService';
import './ChatRoom.css';

const ChatRoom = ({ currentUser, otherUser, roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    // Initialize socket connection
    socketService.init(currentUser.id, currentUser.type, currentUser.token);
    
    // Join the chat room
    socketService.joinChatRoom(roomId);
    
    // Set up event listeners
    setupSocketListeners();
    
    // Load message history
    loadMessageHistory();

    return () => {
      socketService.leaveChatRoom(roomId);
      socketService.disconnect();
    };
  }, [roomId, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const setupSocketListeners = () => {
    // Connection status
    socketService.socket?.on('connect', () => {
      setIsConnected(true);
    });

    socketService.socket?.on('disconnect', () => {
      setIsConnected(false);
    });

    // New messages
    socketService.onNewMessage((message) => {
      setMessages(prev => [...prev, message]);
      
      // Mark as read if it's not from current user
      if (message.senderId !== currentUser.id) {
        socketService.markMessagesAsRead(roomId, [message._id]);
      }
    });

    // Typing indicators
    socketService.onUserTyping((data) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers(prev => new Set([...prev, data.userName]));
      }
    });

    socketService.onUserStoppedTyping((data) => {
      if (data.userId !== currentUser.id) {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userName);
          return newSet;
        });
      }
    });

    // Message read receipts
    socketService.onMessagesRead((data) => {
      setMessages(prev => 
        prev.map(msg => 
          data.messageIds.includes(msg._id) 
            ? { ...msg, status: 'read' }
            : msg
        )
      );
    });
  };

  const loadMessageHistory = async () => {
    try {
      const response = await fetch(`http://192.168.1.8:5000/api/messages/conversation/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages || []);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;

    const messageData = {
      roomId,
      senderId: currentUser.id,
      receiverId: otherUser.id,
      message: newMessage.trim(),
      messageType: 'text',
    };

    socketService.sendMessage(messageData);
    setNewMessage('');
    stopTyping();
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      socketService.startTyping(roomId, currentUser.name);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const stopTyping = () => {
    if (isTyping) {
      setIsTyping(false);
      socketService.stopTyping(roomId);
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="chat-room">
      {/* Header */}
      <div className="chat-header">
        <div className="user-info">
          <img 
            src={otherUser.avatar || '/default-avatar.png'} 
            alt={otherUser.name}
            className="avatar"
          />
          <div>
            <h3>{otherUser.name}</h3>
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message._id}
            className={`message ${message.senderId === currentUser.id ? 'sent' : 'received'}`}
          >
            <div className="message-content">
              <p>{message.message}</p>
              <div className="message-meta">
                <span className="time">{formatTime(message.createdAt)}</span>
                {message.senderId === currentUser.id && (
                  <span className={`status-icon ${message.status}`}>
                    {message.status === 'sent' && '✓'}
                    {message.status === 'delivered' && '✓✓'}
                    {message.status === 'read' && '✓✓'}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <span className="typing-text">
              {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
            </span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="message-input-form">
        <div className="input-container">
          <input
            type="text"
            value={newMessage}
            onChange={handleTyping}
            onBlur={stopTyping}
            placeholder="Type a message..."
            className="message-input"
            disabled={!isConnected}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!newMessage.trim() || !isConnected}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatRoom;
