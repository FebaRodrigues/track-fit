//src\connectApi.js

import axios from 'axios'
import { API_BASE_URL, ENV_INFO } from './utils/apiConfig'

// Create API instance using the centralized configuration
const API = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: ENV_INFO.useCorsProxy ? false : true,  // Don't use withCredentials when using CORS proxy
});

// Log the base URL being used
console.log(`ConnectAPI using base URL: ${API_BASE_URL}`);
console.log(`ConnectAPI CORS proxy: ${ENV_INFO.useCorsProxy ? 'enabled' : 'disabled'}`);

export default API;