//src\connectApi.js

import axios from 'axios'

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

const API = axios.create({
    baseURL: baseURL,
    withCredentials: true,  
});

export default API