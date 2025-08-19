const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const mkdir = promisify(fs.mkdir);
const access = promisify(fs.access);

/**
 * Creates a directory if it doesn't exist
 * @param {string} dirPath - Path to the directory
 * @returns {Promise<void>}
 */
async function createDirectoryIfNotExists(dirPath) {
  try {
    await access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await mkdir(dirPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Gets the file extension from a filename
 * @param {string} filename - The filename
 * @returns {string} The file extension (without the dot)
 */
function getFileExtension(filename) {
  return path.extname(filename).slice(1).toLowerCase();
}

/**
 * Gets the MIME type based on file extension
 * @param {string} filename - The filename
 * @returns {string} The MIME type
 */
function getMimeType(filename) {
  const extension = getFileExtension(filename);
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'mp4': 'video/mp4',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed'
  };

  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Validates if a file type is allowed
 * @param {string} mimeType - The MIME type to validate
 * @returns {boolean} True if allowed, false otherwise
 */
function isAllowedFileType(mimeType) {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/mpeg',
    'audio/wav',
    'audio/mp4',
    'video/mp4',
    'application/zip',
    'application/x-rar-compressed'
  ];

  return allowedTypes.includes(mimeType);
}

/**
 * Deletes a file
 * @param {string} filePath - Path to the file to delete
 * @returns {Promise<boolean>} True if deleted, false if file doesn't exist
 */
async function deleteFile(filePath) {
  try {
    await access(filePath);
    await fs.promises.unlink(filePath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

module.exports = {
  createDirectoryIfNotExists,
  getFileExtension,
  getMimeType,
  isAllowedFileType,
  deleteFile
};
