import React, { useContext, useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/EditProfile.css';
import { toast } from 'react-toastify';

const EditProfile = () => {
    const { user, setUser, checkTokenValidity } = useContext(AuthContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: '',
        goals: [],
        image: null,
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [newGoal, setNewGoal] = useState('');
    const dataFetchedRef = useRef(false);
    const userIdRef = useRef(user?.id);
    const formInitializedRef = useRef(false);

    // Log only on first render
    useEffect(() => {
        console.log("EditProfile - Initial render with user:", user?.id);
    }, []);

    useEffect(() => {
        // Check if user exists in context
        if (!user) {
            console.log("No user found in context, redirecting to login");
            navigate('/users/login');
            return;
        }
        
        // Skip if we've already processed this user
        if (dataFetchedRef.current && userIdRef.current === user.id && formInitializedRef.current) {
            console.log("EditProfile - Data already fetched and form initialized for this user, skipping");
            return;
        }
        
        console.log("EditProfile - User changed or component mounted");
        console.log("Current user in context:", user);
        
        // Only update form data if it hasn't been set yet
        if (!formInitializedRef.current) {
            console.log("EditProfile - Initializing form with user data");
            // Pre-populate form with user data from context
            setFormData({
                name: user.name || '',
                email: user.email || '',
                age: user.age?.toString() || '',
                height: user.height?.toString() || '',
                weight: user.weight?.toString() || '',
                gender: user.gender || '',
                goals: user.goals || [],
                image: null,
            });
            
            setPreviewImage(user.image || null);
            setLoading(false);
            formInitializedRef.current = true;
        }
        
        // Only fetch user data once per user
        if (!dataFetchedRef.current || userIdRef.current !== user.id) {
            console.log("EditProfile - Fetching data for user:", user.id);
            fetchUserData();
            dataFetchedRef.current = true;
            userIdRef.current = user.id;
        }
    }, [user?.id, navigate]); // Only depend on user.id and navigate
    
    // Separate function to fetch user data
    const fetchUserData = async () => {
        try {
            console.log("EditProfile - Fetching user profile data");
            
            // Check if token is valid before making the request
            const token = localStorage.getItem('token');
            if (!token) {
                console.log("No token found, using data from context");
                return;
            }
            
            // Make a direct API call with the token
            const response = await API.get('/users/profile');
            
            console.log("EditProfile - User profile response:", response.data);
            
            const userData = response.data;
            
            setFormData({
                name: userData.name || '',
                email: userData.email || '',
                age: userData.age?.toString() || '',
                height: userData.height?.toString() || '',
                weight: userData.weight?.toString() || '',
                gender: userData.gender || '',
                goals: userData.goals || [],
                image: null,
            });
            
            setPreviewImage(userData.image || null);
        } catch (error) {
            console.error("Error fetching user data:", error);
            
            // Handle network errors gracefully
            if (error.code === 'ERR_NETWORK') {
                console.log("Network error - continuing with user data from context");
                toast.warning("Could not connect to server. Using locally stored profile data.");
                return;
            }
            
            // Check if it's an authentication error but don't redirect immediately
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log("Authentication error when fetching profile data");
                toast.warning("Session may have expired. Using locally stored profile data.");
                return;
            }
            
            // Just show an error toast but don't redirect
            toast.error(`Failed to load latest profile data: ${error.message || 'Unknown error'}`);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setError('Image size should be less than 5MB');
                return;
            }
            setFormData(prev => ({
                ...prev,
                image: file,
            }));
            setPreviewImage(URL.createObjectURL(file));
        }
    };

    const addGoal = () => {
        if (newGoal.trim()) {
            setFormData(prev => ({
                ...prev,
                goals: [...prev.goals, newGoal.trim()]
            }));
            setNewGoal('');
        }
    };

    const removeGoal = (index) => {
        setFormData(prev => ({
            ...prev,
            goals: prev.goals.filter((_, i) => i !== index)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        try {
            console.log("=== EDIT PROFILE FORM SUBMISSION ===");
            console.log("Current form data:", formData);
            console.log("Current user data:", user);
            
            // For image uploads, we still need to use FormData and the regular endpoint
            if (formData.image) {
                console.log("Image selected, using multipart form data");
                const dataToUpdate = new FormData();
                
                // Append all form data
                dataToUpdate.append('name', formData.name);
                dataToUpdate.append('email', formData.email);
                dataToUpdate.append('age', formData.age);
                dataToUpdate.append('height', formData.height);
                dataToUpdate.append('weight', formData.weight);
                dataToUpdate.append('gender', formData.gender || '');
                
                // Append goals as JSON string
                if (formData.goals.length > 0) {
                    dataToUpdate.append('goals', JSON.stringify(formData.goals));
                }
                
                // Append image
                dataToUpdate.append('image', formData.image);
                
                console.log("Sending API request with image upload");
                const response = await API.put('/users/profile', dataToUpdate, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                console.log("Profile update response:", response.data);
                
                // Update the user data in the context and localStorage
                const updatedUser = {
                    ...user,
                    name: response.data.name,
                    email: response.data.email,
                    age: response.data.age,
                    height: response.data.height,
                    weight: response.data.weight,
                    gender: response.data.gender,
                    goals: response.data.goals,
                    image: response.data.image
                };
                
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            } else {
                // For regular updates without image, use the direct field update endpoint
                console.log("No image selected, using direct field update");
                
                // Create a clean object with only the fields we want to update
                const updateData = {
                    name: formData.name,
                    email: formData.email,
                    age: formData.age,
                    height: formData.height,
                    weight: formData.weight,
                    gender: formData.gender || ''
                };
                
                // Add goals if they exist
                if (formData.goals.length > 0) {
                    updateData.goals = formData.goals;
                }
                
                console.log("Sending direct field update:", updateData);
                const response = await API.put('/users/update-fields', updateData);
                
                console.log("Profile update response:", response.data);
                
                // Update the user data in the context and localStorage
                const updatedUser = {
                    ...user,
                    name: response.data.name,
                    email: response.data.email,
                    age: response.data.age,
                    height: response.data.height,
                    weight: response.data.weight,
                    gender: response.data.gender,
                    goals: response.data.goals,
                    image: response.data.image
                };
                
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            console.log("User context and localStorage updated");
            toast.success('Profile updated successfully!');
            navigate('/user/dashboard');
        } catch (error) {
            console.error("Error updating profile:", error);
            
            // Handle network errors
            if (error.code === 'ERR_NETWORK') {
                toast.error('Network error. Please check your connection and try again.');
                setLoading(false);
                return;
            }
            
            // Check if it's an authentication error
            if (error.response?.status === 401 || error.response?.status === 403) {
                console.log("Authentication error, redirecting to login");
                toast.error('Your session has expired. Please log in again.');
                localStorage.removeItem('token'); // Clear invalid token
                navigate('/users/login');
                return;
            }
            
            setError(`Failed to update profile: ${error.response?.data?.message || error.message || 'Unknown error'}`);
            toast.error('Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !user) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Loading profile data...</p>
            </div>
        );
    }

    return (
        <div className="edit-profile-container">
            <h2>Edit Profile</h2>
            
            {error && <div className="error-message">{error}</div>}
            
            <form onSubmit={handleSubmit} className="edit-profile-form">
                <div className="profile-image-section">
                    <div className="profile-image-container">
                        <img 
                            src={previewImage || 'https://res.cloudinary.com/daacjyk3d/image/upload/v1740376690/fitnessApp/gfo0vamcfcurte2gc4jk.jpg'} 
                            alt="Profile" 
                            className="profile-image" 
                        />
                    </div>
                    <div className="image-upload">
                        <label htmlFor="image">Change Profile Picture</label>
                        <input 
                            type="file" 
                            id="image" 
                            name="image" 
                            accept="image/*" 
                            onChange={handleImageChange} 
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label htmlFor="name">Full Name</label>
                    <input 
                        type="text" 
                        id="name" 
                        name="name" 
                        value={formData.name} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={formData.email} 
                        onChange={handleChange} 
                        required 
                    />
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="age">Age</label>
                        <input 
                            type="number" 
                            id="age" 
                            name="age" 
                            value={formData.age} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="gender">Gender</label>
                        <select 
                            id="gender" 
                            name="gender" 
                            value={formData.gender} 
                            onChange={handleChange}
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                            <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group">
                        <label htmlFor="height">Height (cm)</label>
                        <input 
                            type="number" 
                            id="height" 
                            name="height" 
                            value={formData.height} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="weight">Weight (kg)</label>
                        <input 
                            type="number" 
                            id="weight" 
                            name="weight" 
                            value={formData.weight} 
                            onChange={handleChange} 
                        />
                    </div>
                </div>
                
                <div className="form-group">
                    <label>Fitness Goals</label>
                    <div className="goals-input">
                        <input 
                            type="text" 
                            value={newGoal} 
                            onChange={(e) => setNewGoal(e.target.value)} 
                            placeholder="Add a new goal" 
                        />
                        <button type="button" onClick={addGoal}>Add</button>
                    </div>
                    
                    <div className="goals-list">
                        {formData.goals.map((goal, index) => (
                            <div key={index} className="goal-item">
                                <span>{goal}</span>
                                <button type="button" onClick={() => removeGoal(index)}>Remove</button>
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="form-actions">
                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Updating...' : 'Update Profile'}
                    </button>
                    <button 
                        type="button" 
                        className="cancel-btn" 
                        onClick={() => navigate('/user/dashboard')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default EditProfile; 