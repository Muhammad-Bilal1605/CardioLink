import axios from 'axios';
import { API_BASE_URL } from '../config';

/**
 * Uploads a file to the server with progress tracking
 * @param {File} file - The file to upload
 * @param {string} type - The type of file ('image', 'document', 'audio')
 * @param {string} token - The authentication token
 * @param {function} onProgress - Callback for upload progress (0-100)
 * @returns {Promise<Object>} The uploaded file data
 */
export const uploadFile = async (file, type, token, onProgress = () => {}) => {
  if (!file) throw new Error('No file provided');

  // Validate file type
  const validTypes = ['image', 'document', 'audio'];
  if (!validTypes.includes(type)) {
    throw new Error(`Invalid file type. Must be one of: ${validTypes.join(', ')}`);
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', type);

  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/upload`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.lengthComputable) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percentCompleted);
          }
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('File upload error:', error);
    
    let errorMessage = 'Failed to upload file';
    if (error.response) {
      errorMessage = error.response.data?.message || errorMessage;
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your connection.';
    }
    
    throw new Error(errorMessage);
  }
};

/**
 * Validates a file before upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedTypes - Allowed MIME types or file extensions
 * @param {number} options.maxSize - Maximum file size in bytes (default: 10MB)
 * @returns {{valid: boolean, error: string|null}}
 */
export const validateFile = (file, { allowedTypes = [], maxSize = 10 * 1024 * 1024 } = {}) => {
  if (!file) return { valid: false, error: 'No file selected' };

  // Check file size
  if (file.size > maxSize) {
    const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(2);
    return { 
      valid: false, 
      error: `File is too large. Maximum size is ${maxSizeMB}MB.` 
    };
  }

  // Check file type if allowedTypes is provided
  if (allowedTypes.length > 0) {
    const fileType = file.type || file.name.split('.').pop().toLowerCase();
    const isTypeValid = allowedTypes.some(type => 
      fileType.startsWith(type) || 
      fileType === type || 
      file.name.toLowerCase().endsWith(`.${type.toLowerCase()}`)
    );

    if (!isTypeValid) {
      return { 
        valid: false, 
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` 
      };
    }
  }

  return { valid: true, error: null };
};

/**
 * Generates a preview URL for a file (for images, videos, etc.)
 * @param {File} file - The file to generate a preview for
 * @returns {Promise<string>} A data URL for the file
 */
export const generatePreviewUrl = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // For non-media files, return a generic icon
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      resolve(getFileIcon(file));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (error) => reject(error);
    
    if (file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      // For videos, return a video icon
      resolve('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXBsYXkiPjxwb2x5Z29uIHBvaW50cz0iNSAzIDE5IDEyIDUgMjEgNSAzIi8+PC9zdmc+');
    }
  });
};

// Helper function to get appropriate file icon
const getFileIcon = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  const type = file.type.split('/')[0];
  
  // Document icons
  const documentIcons = {
    pdf: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtdGV4dCI+PHBhdGggZD0iTTE0LjUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjcuNUwxNC41IDJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiLz48cGF0aCBkPSJNMTAgOUg4Ii8+PHBhdGggZD0iTTE2IDEzSDgiLz48cGF0aCBkPSJNMTYgMTdIMTBNMTIgMTNINCIvPjwvc3ZnPg==',
    doc: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtdGV4dCI+PHBhdGggZD0iTTE0LjUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjcuNUwxNC41IDJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiLz48cGF0aCBkPSJNMTAgOUg4Ii8+PHBhdGggZD0iTTE2IDEzSDgiLz48cGF0aCBkPSJNMTYgMTdIMTBNMTIgMTNINCIvPjwvc3ZnPg==',
    docx: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtdGV4dCI+PHBhdGggZD0iTTE0LjUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjcuNUwxNC41IDJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiLz48cGF0aCBkPSJNMTAgOUg4Ii8+PHBhdGggZD0iTTE2IDEzSDgiLz48cGF0aCBkPSJNMTYgMTdIMTBNMTIgMTNINCIvPjwvc3ZnPg==',
    xls: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoZWV0cyI+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIgcnkyPSIyIi8+PHBhdGggZD0iTTMgOXYxOGExIDEgMCAwIDAgMS0xaDE0YTEgMSAwIDAgMCAxLTFWOGEyIDIgMCAwIDAtMi0yS2EyIDIgMCAwIDAtMiAydjFaIi8+PHBhdGggZD0iTTkgMTJoNiIvPjxwYXRoIGQ9Ik05IDE2aDYiLz48cGF0aCBkPSJNMTAgMTB2NCIvPjwvc3ZnPg==',
    xlsx: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXNoZWV0cyI+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIgcnkyPSIyIi8+PHBhdGggZD0iTTMgOXYxOGExIDEgMCAwIDAgMS0xaDE0YTEgMSAwIDAgMCAxLTFWOGEyIDIgMCAwIDAtMi0yS2EyIDIgMCAwIDAtMiAydjFaIi8+PHBhdGggZD0iTTkgMTJoNiIvPjxwYXRoIGQ9Ik05IDE2aDYiLz48cGF0aCBkPSJNMTAgMTB2NCIvPjwvc3ZnPg==',
    txt: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtdGV4dCI+PHBhdGggZD0iTTE0LjUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjcuNUwxNC41IDJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiLz48cGF0aCBkPSJNMTAgOUg4Ii8+PHBhdGggZD0iTTE2IDEzSDgiLz48cGF0aCBkPSJNMTYgMTdIMTBNMTIgMTNINCIvPjwvc3ZnPg==',
  };

  // Audio icons
  const audioIcons = {
    mp3: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXZvbHVtZS0yIj48cG9seWdvbiBwb2ludHM9IjExIDUgNiA5IDIgOSAyIDE1IDYgMTUgMTEgMTkgMTEgNSIvPjxwYXRoIGQ9Ik0xNS41OSA4LjU4YTUgNSAwIDAxMCA3LjA3Ii8+PHBhdGggZD0iTTE3LjcgNi43YTkgOSAwIDAxMCAxMi43Ii8+PC9zdmc+',
    wav: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXZvbHVtZS0yIj48cG9seWdvbiBwb2ludHM9IjExIDUgNiA5IDIgOSAyIDE1IDYgMTUgMTEgMTkgMTEgNSIvPjxwYXRoIGQ9Ik0xNS41OSA4LjU4YTUgNSAwIDAxMCA3LjA3Ii8+PHBhdGggZD0iTTE3LjcgNi43YTkgOSAwIDAxMCAxMi43Ii8+PC9zdmc+',
    ogg: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXZvbHVtZS0yIj48cG9seWdvbiBwb2ludHM9IjExIDUgNiA5IDIgOSAyIDE1IDYgMTUgMTEgMTkgMTEgNSIvPjxwYXRoIGQ9Ik0xNS41OSA4LjU4YTUgNSAwIDAxMCA3LjA3Ii8+PHBhdGggZD0iTTE3LjcgNi43YTkgOSAwIDAxMCAxMi43Ii8+PC9zdmc+',
  };

  // Archive/zip icons
  const archiveIcons = {
    zip: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZvbGRlci1hcmNoaXZlIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE5IiByPSIyIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjE5IiByPSIyIi8+PHBhdGggZD0iTTIyIDEwYTMgMyAwIDAwLTMtM2gtMmEzIDMgMCAwMC0zLTNIMTBhMyAzIDAgMDAtMyAzdjE5aDEyYTMgMyAwIDAwMy0zIi8+PHBhdGggZD0iTTE5IDEwVjVhMiAyIDAgMDAtMi0yaC0xIi8+PC9zdmc+',
    rar: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZvbGRlci1hcmNoaXZlIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE5IiByPSIyIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjE5IiByPSIyIi8+PHBhdGggZD0iTTIyIDEwYTMgMyAwIDAwLTMtM2gtMmEzIDMgMCAwMC0zLTNIMTBhMyAzIDAgMDAtMyAzdjE5aDEyYTMgMyAwIDAwMy0zIi8+PHBhdGggZD0iTTE5IDEwVjVhMiAyIDAgMDAtMi0yaC0xIi8+PC9zdmc+',
    '7z': 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZvbGRlci1hcmNoaXZlIj48Y2lyY2xlIGN4PSIxNSIgY3k9IjE5IiByPSIyIi8+PGNpcmNsZSBjeD0iOSIgY3k9IjE5IiByPSIyIi8+PHBhdGggZD0iTTIyIDEwYTMgMyAwIDAwLTMtM2gtMmEzIDMgMCAwMC0zLTNIMTBhMyAzIDAgMDAtMyAzdjE5aDEyYTMgMyAwIDAwMy0zIi8+PHBhdGggZD0iTTE5IDEwVjVhMiAyIDAgMDAtMi0yaC0xIi8+PC9zdmc+',
  };

  // Check for specific file types
  if (documentIcons[extension]) return documentIcons[extension];
  if (audioIcons[extension]) return audioIcons[extension];
  if (archiveIcons[extension]) return archiveIcons[extension];

  // Default icons by MIME type
  if (type === 'image') {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWltYWdlIj48cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTgiIHg9IjMiIHk9IjMiIHJ4PSIyIiByeT0iMiIvPjxjaXJjbGUgY3g9IjguNSIgY3k9IjguNSIgcj0iMS41Ii8+PHBvbHlsaW5lIHBvaW50cz0iMjEgMTUgMTYgMTAgNSAyMSIvPjwvc3ZnPg==';
  }
  
  if (type === 'audio') {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXZvbHVtZS0yIj48cG9seWdvbiBwb2ludHM9IjExIDUgNiA5IDIgOSAyIDE1IDYgMTUgMTEgMTkgMTEgNSIvPjxwYXRoIGQ9Ik0xNS41NCA4LjQ2YTUgNSAwIDAxMCA3LjA3Ii8+PHBhdGggZD0iTTE5LjA3IDRhMTAgMTAgMCAwMTAgMTQiLz48L3N2Zz4=';
  }
  
  if (type === 'video') {
    return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLXZpZGVvIiA+PHBvbHlnb24gcG9pbnRzPSIyMiA4IDI4IDEyIDIyIDE2IDIyIDgiLz48cmVjdCB4PSIyIiB5PSI0IiB3aWR0aD0iMTUiIGhlaWdodD0iMTYiIHJ4PSIyIiByeT0iMiIvPjwvc3ZnPg==';
  }

  // Default file icon
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9ImN1cnJlbnRDb2xvciIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiIGNsYXNzPSJsdWNpZGUgbHVjaWRlLWZpbGUtdGV4dCI+PHBhdGggZD0iTTE0LjUgMkg2YTIgMiAwIDAgMC0yIDJ2MTZhMiAyIDAgMCAwIDIgMmgxMmEyIDIgMCAwIDAgMi0yVjcuNUwxNC41IDJ6Ii8+PHBvbHlsaW5lIHBvaW50cz0iMTQgMiAxNCA4IDIwIDgiLz48cGF0aCBkPSJNMTAgOUg4Ii8+PHBhdGggZD0iTTE2IDEzSDgiLz48cGF0aCBkPSJNMTYgMTdIMTBNMTIgMTNINCIvPjwvc3ZnPg==';
};

/**
 * Formats file size to human readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};
