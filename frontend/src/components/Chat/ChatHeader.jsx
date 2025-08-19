import React from 'react';
import { Phone, Video, MoreVertical, ArrowLeft } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';

const ChatHeader = ({ onBack, isMobileView = false }) => {
  const { currentChat, onlineUsers } = useChat();
  const navigate = useNavigate();

  if (!currentChat) {
    return (
      <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          {isMobileView && (
            <button 
              onClick={() => navigate(-1)}
              className="p-1 mr-2 text-gray-600 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="ml-2">
            <h3 className="font-medium text-gray-900">Select a chat</h3>
          </div>
        </div>
      </div>
    );
  }

  const isOnline = onlineUsers.includes(currentChat.participantId);
  const lastSeen = currentChat.lastSeen 
    ? new Date(currentChat.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <div className="flex items-center">
        {isMobileView && (
          <button 
            onClick={() => navigate(-1)}
            className="p-1 mr-2 text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        <div className="relative flex-shrink-0 w-10 h-10 mr-3 overflow-hidden bg-gray-200 rounded-full">
          <img 
            src={currentChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentChat.name || 'U')}&background=random`} 
            alt={currentChat.name}
            className="object-cover w-full h-full"
          />
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
          )}
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900">{currentChat.name}</h3>
          <div className="flex items-center">
            {isOnline ? (
              <span className="flex items-center text-xs text-green-500">
                <span className="w-2 h-2 mr-1 bg-green-500 rounded-full"></span>
                Online
              </span>
            ) : lastSeen ? (
              <span className="text-xs text-gray-500">
                Last seen {lastSeen}
              </span>
            ) : (
              <span className="text-xs text-gray-500">Offline</span>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button 
          className="p-2 text-blue-600 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Voice call"
          onClick={() => console.log('Voice call', currentChat.id)}
        >
          <Phone className="w-5 h-5" />
        </button>
        
        <button 
          className="p-2 text-blue-600 rounded-full hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Video call"
          onClick={() => console.log('Video call', currentChat.id)}
        >
          <Video className="w-5 h-5" />
        </button>
        
        <div className="relative">
          <button 
            className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="More options"
            onClick={() => console.log('More options', currentChat.id)}
          >
            <MoreVertical className="w-5 h-5" />
          </button>
          
          {/* Dropdown menu would go here */}
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
