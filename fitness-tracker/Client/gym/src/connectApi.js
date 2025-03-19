//src\connectApi.js

import axios from 'axios'
import { API_BASE_URL } from './utils/apiConfig'

// Check if we're in production (Vercel deployment)
const isProduction = window.location.hostname !== 'localhost';
const baseURL = isProduction ? '/api' : 'http://localhost:5050/api';

// Store the environment settings
if (isProduction) {
  localStorage.setItem('useRelativeApi', 'true');
} else {
  localStorage.setItem('useRelativeApi', 'false');
  localStorage.setItem('serverPort', '5050');
}

// Create API instance using the centralized configuration
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  
});

// Log the base URL being used
console.log(`ConnectAPI using base URL: ${API_BASE_URL}`);

export default API