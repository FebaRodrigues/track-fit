// src/utils/serverPortDetector.js
import axios from 'axios';
import { API_BASE_URL, ENV_INFO } from './apiConfig';

// Global variable to track if port detection is in progress
let portDetectionPromise = null;

// Function to detect the server port - simplified to use our config
export const detectServerPort = async () => {
    // If detection is already in progress, return the existing promise
    if (portDetectionPromise) {
        return portDetectionPromise;
    }
    
    // Create a new promise for environment detection
    portDetectionPromise = new Promise(async (resolve) => {
        console.log('Detecting environment...');
        
        // Use the environment info from apiConfig
        if (ENV_INFO.isProduction) {
            console.log('Production environment detected from apiConfig');
            resolve('production');
            return 'production';
        } else {
            console.log('Development environment detected from apiConfig');
            resolve('development');
            return 'development';
        }
    });
    
    // Reset the promise after 30 seconds
    setTimeout(() => {
        portDetectionPromise = null;
    }, 30000);
    
    // Return the promise
    return portDetectionPromise;
};

// Reset the port detection promise
export const resetPortDetection = () => {
    portDetectionPromise = null;
    console.log('Environment detection reset.');
};

export default detectServerPort; 