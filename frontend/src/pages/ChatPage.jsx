import React, { useState, useEffect } from 'react';
import { useMediaQuery } from 'react-responsive';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import ChatList from '../components/Chat/ChatList';
import ChatContainer from '../components/Chat/ChatContainer';
import { X, ArrowLeft } from 'lucide-react';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const [showChatList, setShowChatList] = useState(true);
  const [showChatContainer, setShowChatContainer] = useState(true);
  
  const { 
    currentChat, 
    setCurrentChat, 
    conversations, 
    loading, 
    error,
    initializeChat
  } = useChat();

  // Initialize chat data when component mounts
  useEffect(() => {
    initializeChat();
    
    // Clean up on unmount
    return () => {
      // Any cleanup if needed
    };
  }, [initializeChat]);

  // Update current chat when URL changes
  useEffect(() => {
    if (chatId) {
      const chat = conversations.find(c => c.id === chatId);
      if (chat) {
        setCurrentChat(chat);
        if (isMobile) {
          setShowChatList(false);
          setShowChatContainer(true);
        }
      } else if (conversations.length > 0) {
        // If chatId is invalid but we have conversations, redirect to the first one
        navigate(`/chat/${conversations[0].id}`, { replace: true });
      }
    } else if (conversations.length > 0 && !isMobile) {
      // If no chatId but we have conversations, redirect to the first one
      navigate(`/chat/${conversations[0].id}`, { replace: true });
    } else if (isMobile) {
      setShowChatList(true);
      setShowChatContainer(false);
    }
  }, [chatId, conversations, isMobile, navigate, setCurrentChat]);

  // Handle back to chat list on mobile
  const handleBackToList = () => {
    setShowChatList(true);
    setShowChatContainer(false);
    navigate('/chat');
  };

  // Show loading state
  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-50">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-50">
        <div className="p-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 text-red-500 bg-red-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="mb-6 text-gray-600">We couldn't load your conversations. Please try again later.</p>
          <button
            onClick={initializeChat}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No conversations state
  if (conversations.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-50">
        <div className="p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mx-auto mb-4 text-blue-500 bg-blue-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-semibold text-gray-900">No conversations yet</h2>
          <p className="mb-6 text-gray-600">Start a new conversation to get started.</p>
          <button
            onClick={() => console.log('Start new conversation')}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            New Message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Chat List - Always show on desktop, conditionally on mobile */}
      <div className={`${isMobile ? (showChatList ? 'flex' : 'hidden') : 'flex'} flex-col w-full md:w-96 border-r border-gray-200 bg-white z-10`}>
        <ChatList />
      </div>

      {/* Chat Container - Always show on desktop, conditionally on mobile */}
      <div className={`${isMobile ? (showChatContainer ? 'flex' : 'hidden') : 'flex'} flex-1 flex-col h-full relative`}>
        {isMobile && (
          <button
            onClick={handleBackToList}
            className="absolute top-4 left-4 z-20 p-2 text-gray-600 bg-white rounded-full shadow-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        
        {currentChat ? (
          <ChatContainer />
        ) : !isMobile ? (
          <div className="flex flex-col items-center justify-center flex-1 p-6 text-center text-gray-500">
            <div className="w-24 h-24 mb-4 text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="mb-1 text-lg font-medium text-gray-900">Select a conversation</h3>
            <p className="max-w-md text-sm">Choose a chat from the list to start messaging</p>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ChatPage;
