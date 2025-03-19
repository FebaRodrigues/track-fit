// src/utils/serverPortDetector.js
import axios from 'axios';
import { updateServerPort } from '../api';

// Global variable to track if port detection is in progress
let portDetectionPromise = null;

// Function to detect the server port
export const detectServerPort = async () => {
    // If detection is already in progress, return the existing promise
    if (portDetectionPromise) {
        return portDetectionPromise;
    }
    
    // Create a new promise for port detection
    portDetectionPromise = new Promise(async (resolve) => {
        console.log('Detecting server endpoint...');
        
        // Check if we're in a production environment (Vercel deployment)
        const isProduction = window.location.hostname !== 'localhost';
        
        if (isProduction) {
            console.log('Production environment detected, using relative API paths');
            localStorage.setItem('useRelativeApi', 'true');
            resolve('production');
            return 'production';
        }
        
        // For development environment, try to connect to localhost:5050
        try {
            console.log('Development environment, trying port 5050...');
            const response = await axios.get('http://localhost:5050/api/health', {
                timeout: 5000 // Increased timeout for better chance of connection
            });
            
            if (response.status === 200 || response.status === 404) {
                console.log('Server confirmed on port 5050');
                localStorage.setItem('serverPort', '5050');
                localStorage.setItem('useRelativeApi', 'false');
                updateServerPort(5050);
                resolve(5050);
                return 5050;
            }
        } catch (error) {
            if (error.response) {
                console.log('Server found on port 5050 (got response but not 200)');
                localStorage.setItem('serverPort', '5050');
                localStorage.setItem('useRelativeApi', 'false');
                updateServerPort(5050);
                resolve(5050);
                return 5050;
            }
            console.log('Port 5050 not responding, but will still use it for development');
        }
        
        // Default for development environment
        console.log('Using port 5050 for development environment');
        localStorage.setItem('serverPort', '5050');
        localStorage.setItem('useRelativeApi', 'false');
        updateServerPort(5050);
        resolve(5050);
        return 5050;
    });
    
    // Reset the promise after 30 seconds to allow for fresh detection if needed
    setTimeout(() => {
        portDetectionPromise = null;
    }, 30000);
    
    // Return the promise
    return portDetectionPromise;
};

// Reset the port detection promise (useful for testing or forcing a new detection)
export const resetPortDetection = () => {
    portDetectionPromise = null;
    localStorage.removeItem('serverPort');
    localStorage.removeItem('useRelativeApi');
    
    // Check if we're in a production environment
    const isProduction = window.location.hostname !== 'localhost';
    if (isProduction) {
        localStorage.setItem('useRelativeApi', 'true');
    } else {
        localStorage.setItem('serverPort', '5050');
        localStorage.setItem('useRelativeApi', 'false');
    }
    
    console.log('Port detection reset. Will detect environment on next call.');
};

export default detectServerPort; 