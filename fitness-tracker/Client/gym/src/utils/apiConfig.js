// src/utils/apiConfig.js

// Determine if we're in production environment
const isProduction = window.location.hostname !== 'localhost';

// Set the API base URL based on environment
export const API_BASE_URL = isProduction 
  ? 'https://trackfit-server.onrender.com/api' 
  : 'http://localhost:5050/api';

// For logging purposes
console.log(`Using API base URL: ${API_BASE_URL} (${isProduction ? 'production' : 'development'})`);

// Helper function to get the full API URL for a given endpoint
export const getApiUrl = (endpoint) => {
  // Make sure endpoint doesn't start with a slash if we're adding it to the base URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_BASE_URL}/${normalizedEndpoint}`;
};

// Health check function that respects environment
export const healthCheck = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Export environment information
export const ENV_INFO = {
  isProduction,
  apiBaseUrl: API_BASE_URL
};

// Set localStorage values for consistency with other code
if (isProduction) {
  localStorage.setItem('useRelativeApi', 'true');
} else {
  localStorage.setItem('useRelativeApi', 'false');
  localStorage.setItem('serverPort', '5050');
}

export default {
  API_BASE_URL,
  getApiUrl,
  isProduction,
  healthCheck
}; 