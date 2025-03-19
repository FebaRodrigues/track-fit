//src\connectApi.js

import axios from 'axios'

// Check if we're in production (Vercel deployment)
const useRelativeApi = localStorage.getItem('useRelativeApi') === 'true';
const baseURL = useRelativeApi ? '/api' : 'http://localhost:5050/api';

const API = axios.create({
    baseURL: baseURL,
    withCredentials: true,  
});

export default API