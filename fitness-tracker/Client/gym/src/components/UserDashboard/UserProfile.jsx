// components/UserDashboard/UserProfile.jsx
import React, { useEffect, useState, useRef } from 'react';
import API from '../../api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const UserProfile = () => {
    const { user, setUser } = useAuth();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        height: '',
        weight: '',
        gender: '',
        image: null,
    });
    const [previewImage, setPreviewImage] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const dataFetchedRef = useRef(false);
    const userIdRef = useRef(user?.id);

    // Log only on first render
    useEffect(() => {
        console.log("UserProfile - Initial render", { user, refreshKey });
    }, []);

    // Single useEffect to handle initial data setup - runs only once
    useEffect(() => {
        // Skip if we've already processed this user or if no user exists
        if (dataFetchedRef.current && userIdRef.current === user?.id) {
            console.log("UserProfile - Data already fetched for this user, skipping");
            return;
        }
        
        console.log("UserProfile - Component mounted or user changed");
        
        // Check if user exists
        if (!user) {
            console.log("UserProfile - No user found");
            setError('User data not available');
            setLoading(false);
            return;
        }
        
        // Check user role
        if (user.role !== 'user') {
            console.log("UserProfile - Not a user role:", user.role);
            setError('Unauthorized access');
            setLoading(false);
            return;
        }
        
        // Update local state from user context
        console.log("UserProfile - Updating from user context:", user);
        setUserData(user);
        setFormData({
            name: user.name || '',
            email: user.email || '',
            age: user.age?.toString() || '',
            height: user.height?.toString() || '',
            weight: user.weight?.toString() || '',
            gender: user.gender || '',
            image: null,
        });
        setPreviewImage(user.image || null);
        setLoading(false);
        
        // Only fetch user data once
        if (!dataFetchedRef.current) {
            fetchUserData();
            dataFetchedRef.current = true;
            userIdRef.current = user.id;
        }
    }, [user?.id]); // Only depend on user.id, not the entire user object

    const fetchUserData = async () => {
        console.log("UserProfile - Fetching user data");
        try {
            // Check if token exists before making the request
            const token = localStorage.getItem('token');
            if (!token) {
                console.error('No authentication token found');
                // Use cached data if available
                const cachedUser = localStorage.getItem('user');
                if (cachedUser) {
                    const userData = JSON.parse(cachedUser);
                    setUserData(userData);
                    setFormData({
                        name: userData.name || '',
                        email: userData.email || '',
                        age: userData.age?.toString() || '',
                        height: userData.height?.toString() || '',
                        weight: userData.weight?.toString() || '',
                        gender: userData.gender || '',
                        image: null,
                    });
                }
                setLoading(false);
                return;
            }

            const response = await API.get('/users/profile');
            console.log("UserProfile - API response:", response.data);
            
            // Update both local state and context
            setUserData(response.data);
            
            // Update the user context with the latest data
            const updatedUser = {
                ...user,
                name: response.data.name,
                email: response.data.email,
                age: response.data.age,
                height: response.data.height,
                weight: response.data.weight,
                gender: response.data.gender,
                image: response.data.image
            };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setFormData({
                name: response.data.name || '',
                email: response.data.email || '',
                age: response.data.age?.toString() || '',
                height: response.data.height?.toString() || '',
                weight: response.data.weight?.toString() || '',
                gender: response.data.gender || '',
                image: null,
            });
            setLoading(false);
        } catch (error) {
            console.error('Error fetching user data:', error);
            
            // If we get a 403 error, use cached data from localStorage
            if (error.response && error.response.status === 403) {
                console.log('Using cached user data due to 403 error');
                const cachedUser = localStorage.getItem('user');
                if (cachedUser) {
                    const userData = JSON.parse(cachedUser);
                    setUserData(userData);
                    setFormData({
                        name: userData.name || '',
                        email: userData.email || '',
                        age: userData.age?.toString() || '',
                        height: userData.height?.toString() || '',
                        weight: userData.weight?.toString() || '',
                        gender: userData.gender || '',
                        image: null,
                    });
                }
            }
            setLoading(false);
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            console.log("=== USER PROFILE FORM SUBMISSION ===");
            console.log("Current form data:", formData);
            console.log("Current user data:", userData);
            
            // For image uploads, we still need to use FormData and the regular endpoint
            if (formData.image) {
                console.log("Image selected, using multipart form data");
                const dataToUpdate = new FormData();
                
                // Only append changed values
                if (formData.name !== userData.name) dataToUpdate.append('name', formData.name);
                if (formData.email !== userData.email) dataToUpdate.append('email', formData.email);
                if (formData.age !== userData.age?.toString()) dataToUpdate.append('age', formData.age);
                if (formData.height !== userData.height?.toString()) dataToUpdate.append('height', formData.height);
                if (formData.weight !== userData.weight?.toString()) dataToUpdate.append('weight', formData.weight);
                if (formData.gender !== userData.gender) dataToUpdate.append('gender', formData.gender || '');
                
                // Append image
                dataToUpdate.append('image', formData.image);
                
                // Log FormData contents for debugging
                console.log('Profile update FormData contents:');
                for (let pair of dataToUpdate.entries()) {
                    // Don't log the actual file content, just its presence
                    if (pair[0] === 'image' && pair[1] instanceof File) {
                        console.log(`${pair[0]}: [File] ${pair[1].name} (${pair[1].size} bytes)`);
                    } else {
                        console.log(`${pair[0]}: ${pair[1]}`);
                    }
                }
                
                console.log("Sending API request with image upload");
                try {
                    const response = await API.put('/users/profile', dataToUpdate, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        },
                        timeout: 30000 // Increase timeout for image uploads
                    });
                    
                    console.log("Profile update response:", response.data);
                    
                    // Update local state
                    setUserData(response.data);
                    setFormData({
                        name: response.data.name || '',
                        email: response.data.email || '',
                        age: response.data.age?.toString() || '',
                        height: response.data.height?.toString() || '',
                        weight: response.data.weight?.toString() || '',
                        gender: response.data.gender || '',
                        image: null,
                    });
                    setPreviewImage(response.data.image || null);
                    
                    // Update user context
                    setUser({
                        ...user,
                        name: response.data.name,
                        email: response.data.email,
                        age: response.data.age,
                        height: response.data.height,
                        weight: response.data.weight,
                        gender: response.data.gender,
                        image: response.data.image
                    });
                    
                    setIsEditing(false);
                    toast.success('Profile updated successfully!');
                } catch (uploadError) {
                    console.error('Error uploading image:', uploadError);
                    
                    if (uploadError.response && uploadError.response.data && uploadError.response.data.error) {
                        toast.error(`Upload failed: ${uploadError.response.data.error}`);
                    } else {
                        toast.error('Failed to upload image. Please try again with a smaller image or different format.');
                    }
                }
            } else {
                // For regular updates without image, use the direct field update endpoint
                console.log("No image selected, using direct field update");
                
                // Create a clean object with only the fields we want to update
                const updateData = {};
                
                // Only include changed values
                if (formData.name !== userData.name) updateData.name = formData.name;
                if (formData.email !== userData.email) updateData.email = formData.email;
                if (formData.age !== userData.age?.toString()) updateData.age = formData.age;
                if (formData.height !== userData.height?.toString()) updateData.height = formData.height;
                if (formData.weight !== userData.weight?.toString()) updateData.weight = formData.weight;
                if (formData.gender !== userData.gender) updateData.gender = formData.gender || '';
                
                console.log("Sending direct field update:", updateData);
                const response = await API.put('/users/update-fields', updateData);
                
                console.log("Profile update response:", response.data);
                
                // Update local state
                setUserData(response.data);
                setFormData({
                    name: response.data.name || '',
                    email: response.data.email || '',
                    age: response.data.age?.toString() || '',
                    height: response.data.height?.toString() || '',
                    weight: response.data.weight?.toString() || '',
                    gender: response.data.gender || '',
                    image: null,
                });
                setPreviewImage(response.data.image || null);
                
                // Update user in context
                const updatedUser = {
                    ...user,
                    name: response.data.name,
                    email: response.data.email,
                    age: response.data.age,
                    height: response.data.height,
                    weight: response.data.weight,
                    gender: response.data.gender,
                    image: response.data.image
                };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
            
            setIsEditing(false);
            setError(null);
            toast.success('Profile updated successfully!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        }
    };

    if (loading) {
        console.log("UserProfile - Loading state");
        return <div className="loading">Loading profile information...</div>;
    }
    
    if (error) {
        console.log("UserProfile - Error state:", error);
        return <div className="error">{error}</div>;
    }

    if (!userData) {
        console.log("UserProfile - No user data");
        return <div className="error">No profile information available</div>;
    }

    console.log("UserProfile - Rendering profile with data:", userData);

    return (
        <div className="profile-container">
            <h3>Profile Information</h3>
            <div className="profile-content">
                <div className="image-container">
                    <img
                        src={previewImage || userData?.image || "/default-avatar.png"}
                        alt="Profile"
                        className="profile-image"
                        onError={(e) => {
                            console.log("Image load error, using default avatar");
                            e.target.src = "/default-avatar.png";
                        }}
                    />
                </div>

                {isEditing ? (
                    <form onSubmit={handleSubmit} className="profile-form">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Age</label>
                            <input
                                type="number"
                                name="age"
                                value={formData.age}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Height (cm)</label>
                            <input
                                type="number"
                                name="height"
                                value={formData.height}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Weight (kg)</label>
                            <input
                                type="number"
                                name="weight"
                                value={formData.weight}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="form-group">
                            <label>Gender</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Profile Image</label>
                            <input
                                type="file"
                                name="image"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        <div className="form-actions">
                            <button type="submit">Save Changes</button>
                            <button type="button" onClick={() => setIsEditing(false)}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="profile-info">
                        <div className="info-row">
                            <span className="info-label">Name:</span>
                            <span className="info-value">{userData.name || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{userData.email || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Age:</span>
                            <span className="info-value">{userData.age || 'Not set'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Height:</span>
                            <span className="info-value">
                                {userData.height ? `${userData.height} cm` : 'Not set'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Weight:</span>
                            <span className="info-value">
                                {userData.weight ? `${userData.weight} kg` : 'Not set'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Gender:</span>
                            <span className="info-value">
                                {userData.gender ? userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1) : 'Not set'}
                            </span>
                        </div>
                        <button
                            className="edit-btn"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserProfile;