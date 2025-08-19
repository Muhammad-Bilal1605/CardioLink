import axios from 'axios';
import { API_BASE_URL } from '../config';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true // Important for sending cookies with requests
});

// Request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
export const setupResponseInterceptors = (onUnauthenticated) => {
  // Response interceptor for API calls
  api.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      
      // Handle 401 Unauthorized errors
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
          // Attempt to refresh the token
          const response = await api.post('/auth/refresh-token');
          const { token } = response.data;
          
          // Store the new token
          localStorage.setItem('token', token);
          
          // Update the Authorization header
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Retry the original request with the new token
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, log the user out
          if (onUnauthenticated) {
            onUnauthenticated();
          }
          return Promise.reject(refreshError);
        }
      }
      
      // Handle other errors
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const { status, data } = error.response;
        
        // Handle specific error statuses
        switch (status) {
          case 400:
            console.error('Bad Request:', data.message || 'Invalid request');
            break;
          case 403:
            console.error('Forbidden:', 'You do not have permission to access this resource');
            break;
          case 404:
            console.error('Not Found:', 'The requested resource was not found');
            break;
          case 500:
            console.error('Server Error:', 'An unexpected error occurred on the server');
            break;
          default:
            console.error(`Error ${status}:`, data.message || 'An error occurred');
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Network Error:', 'Unable to connect to the server. Please check your internet connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Request Error:', error.message);
      }
      
      return Promise.reject(error);
    }
  );
};

/**
 * Make an authenticated API request
 * @param {string} method - HTTP method (get, post, put, delete, etc.)
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} [data] - Request payload (for POST, PUT, PATCH)
 * @param {Object} [params] - URL parameters
 * @param {Object} [headers] - Additional headers
 * @param {Object} [config] - Additional axios config
 * @returns {Promise<Object>} API response data
 */
const request = async ({
  method = 'get',
  endpoint,
  data = null,
  params = null,
  headers = {},
  ...config
}) => {
  try {
    const response = await api({
      method,
      url: endpoint,
      data,
      params,
      headers: {
        ...headers,
      },
      ...config,
    });
    
    return response.data;
  } catch (error) {
    // Error is already handled by the interceptor
    throw error;
  }
};

// Helper methods for common HTTP methods
const apiClient = {
  /**
   * GET request
   * @param {string} endpoint - API endpoint
   * @param {Object} [params] - URL parameters
   * @param {Object} [headers] - Additional headers
   * @param {Object} [config] - Additional axios config
   * @returns {Promise<Object>} Response data
   */
  get: (endpoint, params = null, headers = {}, config = {}) =>
    request({ method: 'get', endpoint, params, headers, ...config }),
  
  /**
   * POST request
   * @param {string} endpoint - API endpoint
   * @param {Object} [data] - Request payload
   * @param {Object} [params] - URL parameters
   * @param {Object} [headers] - Additional headers
   * @param {Object} [config] - Additional axios config
   * @returns {Promise<Object>} Response data
   */
  post: (endpoint, data = null, params = null, headers = {}, config = {}) =>
    request({ method: 'post', endpoint, data, params, headers, ...config }),
  
  /**
   * PUT request
   * @param {string} endpoint - API endpoint
   * @param {Object} [data] - Request payload
   * @param {Object} [params] - URL parameters
   * @param {Object} [headers] - Additional headers
   * @param {Object} [config] - Additional axios config
   * @returns {Promise<Object>} Response data
   */
  put: (endpoint, data = null, params = null, headers = {}, config = {}) =>
    request({ method: 'put', endpoint, data, params, headers, ...config }),
  
  /**
   * PATCH request
   * @param {string} endpoint - API endpoint
   * @param {Object} [data] - Request payload
   * @param {Object} [params] - URL parameters
   * @param {Object} [headers] - Additional headers
   * @param {Object} [config] - Additional axios config
   * @returns {Promise<Object>} Response data
   */
  patch: (endpoint, data = null, params = null, headers = {}, config = {}) =>
    request({ method: 'patch', endpoint, data, params, headers, ...config }),
  
  /**
   * DELETE request
   * @param {string} endpoint - API endpoint
   * @param {Object} [params] - URL parameters
   * @param {Object} [headers] - Additional headers
   * @param {Object} [config] - Additional axios config
   * @returns {Promise<Object>} Response data
   */
  delete: (endpoint, params = null, headers = {}, config = {}) =>
    request({ method: 'delete', endpoint, params, headers, ...config }),
  
  /**
   * Upload file
   * @param {string} endpoint - API endpoint
   * @param {File} file - File to upload
   * @param {string} fieldName - Field name for the file (default: 'file')
   * @param {Object} [data] - Additional form data
   * @param {Function} [onUploadProgress] - Upload progress callback
   * @returns {Promise<Object>} Upload response data
   */
  upload: (endpoint, file, fieldName = 'file', data = {}, onUploadProgress) => {
    const formData = new FormData();
    
    // Append file
    formData.append(fieldName, file);
    
    // Append additional data
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    
    return request({
      method: 'post',
      endpoint,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },
};

export { apiClient as default, setupResponseInterceptors };