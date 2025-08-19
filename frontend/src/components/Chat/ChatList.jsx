import React, { useState, useEffect, useRef } from 'react';
import { Search, MoreVertical, Filter, Plus } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const ChatList = () => {
  const { 
    conversations, 
    currentChat, 
    setCurrentChat, 
    onlineUsers,
    unreadCounts,
    markConversationAsRead,
    loading,
    error
  } = useChat();n  
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const listRef = useRef(null);

  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    return (
      conv.participantName.toLowerCase().includes(searchLower) ||
      (conv.lastMessage?.content?.toLowerCase().includes(searchLower) ?? false)
    );
  });

  // Handle scroll for shadow
  const handleScroll = () => {
    if (listRef.current) {
      setIsScrolled(listRef.current.scrollTop > 0);
    }
  };

  // Set up scroll event listener
  useEffect(() => {
    const list = listRef.current;
    if (list) {
      list.addEventListener('scroll', handleScroll);
      return () => list.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Format last message preview
  const formatMessagePreview = (message) => {
    if (!message) return '';
    
    if (message.type === 'text') {
      return message.content.length > 30 
        ? message.content.substring(0, 30) + '...' 
        : message.content;
    } else if (message.type === 'image') {
      return '📷 Photo';
    } else if (message.type === 'document') {
      return '📄 Document';
    } else if (message.type === 'audio') {
      return '🎤 Voice message';
    }
    
    return 'New message';
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  if (loading && conversations.length === 0) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex items-center justify-center flex-1">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
        </div>
        <div className="flex items-center justify-center flex-1 p-4 text-center text-red-500">
          <p>Error loading conversations. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className={`p-4 border-b border-gray-200 ${isScrolled ? 'shadow-sm' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          <div className="flex items-center space-x-2">
            <button 
              className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
              onClick={() => console.log('New message')}
            >
              <Plus className="w-5 h-5" />
            </button>
            <button 
              className="p-1 text-gray-500 rounded-full hover:bg-gray-100"
              onClick={() => console.log('Filter')}
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-4 h-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search messages"
            className="w-full py-2 pl-10 pr-4 text-sm bg-gray-100 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 focus:bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      {/* Conversation list */}
      <div 
        ref={listRef}
        className="flex-1 overflow-y-auto"
      >
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center">
            <div className="w-16 h-16 mb-4 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-900">No conversations</h3>
            <p className="max-w-md text-sm text-gray-500">
              {searchQuery 
                ? 'No conversations match your search.'
                : 'Start a new conversation to get started.'}
            </p>
            {!searchQuery && (
              <button 
                className="px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                onClick={() => console.log('New message')}
              >
                New Message
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredConversations.map((conversation) => {
              const isActive = currentChat?.id === conversation.id;
              const isOnline = onlineUsers.includes(conversation.participantId);
              const unreadCount = unreadCounts[conversation.id] || 0;
              
              return (
                <li 
                  key={conversation.id}
                  className={`relative flex p-4 cursor-pointer hover:bg-gray-50 ${
                    isActive ? 'bg-blue-50' : 'bg-white'
                  }`}
                  onClick={() => {
                    setCurrentChat(conversation);
                    if (unreadCount > 0) {
                      markConversationAsRead(conversation.id);
                    }
                  }}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 w-12 h-12 mr-3">
                    <img 
                      src={conversation.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(conversation.participantName || 'U')}&background=random`}
                      alt={conversation.participantName}
                      className="object-cover w-full h-full rounded-full"
                    />
                    {isOnline && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className={`text-sm font-medium ${
                        unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {conversation.participantName}
                      </h3>
                      <span className={`text-xs ${
                        unreadCount > 0 ? 'text-blue-600 font-medium' : 'text-gray-400'
                      }`}>
                        {formatTimestamp(conversation.updatedAt)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${
                        unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-500'
                      }`}>
                        {conversation.lastMessage 
                          ? formatMessagePreview(conversation.lastMessage)
                          : 'No messages yet'}
                      </p>
                      {unreadCount > 0 && (
                        <span className="flex-shrink-0 inline-flex items-center justify-center w-5 h-5 ml-2 text-xs font-medium text-white bg-blue-600 rounded-full">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default ChatList;
