// src/utils/apiConfig.js

// Determine if we're in production environment
const isProduction = window.location.hostname !== 'localhost';

// Check if we should use CORS proxy - ensure we handle the value correctly
const corsProxyEnv = import.meta.env.VITE_USE_CORS_PROXY || 'false';
console.log('CORS proxy env value:', corsProxyEnv);

// Force enable CORS proxy in production for now due to CORS issues
const useCorsProxy = isProduction ? true : (corsProxyEnv === 'true');

// CORS proxy URL
const CORS_PROXY = 'https://corsproxy.io/?';

// Backend server URL
const BACKEND_URL = 'https://trackfit-server.onrender.com/api';

// Set the API base URL based on environment
export const API_BASE_URL = isProduction 
  ? (useCorsProxy ? `${CORS_PROXY}${encodeURIComponent(BACKEND_URL)}` : BACKEND_URL)
  : 'http://localhost:5050/api';

// For logging purposes
console.log(`Using API base URL: ${API_BASE_URL} (${isProduction ? 'production' : 'development'})`);
console.log(`CORS proxy: ${useCorsProxy ? 'enabled' : 'disabled'}`);

// Helper function to get the full API URL for a given endpoint
export const getApiUrl = (endpoint) => {
  // Make sure endpoint doesn't start with a slash if we're adding it to the base URL
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  if (isProduction && useCorsProxy) {
    // For CORS proxy, we need to encode the full URL
    return `${CORS_PROXY}${encodeURIComponent(`${BACKEND_URL}/${normalizedEndpoint}`)}`;
  }
  
  return `${API_BASE_URL}/${normalizedEndpoint}`;
};

// Health check function that respects environment
export const healthCheck = async () => {
  try {
    const healthCheckUrl = getApiUrl('health');
    console.log(`Health check URL: ${healthCheckUrl}`);
    
    const response = await fetch(healthCheckUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });
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