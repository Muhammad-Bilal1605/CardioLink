const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { createDirectoryIfNotExists, getMimeType, isAllowedFileType } = require('./fileUtils');

// Base upload directory
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const CHAT_UPLOAD_DIR = path.join(UPLOAD_DIR, 'chat');

/**
 * Uploads a file to the server
 * @param {Object} file - Multer file object
 * @returns {Promise<Object>} Upload result with URL and file info
 */
const uploadFile = async (file) => {
  try {
    // Ensure upload directories exist
    await createDirectoryIfNotExists(UPLOAD_DIR);
    await createDirectoryIfNotExists(CHAT_UPLOAD_DIR);

    // Validate file type
    const mimeType = getMimeType(file.originalname);
    if (!isAllowedFileType(mimeType)) {
      throw new Error('File type not allowed');
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(CHAT_UPLOAD_DIR, uniqueName);

    // Move file to upload directory
    await require('fs').promises.rename(file.path, filePath);

    // Determine file type category
    let fileType = 'document';
    if (mimeType.startsWith('image/')) {
      fileType = 'image';
    } else if (mimeType.startsWith('audio/')) {
      fileType = 'audio';
    } else if (mimeType.startsWith('video/')) {
      fileType = 'video';
    }

    // Return file information
    return {
      success: true,
      url: `/uploads/chat/${uniqueName}`,
      path: filePath,
      filename: file.originalname,
      size: file.size,
      mimeType,
      type: fileType,
      name: path.basename(file.originalname, fileExt)
    };
  } catch (error) {
    // Clean up the file if upload fails
    if (file && file.path) {
      try {
        await require('fs').promises.unlink(file.path);
      } catch (e) {
        console.error('Error cleaning up file:', e);
      }
    }
    console.error('File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Deletes a file from the server
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<boolean>} True if deleted, false if file doesn't exist
 */
const deleteUploadedFile = async (filePath) => {
  try {
    const fs = require('fs').promises;
    await fs.access(filePath);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false; // File doesn't exist
    }
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

module.exports = {
  uploadFile,
  deleteUploadedFile,
  UPLOAD_DIR,
  CHAT_UPLOAD_DIR
};
