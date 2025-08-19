import React, { useState, useRef, useEffect } from 'react';
import { Paperclip, Mic, Send, X, Image as ImageIcon, File, MicOff, Loader2 } from 'lucide-react';
import { useChat } from '../../contexts/ChatContext';

const ChatInput = () => {
  const { currentChat, sendMessage, startTyping, stopTyping } = useChat();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const inputRef = useRef(null);

  // Handle input change
  const handleChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    // Handle typing indicators
    if (value.trim() && !isTyping) {
      setIsTyping(true);
      startTyping();
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
      stopTyping();
    }
    
    // Reset the typing timeout
    if (typingTimeout) clearTimeout(typingTimeout);
    
    // Set a new timeout to stop typing after a delay
    const timeout = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        stopTyping();
      }
    }, 2000);
    
    setTypingTimeout(timeout);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if ((!message || !message.trim()) && !isRecording) return;
    
    try {
      if (isRecording) {
        // Stop recording if in progress
        stopRecording();
      } else {
        // Send text message
        if (message.trim()) {
          await sendMessage(message.trim());
          setMessage('');
          
          // Reset typing state
          if (isTyping) {
            setIsTyping(false);
            stopTyping();
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Determine file type
    let type = 'document';
    if (file.type.startsWith('image/')) {
      type = 'image';
    } else if (file.type.startsWith('audio/')) {
      type = 'audio';
    }
    
    // Send file
    handleSendFile(file, type);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Hide attachment menu
    setShowAttachmentMenu(false);
  };

  // Handle sending file
  const handleSendFile = async (file, type) => {
    if (!file || !currentChat) return;
    
    setIsUploading(true);
    
    try {
      await sendMessage(null, type, file);
    } catch (error) {
      console.error('Error sending file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        
        // Send the audio file
        await handleSendFile(audioFile, 'audio');
        
        // Stop all tracks in the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check your permissions.');
    }
  };

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
      if (isRecording) {
        stopRecording();
      }
    };
  }, [typingTimeout, isRecording]);

  // Focus input when chat changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentChat?.id]);

  if (!currentChat) {
    return (
      <div className="flex items-center justify-center h-20 px-4 text-gray-500 bg-white border-t border-gray-200">
        Select a chat to start messaging
      </div>
    );
  }

  return (
    <div className="relative bg-white border-t border-gray-200">
      {/* Attachment menu */}
      {showAttachmentMenu && (
        <div className="absolute bottom-full left-0 right-0 p-2 bg-white border border-gray-200 rounded-t-lg shadow-lg">
          <div className="flex items-center justify-around">
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-1 text-blue-500 bg-blue-100 rounded-full">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-xs">Photo</span>
            </button>
            
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowAttachmentMenu(false);
              }}
              className="flex flex-col items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <div className="flex items-center justify-center w-12 h-12 mb-1 text-purple-500 bg-purple-100 rounded-full">
                <File className="w-5 h-5" />
              </div>
              <span className="text-xs">Document</span>
            </button>
            
            <button
              type="button"
              onClick={toggleRecording}
              className={`flex flex-col items-center p-3 text-gray-700 rounded-lg hover:bg-gray-100 ${
                isRecording ? 'text-red-500' : ''
              }`}
            >
              <div 
                className={`flex items-center justify-center w-12 h-12 mb-1 rounded-full ${
                  isRecording 
                    ? 'bg-red-100 text-red-500' 
                    : 'bg-green-100 text-green-500'
                }`}
              >
                {isRecording ? (
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </div>
              <span className="text-xs">
                {isRecording ? 'Recording...' : 'Audio'}
              </span>
            </button>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="flex items-center p-2">
        {/* Attachment button */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 text-gray-500 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          disabled={isUploading || isRecording}
        >
          {showAttachmentMenu ? (
            <X className="w-5 h-5" />
          ) : (
            <Paperclip className="w-5 h-5" />
          )}
        </button>
        
        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.mp3,.wav,.ogg"
        />
        
        {/* Message input */}
        <div className="relative flex-1 mx-2">
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleChange}
            placeholder="Type a message..."
            className="w-full px-4 py-2 pr-12 text-gray-900 placeholder-gray-500 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-blue-500 focus:outline-none"
            disabled={isUploading || isRecording}
          />
          
          {/* Recording indicator */}
          {isRecording && (
            <div className="absolute right-0 flex items-center h-full pr-3 top-1/2 transform -translate-y-1/2">
              <div className="flex space-x-1">
                <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1 h-1 bg-red-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Send/Record button */}
        <button
          type="submit"
          disabled={(!message || !message.trim()) && !isRecording}
          className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isRecording
              ? 'text-red-500 bg-red-100 hover:bg-red-200 focus:ring-red-500'
              : message && message.trim()
              ? 'text-white bg-blue-500 hover:bg-blue-600 focus:ring-blue-500'
              : 'text-gray-400 bg-gray-100 cursor-not-allowed'
          }`}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRecording ? (
            <MicOff className="w-5 h-5" />
          ) : message && message.trim() ? (
            <Send className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
      </form>
      
      {/* Recording indicator */}
      {isRecording && (
        <div className="px-4 py-2 text-xs text-center text-red-500 bg-red-50">
          Recording... Tap to cancel, send to finish
        </div>
      )}
    </div>
  );
};

export default ChatInput;
