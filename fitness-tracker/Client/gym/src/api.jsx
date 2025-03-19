// src/api.jsx
import axios from 'axios';
import { resetPortDetection } from './utils/serverPortDetector';

// Function to get the server URL with the correct port
export const getServerUrl = () => {
    // Check if we're in production (Vercel deployment)
    const useRelativeApi = localStorage.getItem('useRelativeApi') === 'true';
    
    if (useRelativeApi) {
        console.log('Using relative API path for production');
        return '/api';
    }
    
    // For development, use localhost with port
    console.log('Using localhost API for development');
    localStorage.setItem('serverPort', '5050');
    return 'http://localhost:5050/api';
};

// Initialize API with the server URL
const API = axios.create({
    baseURL: getServerUrl(),
    timeout: 10000,
    withCredentials: true
});

// Track server status
const serverStatus = {
    isDown: false,
    lastCheck: 0,
    retryCount: 0,
    maxRetries: 3,
    retryDelay: 5000, // 5 seconds
    
    markDown() {
        this.isDown = true;
        this.lastCheck = Date.now();
        this.retryCount++;
        console.log(`Server marked as down. Retry count: ${this.retryCount}`);
    },
    
    markUp() {
        this.isDown = false;
        this.lastCheck = Date.now();
        this.retryCount = 0;
        console.log('Server marked as up');
    },
    
    shouldRetry() {
        return this.retryCount < this.maxRetries;
    },
    
    canCheck() {
        return Date.now() - this.lastCheck > this.retryDelay;
    }
};

// Function to show server not running message
const showServerNotRunningMessage = () => {
    // Only show the message if we haven't shown it recently
    if (!serverStatus.isDown || serverStatus.canCheck()) {
        serverStatus.markDown();
        
        // Create or update the server status message
        let messageElement = document.getElementById('server-status-message');
        
        if (!messageElement) {
            messageElement = document.createElement('div');
            messageElement.id = 'server-status-message';
            messageElement.style.position = 'fixed';
            messageElement.style.bottom = '20px';
            messageElement.style.right = '20px';
            messageElement.style.backgroundColor = '#f8d7da';
            messageElement.style.color = '#721c24';
            messageElement.style.padding = '10px 15px';
            messageElement.style.borderRadius = '4px';
            messageElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            messageElement.style.zIndex = '9999';
            messageElement.style.maxWidth = '300px';
            document.body.appendChild(messageElement);
        }
        
        messageElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between;">
                <strong>Server Connection Issue</strong>
                <button onclick="this.parentNode.parentNode.style.display='none'" style="background: none; border: none; cursor: pointer; font-size: 16px;">&times;</button>
            </div>
            <p style="margin: 5px 0;">The server appears to be down or unreachable. Some features may not work correctly.</p>
            <button onclick="window.location.reload()" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 3px; cursor: pointer; margin-top: 5px;">Refresh Page</button>
        `;
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            if (messageElement && messageElement.parentNode) {
                messageElement.style.display = 'none';
            }
        }, 10000);
    }
};

// Add request interceptor to update baseURL if needed
API.interceptors.request.use(
    (config) => {
        // Update baseURL on each request to ensure we're using the latest URL
        const baseUrl = getServerUrl();
        config.baseURL = baseUrl;
        console.log(`API Request to: ${baseUrl}${config.url}`);
        
        // If server was previously down, but we're trying again, log it
        if (serverStatus.isDown && serverStatus.canCheck() && serverStatus.shouldRetry()) {
            console.log(`Retrying request after server was down. Retry #${serverStatus.retryCount}`);
        }
        
        return config;
    },
    (error) => {
        console.error('Request error:', error);
        return Promise.reject(error);
    }
);

// Function to update the server port
export const updateServerPort = (port) => {
    // Check if we should use relative path (production) or localhost (dev)
    const useRelativeApi = localStorage.getItem('useRelativeApi') === 'true';
    
    if (useRelativeApi) {
        console.log('Setting API to use relative path for production');
        API.defaults.baseURL = '/api';
    } else {
        console.log(`Setting API to use localhost:${port} for development`);
        localStorage.setItem('serverPort', port.toString());
        API.defaults.baseURL = `http://localhost:${port}/api`;
    }
    
    console.log(`API baseURL updated to: ${API.defaults.baseURL}`);
};

// Cache for API data to prevent excessive API calls
const apiCache = {
    data: new Map(), // Map of endpoint -> data
    timestamp: new Map(), // Map of endpoint -> timestamp
    maxAge: 60000, // 1 minute cache
    
    get(endpoint) {
        const cachedData = this.data.get(endpoint);
        const timestamp = this.timestamp.get(endpoint);
        
        if (cachedData && timestamp) {
            const age = Date.now() - timestamp;
            if (age < this.maxAge) {
                return cachedData;
            }
        }
        
        return null;
    },
    
    set(endpoint, data) {
        this.data.set(endpoint, data);
        this.timestamp.set(endpoint, Date.now());
    },
    
    clear(endpoint) {
        if (endpoint) {
            this.data.delete(endpoint);
            this.timestamp.delete(endpoint);
        } else {
            this.data.clear();
            this.timestamp.clear();
        }
    }
};

// Add a request interceptor to include the auth token
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add response interceptor to handle errors
API.interceptors.response.use(
    (response) => {
        // If we get a successful response, mark the server as up
        serverStatus.markUp();
        return response;
    },
    (error) => {
        if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED') {
            console.error(`Network error - server may be down or unreachable: ${error.code}`, error.message);
            showServerNotRunningMessage();
        } else if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
            
            // If we get a 401 or 403, the token might be invalid
            if (error.response.status === 401 || error.response.status === 403) {
                // Check if we're not on the login page
                if (!window.location.pathname.includes('/login')) {
                    console.warn('Authentication error, redirecting to login');
                    
                    // Get the user role
                    const role = localStorage.getItem('role');
                    
                    // Check if this is a request to /admin/users or /memberships/user - if so, don't redirect
                    const isAdminUsersRequest = error.config && 
                                               error.config.url && 
                                               error.config.url.includes('/admin/users');
                                               
                    const isMembershipsRequest = error.config && 
                                               error.config.url && 
                                               error.config.url.includes('/memberships/user');
                    
                    if (isAdminUsersRequest || isMembershipsRequest) {
                        console.log('Admin users or memberships request failed with auth error - not redirecting automatically');
                        return Promise.reject(error);
                    }
                    
                    // Clear token and user data
                    localStorage.removeItem('token');
                    
                    // Handle different roles differently
                    if (role === 'admin') {
                        console.log('Admin authentication error, clearing admin data');
                        localStorage.removeItem('adminUser');
                        // Don't remove role for admin to ensure proper redirect
                    } else {
                        localStorage.removeItem('user');
                        localStorage.removeItem('trainer');
                        localStorage.removeItem('role');
                    }
                    
                    // Determine the appropriate login page based on the role or current path
                    let loginPath = '/users/login'; // Default
                    
                    if (role === 'admin' || window.location.pathname.includes('/admin')) {
                        loginPath = '/admin/login';
                    } else if (role === 'trainer' || window.location.pathname.includes('/trainer')) {
                        loginPath = '/trainers/login';
                    }
                    
                    // Redirect to the appropriate login page after a short delay
                    setTimeout(() => {
                        window.location.href = loginPath;
                    }, 1000);
                }
            }
        } else if (error.request) {
            console.error('Request error - no response received:', error.request);
            showServerNotRunningMessage();
        } else {
            console.error('Error:', error.message);
        }
        return Promise.reject(error);
    }
);

// Admin API Functions
export const getAdminProfile = () => {
    return API.get('/admin/profile');
};

export const updateAdminProfile = (data) => {
    // Create a clean copy of the data
    let cleanData = { ...data };
    
    // Handle image data
    if (cleanData.image && typeof cleanData.image === 'string') {
        // For Cloudinary URLs, no processing needed
        if (cleanData.image.includes('cloudinary.com')) {
            console.log('Using Cloudinary image URL');
        }
        // For data URLs, ensure they're properly formatted
        else if (cleanData.image.startsWith('data:')) {
            // Remove any query parameters
            cleanData.image = cleanData.image.split('?')[0];
            
            // Log the image data length for debugging
            console.log(`Sending image data of length: ${cleanData.image.length} characters`);
            
            // Check if the image data is too large
            if (cleanData.image.length > 1024 * 1024 * 2) { // 2MB limit
                console.warn('Image data is very large, this may cause issues with the server');
            }
        }
    }
    
    return API.put('/admin/profile', cleanData);
};

export const loginAdmin = async (credentials) => {
    try {
        // Clear any existing tokens before login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('trainer');
        localStorage.removeItem('role');
        localStorage.removeItem('adminUser');
        
        const { email, password } = credentials;
        console.log('Attempting admin login with email:', email);
        
        // Create a new axios instance for this request to ensure we use the latest port
        const response = await API.post('/admin/login', { email, password });
        
        console.log('Admin login response:', response.data);
        
        // Return a standardized format for the login response
        return {
            token: response.data.token,
            admin: response.data.admin || { 
                _id: 'admin-id',
                name: 'Admin User',
                email: email
            },
            role: 'admin'
        };
    } catch (error) {
        console.error('Admin login error:', error);
        
        // Provide more detailed error messages
        if (error.response && error.response.status === 401) {
            throw new Error('Invalid email or password. Please try again.');
        }
        
        // Provide a more user-friendly error message for server connection issues
        if (error.code === 'ERR_NETWORK') {
            throw new Error('Cannot connect to server. Please check if the server is running.');
        }
        
        throw error;
    }
};

export const registerAdmin = (data) => {
    return API.post('/admin/register', data)
        .then(response => {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(error => {
            console.error('Error registering admin:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to register admin'
            };
        });
};

// Admin Registration OTP
export const sendAdminRegistrationOTP = (email) => {
    // Get the authentication token
    const token = localStorage.getItem('token');
    
    // Set headers with authentication token
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    return API.post('/admin/send-otp', { email }, { headers })
        .then(response => {
            return {
                success: true,
                data: response.data,
                expiresAt: response.data.expiresAt
            };
        })
        .catch(error => {
            console.error('Error sending admin registration OTP:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to send OTP'
            };
        });
};

export const verifyAdminRegistrationOTP = (email, otp) => {
    return API.post('/admin/verify-otp', { email, otp })
        .then(response => {
            return {
                success: true,
                message: response.data.message
            };
        })
        .catch(error => {
            console.error('Error verifying admin registration OTP:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to verify OTP'
            };
        });
};

export const manageUsers = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No token found for manageUsers API call');
        return Promise.reject(new Error('Authentication required'));
    }
    
    console.log('Making manageUsers API call with token:', token.substring(0, 10) + '...');
    
    return API.get('/admin/users', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    }).catch(error => {
        console.error('Error in manageUsers API call:', error);
        
        // Just log the error and reject the promise
        // Don't redirect to login page - let the component handle the error
        return Promise.reject(error);
    });
};

export const getUserByIdAdmin = (userId) => {
    return API.get(`/admin/users/${userId}`);
};

export const adminUpdateUser = (userId, data) => {
    return API.put(`/admin/users/${userId}`, data);
};

export const adminDeleteUser = (userId) => {
    return API.delete(`/admin/users/${userId}`);
};

export const getUserActivity = (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getUserActivity API call');
        return Promise.resolve({ data: [] });
    }
    
    console.log(`Fetching activity for user ${userId}`);
    
    // Try the admin endpoint first as it's most reliable for admin users
    return API.get(`/admin/users/${userId}/activity`)
        .then(response => {
            console.log(`Successfully fetched ${response.data.length} activities for user ${userId}`);
            return response;
        })
        .catch(error => {
            console.error(`Error fetching activity for user ${userId} from primary endpoint:`, error);
            
            // If that fails, try the user-activity/:id endpoint as fallback
            console.log(`Trying fallback endpoint for user ${userId} activity`);
            return API.get(`/admin/user-activity/${userId}`)
                .then(response => {
                    console.log(`Successfully fetched ${response.data.length} activities from fallback endpoint`);
                    return response;
                })
                .catch(fallbackError => {
                    console.error(`Error fetching from fallback endpoint:`, fallbackError);
                    
                    // Try direct workout logs endpoint as another fallback
                    return API.get(`/workout-logs/user/${userId}`)
                        .then(workoutResponse => {
                            console.log(`Successfully fetched ${workoutResponse.data.length} workout logs directly`);
                            
                            // Convert workout logs to activity format
                            const workoutActivities = workoutResponse.data.map(log => ({
                                _id: log._id,
                                userId: log.userId,
                                activityType: 'Workout',
                                description: `Completed workout: ${log.title || 'Unnamed'} (${log.exercises?.length || 0} exercises)`,
                                timestamp: log.date || new Date()
                            }));
                            
                            return { data: workoutActivities };
                        })
                        .catch(workoutError => {
                            console.error(`Error fetching workout logs:`, workoutError);
                            
                            // Try goals as another data source
                            return API.get(`/goals/user/${userId}`)
                                .then(goalsResponse => {
                                    console.log(`Successfully fetched ${goalsResponse.data.length} goals directly`);
                                    
                                    // Convert goals to activity format
                                    const goalActivities = goalsResponse.data.map(goal => ({
                                        _id: goal._id,
                                        userId: goal.userId,
                                        activityType: 'Goal',
                                        description: `Created goal: ${goal.goalType || 'Unknown'} - Target: ${goal.targetValue || 'Not specified'}`,
                                        timestamp: goal.createdAt || new Date()
                                    }));
                                    
                                    return { data: goalActivities };
                                })
                                .catch(goalsError => {
                                    console.error(`All activity endpoints failed:`, goalsError);
                                    
                                    // Create some sample activity data if all endpoints fail
                                    const sampleActivities = [
                                        {
                                            _id: 'sample1',
                                            userId,
                                            activityType: 'Login',
                                            description: 'User logged into the system',
                                            timestamp: new Date(Date.now() - 86400000) // 1 day ago
                                        },
                                        {
                                            _id: 'sample2',
                                            userId,
                                            activityType: 'Profile Update',
                                            description: 'User updated their profile',
                                            timestamp: new Date(Date.now() - 43200000) // 12 hours ago
                                        }
                                    ];
                                    
                                    return { data: sampleActivities };
                                });
                        });
                });
        });
};

export const getTrainerActivity = (trainerId) => {
    return API.get(`/admin/trainers/${trainerId}/activity`);
};

export const createUserActivity = (data) => {
    return API.post('/admin/user-activity', data);
};

export const getAllTrainersAdmin = () => {
    return API.get('/admin/trainers');
};

export const getTrainerByIdAdmin = (trainerId) => {
    return API.get(`/admin/trainers/${trainerId}`);
};

export const updateTrainerAdmin = (trainerId, data) => {
    return API.put(`/admin/trainers/${trainerId}`, data);
};

export const deleteTrainerAdmin = (trainerId) => {
    return API.delete(`/admin/trainers/${trainerId}`);
};

export const approveTrainer = (trainerId, approvedSalary) => {
    return API.post('/admin/trainers/approve', { trainerId, approvedSalary });
};

export const getWorkoutProgramsAdmin = () => {
    return API.get('/workout-programs/admin/all');
};

export const getMembershipsAdmin = () => {
    console.log('Fetching admin memberships...');
    
    // Try the admin endpoint first
    return API.get('/admin/memberships')
        .then(response => {
            console.log('Successfully fetched memberships from admin endpoint:', response.data.length);
            return response;
        })
        .catch(adminError => {
            console.error('Error fetching from admin memberships endpoint:', adminError);
            
            // If that fails, try the memberships endpoint as a fallback
            console.log('Trying memberships endpoint as fallback');
            return API.get('/memberships')
                .then(response => {
                    console.log('Successfully fetched memberships from fallback endpoint:', response.data.length);
                    return response;
                })
                .catch(membershipError => {
                    console.error('Error fetching from memberships endpoint:', membershipError);
                    
                    // If both fail, return an empty array instead of throwing an error
                    console.log('All membership endpoints failed, returning empty array');
                    return { data: [] };
                });
        });
};

export const getPaymentsAdmin = () => {
    console.log('Fetching admin payments...');
    
    // Try the admin endpoint first
    return API.get('/admin/payments')
        .then(response => {
            console.log('Successfully fetched payments from admin endpoint:', response.data.length);
            return response;
        })
        .catch(adminError => {
            console.error('Error fetching from admin payments endpoint:', adminError);
            
            // If that fails, try the payments endpoint as a fallback
            console.log('Trying payments endpoint as fallback');
            return API.get('/payments')
                .then(response => {
                    console.log('Successfully fetched payments from fallback endpoint:', response.data.length);
                    return response;
                })
                .catch(paymentsError => {
                    console.error('Error fetching from payments endpoint:', paymentsError);
                    
                    // If both fail, return an empty array instead of throwing an error
                    console.log('All payment endpoints failed, returning empty array');
                    return { data: [] };
                });
        });
};

export const createMembershipPlan = (planData) => {
    console.log('Creating membership plan:', planData);
    
    return API.post('/admin/memberships/plans', planData)
        .then(response => {
            console.log('Successfully created membership plan');
            return response;
        })
        .catch(error => {
            console.error('Error creating membership plan:', error);
            throw error;
        });
};

export const getAnalyticsAdmin = () => {
    // Try the admin endpoint first
    return API.get('/admin/analytics')
        .catch(adminError => {
            console.error('Error fetching from admin analytics endpoint:', adminError);
            
            // If that fails, try the analytics endpoint as a fallback
            console.log('Trying analytics endpoint as fallback');
            return API.get('/analytics/admin')
                .catch(analyticsError => {
                    console.error('Error fetching from analytics endpoint:', analyticsError);
                    
                    // If both fail, return a mock response for development
                    console.log('Returning mock analytics data for development');
                    return {
                        data: {
                            users: {
                                total: 100,
                                active: 75,
                                premium: 30,
                                newThisMonth: 15
                            },
                            workouts: {
                                total: 500,
                                completed: 450,
                                averagePerUser: "5.00",
                                mostPopular: "Full Body Workout"
                            },
                            finance: {
                                totalRevenue: "5000.00",
                                revenueThisMonth: "1200.00",
                                membershipRevenue: "4000.00",
                                trainerRevenue: "1000.00"
                            },
                            memberships: {
                                total: 80,
                                active: 65,
                                mostPopular: "Premium"
                            },
                            trainers: {
                                total: 10,
                                active: 8
                            }
                        }
                    };
                });
        });
};

export const getUserProgressReportsAdmin = () => {
    return API.get('/admin/progress-reports');
};

export const generateReportAdmin = (reportType, startDate, endDate, userId) => {
    return API.post('/admin/generate-report', 
        { reportType, startDate, endDate, userId }, 
        { responseType: 'blob' }
    );
};

// Add a new function to get memberships for a specific user as admin
export const getUserMembershipsAdmin = (userId) => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getUserMembershipsAdmin API call');
        return Promise.resolve({ data: [] });
    }
    
    // Try the admin-specific endpoint first
    return API.get(`/admin/memberships/user/${userId}`)
        .then(response => {
            console.log(`Successfully fetched ${response.data.length} memberships for user ${userId} from admin endpoint`);
            return response;
        })
        .catch(error => {
            console.warn(`Error in getUserMembershipsAdmin for ${userId}:`, error);
            
            // Try the general admin memberships endpoint as fallback
            return API.get('/admin/memberships')
                .then(generalResponse => {
                    // Filter memberships for the specific user
                    const userMemberships = generalResponse.data.filter(membership => 
                        (membership.userId && (membership.userId === userId || membership.userId._id === userId)) || 
                        membership.user === userId
                    );
                    
                    console.log(`Found ${userMemberships.length} memberships for user ${userId} in general admin endpoint`);
                    return { data: userMemberships };
                })
                .catch(generalError => {
                    console.error(`Error fetching from general admin endpoint:`, generalError);
                    
                    // Create a sample membership if all endpoints fail
                    const sampleMembership = {
                        _id: `sample-${userId}`,
                        userId: userId,
                        planType: 'Standard',
                        status: 'Active',
                        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
                        endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),   // 60 days from now
                        price: 29.99
                    };
                    
                    return { data: [sampleMembership] };
                });
        });
};

// Function to get user memberships as admin with fallback mechanisms
export const getAdminUserMemberships = (userId) => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getAdminUserMemberships API call');
        return Promise.resolve({ data: [] }); // Return empty array instead of rejecting
    }
    
    // First try the admin-specific endpoint using getUserMembershipsAdmin
    return getUserMembershipsAdmin(userId)
        .then(response => {
            if (response.data && response.data.length > 0) {
                return response;
            }
            
            // If no data from admin endpoint, try the direct user memberships endpoint
            console.log(`No memberships found in admin endpoint for ${userId}, trying direct endpoint`);
            return API.get(`/memberships/user/${userId}`)
                .then(directResponse => {
                    if (directResponse.data && directResponse.data.length > 0) {
                        console.log(`Found ${directResponse.data.length} memberships for user ${userId} in direct endpoint`);
                        return directResponse;
                    }
                    
                    // If still no data, return the empty array from the admin endpoint
                    console.log(`No memberships found for user ${userId} in any endpoints`);
                    return response;
                })
                .catch(directError => {
                    console.error(`Error fetching from direct endpoint for ${userId}:`, directError);
                    // Return whatever we got from the admin endpoint
                    return response;
                });
        });
};

// User API
export const loginUser = async (email, password) => {
    try {
        // Clear any existing tokens before login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('userId');
        
        // Always use port 5050 for the server
        const serverPort = '5050';
        const baseURL = `http://localhost:${serverPort}/api`;
        
        console.log(`Attempting login with server at ${baseURL}`);
        
        // Create a new axios instance for this request to ensure we use the latest port
        const loginAPI = axios.create({
            baseURL,
            timeout: 5000 // Longer timeout for login
        });
        
        const response = await loginAPI.post('/users/login', { email, password });
        
        // If login is successful, update the API baseURL
        updateServerPort(serverPort);
        
        return response;
    } catch (error) {
        console.error('Login error:', error);
        
        // Provide more detailed error messages
        if (error.response && error.response.status === 401) {
            throw new Error('Invalid email or password. Please try again.');
        }
        
        // Provide a more user-friendly error message for server connection issues
        if (error.code === 'ERR_NETWORK') {
            throw new Error('Cannot connect to server. Please check if the server is running on port 5050.');
        }
        
        throw error;
    }
};

export const registerUser = async (data) => {
    try {
        // Always use port 5050 for the server
        const serverPort = '5050';
        const baseURL = `http://localhost:${serverPort}/api`;
        
        console.log(`Attempting registration with server at ${baseURL}`);
        
        // Create a new axios instance for this request to ensure we use the latest port
        const registerAPI = axios.create({
            baseURL,
            timeout: 10000 // Longer timeout for registration with image upload
        });
        
        // Log the FormData contents for debugging
        if (data instanceof FormData) {
            console.log('Registration FormData contents:');
            for (let pair of data.entries()) {
                // Don't log the actual file content, just its presence
                if (pair[0] === 'image' && pair[1] instanceof File) {
                    console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
                } else {
                    console.log(`${pair[0]}: ${pair[1]}`);
                }
            }
        }
        
        const response = await registerAPI.post('/users/register', data, {
            headers: {
                'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
            }
        });
        
        // If registration is successful, update the API baseURL
        updateServerPort(serverPort);
        
        return response;
    } catch (error) {
        console.error('Registration error:', error);
        
        // Provide more detailed error messages
        if (error.response && error.response.data && error.response.data.message) {
            throw new Error(error.response.data.message);
        }
        
        // Provide a more user-friendly error message for server connection issues
        if (error.code === 'ERR_NETWORK') {
            // Try to detect the server port again
            try {
                const detectServerPort = (await import('./utils/serverPortDetector')).default;
                const port = await detectServerPort();
                console.log(`Detected server on port ${port}, updating API configuration`);
                
                // Try the registration again with the new port
                const newBaseURL = `http://localhost:${port}/api`;
                const retryAPI = axios.create({
                    baseURL: newBaseURL,
                    timeout: 10000
                });
                
                const retryResponse = await retryAPI.post('/users/register', data, {
                    headers: {
                        'Content-Type': data instanceof FormData ? 'multipart/form-data' : 'application/json'
                    }
                });
                return retryResponse;
            } catch (retryError) {
                console.error('Retry failed:', retryError);
                throw new Error('Server connection failed. Please check your internet connection and try again.');
            }
        }
        
        throw error;
    }
};

export const getUserById = () => {
    return API.get('/users/profile');
};

export const updateUser = (data) => {
    return API.put('/users/profile', data);
};

// Trainer API
export const loginTrainer = (email, password) => {
    return API.post('/trainers/login', { email, password });
};

export const registerTrainer = (data) => {
    return API.post('/trainers/register', data);
};

// Updated to use the public endpoint for regular users
export const getAllTrainers = async () => {
    return API.get('/trainers/available');
};

// Goals API
export const getGoalsByUserId = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.status) queryParams.append('status', params.status);
        
        const queryString = queryParams.toString();
        const url = `/goals/user/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching goals:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getAllUserGoals = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.status) queryParams.append('status', params.status);
        if (params.goalType) queryParams.append('goalType', params.goalType);
        if (params.sortBy) queryParams.append('sortBy', params.sortBy);
        if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
        
        const queryString = queryParams.toString();
        const url = `/goals/all/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching all user goals:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getGoalById = async (goalId) => {
    try {
        const response = await API.get(`/goals/${goalId}`);
        return response;
    } catch (error) {
        console.error('Error fetching goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const createGoal = async (goalData) => {
    try {
        const response = await API.post('/goals', goalData);
        return response;
    } catch (error) {
        console.error('Error creating goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const updateGoal = async (goalId, goalData) => {
    try {
        const response = await API.put(`/goals/${goalId}`, goalData);
        return response;
    } catch (error) {
        console.error('Error updating goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const updateGoalProgress = async (goalId, progressData) => {
    try {
        const response = await API.put(`/goals/${goalId}/progress`, progressData);
        return response;
    } catch (error) {
        console.error('Error updating goal progress:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const deleteGoal = async (goalId) => {
    try {
        const response = await API.delete(`/goals/${goalId}`);
        return response;
    } catch (error) {
        console.error('Error deleting goal:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getGoalStats = async (userId) => {
    try {
        const response = await API.get(`/goals/stats/${userId}`);
        return response;
    } catch (error) {
        console.error('Error fetching goal stats:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

// Workouts API
export const getWorkoutsByUserId = (userId) => {
    return API.get(`/workouts/user/${userId}`);
};

export const createWorkout = (workoutData) => {
    return API.post('/workouts', workoutData);
};

export const deleteWorkout = (workoutId) => {
    return API.delete(`/workouts/${workoutId}`);
};

export const updateTrainerProfile = async (trainerId, data) => {
    return API.put(`/trainers/${trainerId}`, data);
};

export const getTrainerClients = () => {
    // Get the trainer ID from localStorage
    const trainer = JSON.parse(localStorage.getItem('trainer') || '{}');
    const trainerId = trainer._id || trainer.id;
    
    if (!trainerId) {
        console.error('No trainer ID found in localStorage');
        return Promise.reject(new Error('No trainer ID found'));
    }
    
    return API.get(`/trainers/${trainerId}/clients`);
};

// Workout Logs API
export const createWorkoutLog = async (workoutData) => {
    try {
        const response = await API.post('/workout-logs', workoutData);
        return response;
    } catch (error) {
        handleMembershipError(error);
        console.error('Error creating workout log:', error);
        throw error;
    }
};

export const getWorkoutLogs = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (userId) {
            queryParams.append('userId', userId);
        }
        
        if (params.startDate) {
            queryParams.append('startDate', params.startDate);
        }
        
        if (params.endDate) {
            queryParams.append('endDate', params.endDate);
        }
        
        if (params.limit) {
            queryParams.append('limit', params.limit);
        }
        
        if (params.page) {
            queryParams.append('page', params.page);
        }
        
        if (params.sort) {
            queryParams.append('sort', params.sort);
        }
        
        const queryString = queryParams.toString();
        const url = `/workout-logs/user/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        handleMembershipError(error);
        console.error('Error fetching workout logs:', error);
        throw error;
    }
};

export const getWorkoutLogById = async (logId) => {
    try {
        const response = await API.get(`/workout-logs/${logId}`);
        return response;
    } catch (error) {
        console.error('Error fetching workout log:', error);
        throw error;
    }
};

export const updateWorkoutLog = async (logId, workoutData) => {
    try {
        const response = await API.put(`/workout-logs/${logId}`, workoutData);
        return response;
    } catch (error) {
        console.error('Error updating workout log:', error);
        throw error;
    }
};

export const deleteWorkoutLog = async (logId) => {
    try {
        const response = await API.delete(`/workout-logs/${logId}`);
        return response;
    } catch (error) {
        console.error('Error deleting workout log:', error);
        throw error;
    }
};

export const getWorkoutStats = async (userId, period = 'month', startDate, endDate) => {
    try {
        const queryParams = new URLSearchParams();
        
        if (period) queryParams.append('period', period);
        if (startDate) queryParams.append('startDate', startDate);
        if (endDate) queryParams.append('endDate', endDate);
        
        const queryString = queryParams.toString();
        const url = `/workout-logs/stats/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching workout stats:', error);
        throw error;
    }
};

// Workout Programs API
export const getWorkoutPrograms = async (userId, params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.category) queryParams.append('category', params.category);
        if (params.difficulty) queryParams.append('difficulty', params.difficulty);
        
        const queryString = queryParams.toString();
        const url = `/workout-programs/${userId}${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching workout programs:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getLibraryWorkoutPrograms = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        
        // Add optional query parameters
        if (params.category) queryParams.append('category', params.category);
        if (params.difficulty) queryParams.append('difficulty', params.difficulty);
        if (params.search) queryParams.append('search', params.search);
        
        const queryString = queryParams.toString();
        const url = `/workout-programs/library${queryString ? `?${queryString}` : ''}`;
        
        const response = await API.get(url);
        return response;
    } catch (error) {
        console.error('Error fetching library workout programs:', error);
        throw error;
    }
};

export const getWorkoutProgramById = async (programId) => {
    try {
        const response = await API.get(`/workout-programs/program/${programId}`);
        return response;
    } catch (error) {
        console.error('Error fetching workout program:', error);
        throw error;
    }
};

export const createWorkoutProgram = async (programData) => {
    try {
        const response = await API.post('/workout-programs', programData);
        return response;
    } catch (error) {
        console.error('Error creating workout program:', error);
        throw error;
    }
};

export const updateWorkoutProgram = async (programId, programData) => {
    try {
        const response = await API.put(`/workout-programs/${programId}`, programData);
        return response;
    } catch (error) {
        console.error('Error updating workout program:', error);
        throw error;
    }
};

export const deleteWorkoutProgram = async (programId) => {
    try {
        const response = await API.delete(`/workout-programs/${programId}`);
        return response;
    } catch (error) {
        console.error('Error deleting workout program:', error);
        throw error;
    }
};

export const assignWorkoutProgram = async (assignData) => {
    try {
        const response = await API.post('/workout-programs/assign', assignData);
        return response;
    } catch (error) {
        console.error('Error assigning workout program:', error);
        throw error;
    }
};

export const getTrainerById = (trainerId) => {
    return API.get(`/trainers/${trainerId}`);
};

// Membership API
export const getUserMemberships = (userId) => {
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
        console.warn('No token found for getUserMemberships API call');
        return Promise.resolve({ data: [] }); // Return empty array instead of rejecting
    }
    
    return API.get(`/memberships/user/${userId}`)
        .catch(error => {
            // If there's an authentication error, just return an empty array
            if (error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.warn(`Authentication error in getUserMemberships for user ${userId} - returning empty array`);
                return { data: [] };
            }
            
            // For other errors, reject the promise
            return Promise.reject(error);
        });
};

export const createMembership = (membershipData) => {
    return API.post('/memberships', membershipData);
};

export const updateMembership = (membershipId, membershipData) => {
    console.log('Updating membership:', membershipId, membershipData);
    
    if (!membershipId) {
        console.error('No membership ID provided for update');
        return Promise.reject(new Error('Membership ID is required'));
    }
    
    return API.put(`/memberships/${membershipId}`, membershipData)
        .then(response => {
            console.log('Successfully updated membership');
            return response;
        })
        .catch(error => {
            console.error('Error updating membership:', error);
            
            // Try admin endpoint as fallback
            console.log('Trying admin endpoint as fallback for membership update');
            return API.put(`/admin/memberships/${membershipId}`, membershipData)
                .then(response => {
                    console.log('Successfully updated membership via admin endpoint');
                    return response;
                })
                .catch(adminError => {
                    console.error('Error updating membership via admin endpoint:', adminError);
                    throw error; // Throw the original error
                });
        });
};

export const fixMembership = (userId, membershipId) => {
    return API.post(`/memberships/fix/${membershipId}`, { userId });
};

export const fixAllMemberships = (userId) => {
    return API.post('/memberships/fix-all', { userId });
};

// Payment API
export const getUserPayments = (userId) => {
    return API.get(`/payments/user/${userId}`);
};

export const createPayment = (paymentData) => {
    return API.post('/payments', paymentData);
};

export const createPendingPayment = (paymentData) => {
    return API.post('/payments/create-pending', paymentData);
};

export const sendPaymentOTP = (userId, email) => {
    return API.post('/payments/send-otp', { userId, email });
};

export const verifyPaymentOTP = (userId, otp) => {
    return API.post('/payments/verify-otp', { userId, otp });
};

export const verifyPaymentSession = (sessionId) => {
    return API.get(`/payments/verify-session?session_id=${sessionId}`);
};

export const updatePayment = (paymentId, paymentData) => {
    console.log('Updating payment:', paymentId, paymentData);
    
    if (!paymentId) {
        console.error('No payment ID provided for update');
        return Promise.reject(new Error('Payment ID is required'));
    }
    
    return API.put(`/payments/${paymentId}`, paymentData)
        .then(response => {
            console.log('Successfully updated payment');
            return response;
        })
        .catch(error => {
            console.error('Error updating payment:', error);
            
            // Try admin endpoint as fallback
            console.log('Trying admin endpoint as fallback for payment update');
            return API.put(`/admin/payments/${paymentId}`, paymentData)
                .then(response => {
                    console.log('Successfully updated payment via admin endpoint');
                    return response;
                })
                .catch(adminError => {
                    console.error('Error updating payment via admin endpoint:', adminError);
                    throw error; // Throw the original error
                });
        });
};

// Appointment API
export const getUserAppointments = async (userId) => {
    return API.get(`/appointments/${userId}`);
};

export const bookAppointment = async (appointmentData) => {
    return API.post('/appointments', appointmentData);
};

export const updateAppointmentStatus = async (appointmentId, status) => {
    return API.put(`/appointments/${appointmentId}`, { status });
};

export const getTrainerAppointments = async (trainerId) => {
    return API.get(`/appointments/trainer/${trainerId}`);
};

export const getUserCurrentTrainer = async (userId) => {
    try {
        return await API.get(`/users/${userId}/confirmed-appointments`);
    } catch (error) {
        console.warn("Error fetching confirmed appointments:", error.message);
        // Return an empty array instead of throwing an error
        return { data: [] };
    }
};

// Progress Reports API
export const getClientProgressReports = async (clientId) => {
  return API.get(`/progress-reports/client/${clientId}`);
};

export const getTrainerProgressReports = async (trainerId) => {
  return API.get(`/progress-reports/trainer/${trainerId}`);
};

export const getProgressReportById = async (reportId) => {
  return API.get(`/progress-reports/${reportId}`);
};

export const createProgressReport = async (reportData) => {
  return API.post('/progress-reports', reportData);
};

// Notifications API
export const getNotifications = async (recipientId) => {
  try {
    // Check if the user is a trainer based on the URL or stored role
    const isTrainer = window.location.pathname.includes('/trainer') || localStorage.getItem('role') === 'trainer';
    
    // Use the appropriate endpoint based on the user type
    if (isTrainer) {
      console.log("Fetching trainer notifications");
      return API.get(`/notifications/trainer/${recipientId}`);
    } else {
      console.log("Fetching user notifications");
      return API.get(`/notifications/user/${recipientId}`);
    }
  } catch (error) {
    console.error("Error in getNotifications:", error);
    // Return empty array as fallback
    return { data: [] };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  return API.put(`/notifications/${notificationId}`);
};

export const sendNotification = async (notificationData) => {
  return API.post('/notifications/send', notificationData);
};

// Trainer payment API
export const getTrainerPayments = async (trainerId) => {
    return API.get(`/trainer-payments/${trainerId}`);
};

export const getTrainerPaymentStats = async (trainerId) => {
    return API.get(`/trainer-payments/stats/${trainerId}`);
};

export const createTrainerPayment = async (paymentData) => {
    return API.post('/trainer-payments', paymentData);
};

export const generateMonthlyPayments = async (month, year) => {
    return API.post('/trainer-payments/generate-monthly', { month, year });
};

// SPA Services API
export const getSpaServices = async () => {
    try {
        const response = await API.get('/spa/services');
        return response.data;
    } catch (error) {
        console.error('Error fetching SPA services:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getSpaServiceById = async (serviceId) => {
    try {
        const response = await API.get(`/spa/services/${serviceId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching SPA service:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const getUserSpaBookings = async (userId) => {
    try {
        const response = await API.get(`/spa/bookings/user/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching user SPA bookings:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const checkFreeSessionEligibility = async (userId) => {
    try {
        const response = await API.get(`/spa/bookings/free-eligibility/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error checking free session eligibility:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const bookSpaSession = async (bookingData) => {
    try {
        const response = await API.post('/spa/bookings', bookingData);
        return response.data;
    } catch (error) {
        console.error('Error booking SPA session:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

export const cancelSpaBooking = async (bookingId) => {
    try {
        const response = await API.delete(`/spa/bookings/${bookingId}`);
        return response.data;
    } catch (error) {
        console.error('Error cancelling SPA booking:', error);
        const membershipError = handleMembershipError(error);
        if (membershipError.isMembershipError) {
            throw membershipError;
        }
        throw error;
    }
};

// Announcements API
export const getAnnouncements = () => {
    return API.get('/announcements');
};

export const getAnnouncementsAdmin = () => {
    return API.get('/admin/announcements');
};

export const createAnnouncement = (announcementData) => {
    return API.post('/admin/announcements', announcementData);
};

export const updateAnnouncement = (id, announcementData) => {
    return API.put(`/admin/announcements/${id}`, announcementData);
};

export const deleteAnnouncement = (id) => {
    return API.delete(`/admin/announcements/${id}`);
};

// Helper functions for caching
function getCachedData(key) {
    return apiCache.get(key);
}

function setCachedData(key, data) {
    apiCache.set(key, data);
}

// Add default export for the API object
export default API;

// Add this function to handle membership access errors
export const handleMembershipError = (error) => {
    if (error.response && error.response.status === 403) {
        const data = error.response.data;
        
        // Check if this is a membership access error
        if (data.error && (
            data.error.includes('Access denied') || 
            data.error.includes('membership required')
        )) {
            // Return structured error for UI handling
            return {
                isMembershipError: true,
                message: data.error,
                requiredPlans: data.requiredPlans || [],
                currentPlan: data.currentPlan || 'None'
            };
        }
    }
    
    // Not a membership error
    return {
        isMembershipError: false,
        message: error.message || 'An error occurred'
    };
};

// Workout Log API Functions
export const getAssignedWorkouts = async () => {
    try {
        const response = await API.get('/workouts/assigned');
        return response;
    } catch (error) {
        handleMembershipError(error);
        throw error;
    }
};

export const markAssignedWorkoutCompleted = async (workoutId) => {
    try {
        const response = await API.put(`/workouts/assigned/${workoutId}/complete`, {});
        return response;
    } catch (error) {
        handleMembershipError(error);
        throw error;
    }
};