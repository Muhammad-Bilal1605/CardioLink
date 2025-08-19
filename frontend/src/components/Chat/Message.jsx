import React from 'react';
import { format } from 'date-fns';
import { FileText, Image as ImageIcon, File as FileIcon, Mic, FileAudio, FileVideo, Download } from 'lucide-react';

const Message = ({ 
  message, 
  isCurrentUser, 
  showAvatar = true, 
  showTimestamp = true,
  formatDate = (date) => format(new Date(date), 'h:mm a')
}) => {
  if (!message) return null;

  // Determine message type based on messageType field
  const messageType = message.messageType || 'text';

  // Format message time
  const formattedTime = message.createdAt ? formatDate(message.createdAt) : '';

  // Get file extension from URL or filename
  const getFileExtension = (url) => {
    if (!url) return '';
    const filename = url.split('/').pop() || '';
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  // Get file name from URL
  const getFileName = (url) => {
    if (!url) return 'File';
    return decodeURIComponent(url.split('/').pop() || 'File');
  };

  // Format file size (if available in the future)
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Get file icon based on extension or message type
  const getFileIcon = (url, type) => {
    const ext = url ? getFileExtension(url) : '';
    
    // First check message type
    if (type === 'image') return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (type === 'audio') return <Mic className="w-5 h-5 text-purple-500" />;
    if (type === 'video') return <FileVideo className="w-5 h-5 text-red-500" />;
    if (type === 'document') return <FileText className="w-5 h-5 text-blue-500" />;
    
    // Fallback to extension check
    const docExtensions = ['pdf', 'doc', 'docx', 'txt', 'rtf'];
    const sheetExtensions = ['xls', 'xlsx', 'csv'];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a'];
    const videoExtensions = ['mp4', 'webm', 'mov'];
    
    if (imageExtensions.includes(ext)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    if (audioExtensions.includes(ext)) return <Mic className="w-5 h-5 text-purple-500" />;
    if (videoExtensions.includes(ext)) return <FileVideo className="w-5 h-5 text-red-500" />;
    if (docExtensions.includes(ext)) return <FileText className="w-5 h-5 text-blue-500" />;
    if (sheetExtensions.includes(ext)) return <FileIcon className="w-5 h-5 text-green-500" />;
    return <FileIcon className="w-5 h-5 text-gray-500" />;
  };

  // Message content based on type
  const renderContent = () => {
    const mediaUrl = message.mediaUrl || '';
    
    switch (messageType) {
      case 'text':
        return (
          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
            {message.message || message.content || ''}
          </div>
        );

      case 'image':
        return (
          <div className="relative">
            <img 
              src={mediaUrl} 
              alt={message.message || 'Shared image'} 
              className="max-w-xs rounded-lg shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(mediaUrl, '_blank')}
            />
            {message.message && (
              <p className="mt-1 text-sm text-gray-900">{message.message}</p>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="flex items-center p-3 bg-white border border-gray-200 rounded-lg">
            <div className="flex-shrink-0 p-2 bg-purple-100 rounded-lg">
              <Mic className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.message || 'Audio message'}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(message.fileSize)}
              </p>
            </div>
            <audio 
              controls 
              src={mediaUrl}
              className="ml-4 flex-1 max-w-xs"
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative">
            <video 
              src={mediaUrl}
              controls
              className="max-w-xs rounded-lg shadow-sm"
            />
            {message.message && (
              <p className="mt-1 text-sm text-gray-900">{message.message}</p>
            )}
          </div>
        );

      case 'document':
      default:
        return (
          <a
            href={mediaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
              {getFileIcon(mediaUrl, messageType)}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.message || getFileName(mediaUrl) || 'Document'}
              </p>
              <p className="text-xs text-gray-500">
                {formatFileSize(message.fileSize)} • {getFileExtension(mediaUrl).toUpperCase()}
              </p>
            </div>
            <div className="ml-4 p-1 text-gray-400 hover:text-blue-500">
              <Download className="w-4 h-4" />
            </div>
          </a>
        );
    }
  };

  // Message status indicator based on status field
  const renderStatus = () => {
    if (!isCurrentUser) return null;
    
    return (
      <div className="flex items-center justify-end space-x-1">
        {showTimestamp && (
          <span className="text-xs text-gray-500">
            {formattedTime}
          </span>
        )}
        <div className="flex items-center">
          {message.status === 'sent' && (
            <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {message.status === 'delivered' && (
            <div className="flex -space-x-1">
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
          {message.status === 'read' && (
            <div className="flex -space-x-1">
              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Current user's message (right-aligned)
  if (isCurrentUser) {
    return (
      <div className="flex justify-end mb-4 group">
        <div className="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl">
          {renderStatus()}
          <div className={`p-3 rounded-lg bg-blue-600 text-white ${
            messageType === 'text' ? 'rounded-tr-none' : ''
          }`}>
            {renderContent()}
          </div>
        </div>
        {showAvatar && (
          <div className="ml-2 flex-shrink-0">
            <img
              src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'U')}&background=random`}
              alt={message.sender?.name || 'You'}
              className="w-8 h-8 rounded-full object-cover"
            />
          </div>
        )}
      </div>
    );
  }

  // Other user's message (left-aligned)
  return (
    <div className="flex mb-4 group">
      {showAvatar && (
        <div className="mr-2 flex-shrink-0">
          <img
            src={message.sender?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(message.sender?.name || 'U')}&background=random`}
            alt={message.sender?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover"
          />
        </div>
      )}
      <div className="max-w-xs md:max-w-md lg:max-w-lg xl:max-w-2xl">
        {showAvatar && message.sender?.name && (
          <div className="mb-1">
            <span className="text-xs font-medium text-gray-900">
              {message.sender.name}
            </span>
          </div>
        )}
        <div className="bg-gray-100 p-3 rounded-lg rounded-tl-none">
          {renderContent()}
        </div>
        {showTimestamp && (
          <div className="mt-1">
            <span className="text-xs text-gray-500">
              {formattedTime}
            </span>
            {message.read && (
              <span className="ml-2 text-xs text-blue-500">
                Read
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
