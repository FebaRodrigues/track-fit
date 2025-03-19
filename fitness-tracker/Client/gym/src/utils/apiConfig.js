// src/utils/apiConfig.js

// Determine if we're in production environment
const isProduction = window.location.hostname !== 'localhost';

// We don't need CORS proxy because we're using local API endpoints
const useCorsProxy = false;

// Set the API base URL based on environment
// In production, use relative '/api' path which will be handled by Vercel
export const API_BASE_URL = isProduction 
  ? '/api'
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
    const healthCheckUrl = `${API_BASE_URL}/health`;
    console.log(`Health check URL: ${healthCheckUrl}`);
    
    // Set a timeout for the fetch to avoid long waits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

// Export environment information
export const ENV_INFO = {
  isProduction,
  apiBaseUrl: API_BASE_URL,
  useCorsProxy
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