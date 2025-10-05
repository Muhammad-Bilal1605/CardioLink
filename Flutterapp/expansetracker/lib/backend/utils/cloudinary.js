import { v2 as cloudinary } from 'cloudinary';
import { promisify } from 'util';
import stream from 'stream';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Promisify Cloudinary's upload method
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', ...options },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    // Create a buffer stream and pipe it to Cloudinary
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });
};

// Promisify other Cloudinary methods
const deleteFromCloudinary = promisify(cloudinary.uploader.destroy);

export { uploadToCloudinary, deleteFromCloudinary };

// This utility provides:
// 1. Cloudinary configuration using environment variables
// 2. A promise-based upload function that works with file buffers
// 3. A promise-based delete function for removing files from Cloudinary
