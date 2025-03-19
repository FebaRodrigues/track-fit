//src\connectApi.js

import axios from 'axios'
import { API_BASE_URL } from './utils/apiConfig'

// Create API instance using the centralized configuration
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,  
});

// Log the base URL being used
console.log(`ConnectAPI using base URL: ${API_BASE_URL}`);

export default API;