import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Send, Paperclip, X, Image as ImageIcon, File as FileIcon, Mic } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import Message from './Message';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

const ChatContainer = () => {
  const { 
    messages, 
    messagesLoading, 
    messagesError, 
    sendMessage, 
    sendFileMessage,
    currentConversation,
    typingUsers,
    onlineStatus,
    sendTypingIndicator,
    fetchMessages,
    hasMoreMessages
  } = useChat();
  
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const [isNearTop, setIsNearTop] = useState(false);

  // Scroll to bottom when messages change or new message is sent
  useEffect(() => {
    if (!loadingMoreRef.current) {
      scrollToBottom('auto');
    }
  }, [messages]);

  // Set up typing indicator
  useEffect(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    if (isTyping) {
      sendTypingIndicator(true);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        sendTypingIndicator(false);
      }, 2000);
    } else {
      sendTypingIndicator(false);
    }

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [isTyping, sendTypingIndicator]);

  // Handle scroll events for infinite loading
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop } = messagesContainerRef.current;
    setIsNearTop(scrollTop < 100);
    
    // Load more messages when near the top
    if (scrollTop < 200 && hasMoreMessages && !loadingMoreRef.current) {
      loadingMoreRef.current = true;
      fetchMessages().finally(() => {
        loadingMoreRef.current = false;
      });
    }
  }, [fetchMessages, hasMoreMessages]);

  const scrollToBottom = (behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if ((!newMessage.trim() && !file) || !currentConversation) return;

    try {
      if (file) {
        await sendFileMessage(currentConversation._id, file, { content: newMessage });
        setFile(null);
        setPreviewUrl('');
      } else {
        await sendMessage(newMessage);
      }
      setNewMessage('');
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      // Show error to user
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file size (10MB max)
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size should be less than 10MB');
      return;
    }

    setFile(selectedFile);
    
    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }
  };

  const removeFile = () => {
    setFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Get other participant's info
  const getOtherParticipant = () => {
    if (!currentConversation || !currentConversation.participants) return null;
    return currentConversation.participants.find(p => p.user?._id !== user?._id)?.user;
  };

  const otherParticipant = getOtherParticipant();
  const isOtherUserTyping = typingUsers[otherParticipant?._id] > Date.now() - 2000; // 2 second threshold
  
  // Format message date
  const formatMessageDate = (date) => {
    if (isToday(new Date(date))) {
      return format(new Date(date), 'h:mm a');
    } else if (isYesterday(new Date(date))) {
      return 'Yesterday';
    } else {
      return format(new Date(date), 'MMM d, yyyy');
    }
  };

  if (!currentConversation) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-6 max-w-md">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="1.5" 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No conversation selected</h3>
          <p className="text-sm text-gray-500">Select a conversation or start a new one to begin messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Chat header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center">
          <div className="relative">
            <img
              src={otherParticipant?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherParticipant?.name || 'U')}&background=random`}
              alt={otherParticipant?.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            {onlineStatus[otherParticipant?._id]?.isOnline && (
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
            )}
          </div>
          <div className="ml-3">
            <h2 className="text-lg font-semibold text-gray-900">
              {otherParticipant?.name || 'Unknown User'}
              {otherParticipant?.role && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  {otherParticipant.role}
                </span>
              )}
            </h2>
            <p className="text-sm text-gray-500">
              {onlineStatus[otherParticipant?._id]?.isOnline 
                ? 'Online' 
                : `Last seen ${formatDistanceToNow(new Date(onlineStatus[otherParticipant?._id]?.lastSeen || new Date()))} ago`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {messagesLoading && !messages.length ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : messagesError ? (
          <div className="text-center text-red-500 p-4">
            {messagesError}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <svg 
                className="w-8 h-8 text-blue-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="1.5" 
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                ></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No messages yet</h3>
            <p className="text-sm text-gray-500">
              Send a message to start the conversation with {otherParticipant?.name || 'this user'}
            </p>
          </div>
        ) : (
          <>
            {hasMoreMessages && (
              <div className="text-center py-2">
                <button 
                  onClick={() => fetchMessages()}
                  className="text-sm text-blue-600 hover:text-blue-800"
                  disabled={loadingMoreRef.current}
                >
                  {loadingMoreRef.current ? 'Loading...' : 'Load more messages'}
                </button>
              </div>
            )}
            
            {messages.map((message) => (
              <Message 
                key={message._id} 
                message={message} 
                isCurrentUser={message.sender?._id === user?._id}
                showAvatar={true}
                showTimestamp={true}
                formatDate={formatMessageDate}
              />
            ))}
          </>
        )}
        
        {isOtherUserTyping && (
          <div className="flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-full w-fit">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            <span className="ml-1 text-sm text-gray-600">{otherParticipant?.name} is typing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        {/* File preview */}
        {previewUrl && (
          <div className="relative mb-3 rounded-lg overflow-hidden border border-gray-200 w-fit">
            <button
              onClick={removeFile}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
            >
              <X className="w-4 h-4" />
            </button>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="max-h-32 max-w-xs object-cover"
            />
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
          <div className="flex-1 bg-gray-100 rounded-full flex items-center px-4 py-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Attach file"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.mp3,.wav,.mp4,.zip,.rar"
            />
            
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 bg-transparent border-0 focus:ring-0 focus:outline-none px-3 py-1 text-gray-900 placeholder-gray-500"
            />
            
            <button
              type="button"
              className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
              title="Record voice message"
            >
              <Mic className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            disabled={!newMessage.trim() && !file}
            className={`p-2 rounded-full ${
              newMessage.trim() || file ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            title="Send message"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer;
