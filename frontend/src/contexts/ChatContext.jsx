import React, { createContext, useContext, useEffect, useReducer, useCallback } from 'react';
import { SOCKET_EVENTS } from '../config';
import { chatService } from '../services/ChatService';
import { useAuth } from './AuthContext';

// Initial state
const initialState = {
  // Conversations
  conversations: [],
  conversationsLoading: false,
  conversationsError: null,
  
  // Current conversation
  currentConversationId: null,
  currentConversation: null,
  
  // Messages
  messages: [],
  messagesLoading: false,
  messagesError: null,
  hasMoreMessages: true,
  
  // Typing indicators
  typingUsers: {},
  
  // Online status
  onlineStatus: {},
  
  // UI state
  isSending: false,
  sendError: null,
  
  // Call state
  activeCall: null,
};

// Action types
const actionTypes = {
  // Conversations
  FETCH_CONVERSATIONS_START: 'FETCH_CONVERSATIONS_START',
  FETCH_CONVERSATIONS_SUCCESS: 'FETCH_CONVERSATIONS_SUCCESS',
  FETCH_CONVERSATIONS_ERROR: 'FETCH_CONVERSATIONS_ERROR',
  
  // Messages
  FETCH_MESSAGES_START: 'FETCH_MESSAGES_START',
  FETCH_MESSAGES_SUCCESS: 'FETCH_MESSAGES_SUCCESS',
  FETCH_MORE_MESSAGES_SUCCESS: 'FETCH_MORE_MESSAGES_SUCCESS',
  FETCH_MESSAGES_ERROR: 'FETCH_MESSAGES_ERROR',
  
  // Message sending
  SEND_MESSAGE_START: 'SEND_MESSAGE_START',
  SEND_MESSAGE_SUCCESS: 'SEND_MESSAGE_SUCCESS',
  SEND_MESSAGE_ERROR: 'SEND_MESSAGE_ERROR',
  
  // New message received
  NEW_MESSAGE_RECEIVED: 'NEW_MESSAGE_RECEIVED',
  
  // Typing indicators
  SET_TYPING_USER: 'SET_TYPING_USER',
  
  // Online status
  SET_USER_ONLINE_STATUS: 'SET_USER_ONLINE_STATUS',
  
  // Current conversation
  SET_CURRENT_CONVERSATION: 'SET_CURRENT_CONVERSATION',
  
  // Call state
  SET_ACTIVE_CALL: 'SET_ACTIVE_CALL',
  
  // Reset state
  RESET: 'RESET',
};

// Reducer
function chatReducer(state, action) {
  switch (action.type) {
    // Conversations
    case actionTypes.FETCH_CONVERSATIONS_START:
      return { ...state, conversationsLoading: true, conversationsError: null };
      
    case actionTypes.FETCH_CONVERSATIONS_SUCCESS:
      return { 
        ...state, 
        conversations: action.payload, 
        conversationsLoading: false 
      };
      
    case actionTypes.FETCH_CONVERSATIONS_ERROR:
      return { 
        ...state, 
        conversationsLoading: false, 
        conversationsError: action.payload 
      };
    
    // Messages
    case actionTypes.FETCH_MESSAGES_START:
      return { 
        ...state, 
        messagesLoading: true, 
        messagesError: null 
      };
      
    case actionTypes.FETCH_MESSAGES_SUCCESS:
      return { 
        ...state, 
        messages: action.payload.messages || [],
        hasMoreMessages: action.payload.hasMore || false,
        messagesLoading: false,
      };
      
    case actionTypes.FETCH_MORE_MESSAGES_SUCCESS:
      return { 
        ...state, 
        messages: [...(action.payload.messages || []), ...state.messages],
        hasMoreMessages: action.payload.hasMore || false,
        messagesLoading: false,
      };
      
    case actionTypes.FETCH_MESSAGES_ERROR:
      return { 
        ...state, 
        messagesLoading: false, 
        messagesError: action.payload 
      };
    
    // Message sending
    case actionTypes.SEND_MESSAGE_START:
      return { 
        ...state, 
        isSending: true, 
        sendError: null 
      };
      
    case actionTypes.SEND_MESSAGE_SUCCESS:
      return { 
        ...state, 
        isSending: false,
        messages: [...state.messages, action.payload],
      };
      
    case actionTypes.SEND_MESSAGE_ERROR:
      return { 
        ...state, 
        isSending: false, 
        sendError: action.payload 
      };
    
    // New message received
    case actionTypes.NEW_MESSAGE_RECEIVED:
      const { message } = action.payload;
      
      // If the message is for the current conversation, add it to messages
      if (message.conversationId === state.currentConversationId) {
        return {
          ...state,
          messages: [...state.messages, message],
        };
      }
      
      // Otherwise, update the conversation's last message
      return {
        ...state,
        conversations: state.conversations.map(conv => 
          conv._id === message.conversationId 
            ? { 
                ...conv, 
                lastMessage: message,
                unreadCount: conv._id === state.currentConversationId 
                  ? 0 
                  : (conv.unreadCount || 0) + 1 
              } 
            : conv
        ),
      };
    
    // Typing indicators
    case actionTypes.SET_TYPING_USER: {
      const { userId, isTyping } = action.payload;
      return {
        ...state,
        typingUsers: {
          ...state.typingUsers,
          [userId]: isTyping ? Date.now() : null,
        },
      };
    }
    
    // Online status
    case actionTypes.SET_USER_ONLINE_STATUS: {
      const { userId, isOnline, lastSeen } = action.payload;
      return {
        ...state,
        onlineStatus: {
          ...state.onlineStatus,
          [userId]: { isOnline, lastSeen },
        },
      };
    }
    
    // Current conversation
    case actionTypes.SET_CURRENT_CONVERSATION: {
      const { conversationId } = action.payload;
      const currentConversation = state.conversations.find(c => c._id === conversationId) || null;
      
      // Mark conversation as read
      const updatedConversations = state.conversations.map(conv => 
        conv._id === conversationId 
          ? { ...conv, unreadCount: 0 } 
          : conv
      );
      
      return {
        ...state,
        currentConversationId: conversationId,
        currentConversation,
        conversations: updatedConversations,
      };
    }
    
    // Call state
    case actionTypes.SET_ACTIVE_CALL:
      return {
        ...state,
        activeCall: action.payload,
      };
    
    // Reset state
    case actionTypes.RESET:
      return { ...initialState };
      
    default:
      return state;
  }
}

// Create context
const ChatContext = createContext();

// Context provider
export const ChatProvider = ({ children }) => {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user, isAuthenticated } = useAuth();
  
  // Initialize chat service when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.token) {
      // Initialize chat service with user token
      chatService.initialize(user.token, () => {
        // Handle unauthenticated state (e.g., redirect to login)
        console.log('User is not authenticated');
      });
      
      // Set up event listeners
      const unsubscribeMessage = chatService.onMessage((message) => {
        dispatch({ 
          type: actionTypes.NEW_MESSAGE_RECEIVED, 
          payload: { message } 
        });
      });
      
      const unsubscribeTyping = chatService.onTyping(({ userId, isTyping }) => {
        dispatch({
          type: actionTypes.SET_TYPING_USER,
          payload: { userId, isTyping },
        });
      });
      
      const unsubscribeUserStatus = chatService.onUserStatus(({ userId, isOnline, lastSeen }) => {
        dispatch({
          type: actionTypes.SET_USER_ONLINE_STATUS,
          payload: { userId, isOnline, lastSeen },
        });
      });
      
      // Set up call event handlers
      const unsubscribeCall = chatService.onCall((callData) => {
        // Handle incoming call
        if (callData.type === 'call_initiate') {
          dispatch({
            type: actionTypes.SET_ACTIVE_CALL,
            payload: callData,
          });
        }
        // Add more call handling as needed
      });
      
      // Clean up on unmount
      return () => {
        unsubscribeMessage();
        unsubscribeTyping();
        unsubscribeUserStatus();
        unsubscribeCall();
        chatService.cleanup();
      };
    }
  }, [isAuthenticated, user]);
  
  // Actions
  const fetchConversations = useCallback(async () => {
    dispatch({ type: actionTypes.FETCH_CONVERSATIONS_START });
    
    try {
      const conversations = await chatService.getConversations();
      dispatch({ 
        type: actionTypes.FETCH_CONVERSATIONS_SUCCESS, 
        payload: conversations 
      });
      return conversations;
    } catch (error) {
      dispatch({ 
        type: actionTypes.FETCH_CONVERSATIONS_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  }, []);
  
  const fetchMessages = useCallback(async (conversationId, loadMore = false) => {
    if (!conversationId) return;
    
    dispatch({ type: actionTypes.FETCH_MESSAGES_START });
    
    try {
      const before = loadMore && state.messages.length > 0 
        ? state.messages[0].createdAt 
        : undefined;
      
      const messages = await chatService.getMessages(conversationId, { before });
      
      dispatch({ 
        type: loadMore 
          ? actionTypes.FETCH_MORE_MESSAGES_SUCCESS 
          : actionTypes.FETCH_MESSAGES_SUCCESS,
        payload: { 
          messages,
          hasMore: messages.length >= 50, // Assuming page size is 50
        },
      });
      
      return messages;
    } catch (error) {
      dispatch({ 
        type: actionTypes.FETCH_MESSAGES_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  }, [state.messages]);
  
  const sendMessage = useCallback(async (content, options = {}) => {
    if (!state.currentConversationId) return;
    
    dispatch({ type: actionTypes.SEND_MESSAGE_START });
    
    try {
      const message = await chatService.sendTextMessage(
        state.currentConversationId, 
        content,
        options
      );
      
      dispatch({ 
        type: actionTypes.SEND_MESSAGE_SUCCESS, 
        payload: message 
      });
      
      return message;
    } catch (error) {
      dispatch({ 
        type: actionTypes.SEND_MESSAGE_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  }, [state.currentConversationId]);
  
  const sendFileMessage = useCallback(async (file, options = {}) => {
    if (!state.currentConversationId) return;
    
    dispatch({ type: actionTypes.SEND_MESSAGE_START });
    
    try {
      const message = await chatService.sendFileMessage(
        state.currentConversationId, 
        file,
        options
      );
      
      dispatch({ 
        type: actionTypes.SEND_MESSAGE_SUCCESS, 
        payload: message 
      });
      
      return message;
    } catch (error) {
      dispatch({ 
        type: actionTypes.SEND_MESSAGE_ERROR, 
        payload: error.message 
      });
      throw error;
    }
  }, [state.currentConversationId]);
  
  const setCurrentConversation = useCallback((conversationId) => {
    dispatch({ 
      type: actionTypes.SET_CURRENT_CONVERSATION, 
      payload: { conversationId } 
    });
    
    // Mark messages as read
    if (conversationId) {
      chatService.markMessagesAsRead(conversationId);
    }
  }, []);
  
  const sendTypingIndicator = useCallback((isTyping = true) => {
    if (state.currentConversationId) {
      chatService.sendTypingIndicator(state.currentConversationId, isTyping);
    }
  }, [state.currentConversationId]);
  
  // Context value
  const value = {
    // State
    ...state,
    
    // Actions
    fetchConversations,
    fetchMessages,
    sendMessage,
    sendFileMessage,
    setCurrentConversation,
    sendTypingIndicator,
  };
  
  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Custom hook to use the chat context
export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
