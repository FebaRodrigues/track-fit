import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaDumbbell, FaChartBar, FaMoneyBillWave, FaUserTie, FaCog, FaBullhorn, FaSpa, FaSignOutAlt } from 'react-icons/fa';
import { getAdminProfile } from '../../api';
import './AdminSidebar.css';
import '../../styles/TracFitLogo.css';

const AdminSidebar = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        // First try to get the admin profile from localStorage
        const storedAdminUser = localStorage.getItem('adminUser');
        if (storedAdminUser) {
          setAdminProfile(JSON.parse(storedAdminUser));
        }
        
        // Then try to get it from the API
        const response = await getAdminProfile();
        setAdminProfile(response.data);
      } catch (error) {
        console.error('Error fetching admin profile:', error);
        // If API call fails, we'll still have the localStorage data
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('adminUser');
    
    // Redirect to home page
    navigate('/');
  };

  return (
    <div className="admin-sidebar">
      {/* TracFit Logo/Title */}
      <div className="tracfit-logo">
        <Link to="/admin/dashboard">
          <span className="track-part">Track</span><span className="fit-part">Fit</span>
        </Link>
      </div>
      
      <div className="admin-profile-brief">
        {adminProfile && (
          <>
            <div className="admin-avatar">
              <img 
                src={adminProfile.image || "https://via.placeholder.com/50"} 
                alt="Admin" 
                key={`avatar-${adminProfile._id}-${new Date().getTime()}`}
              />
            </div>
            <div className="admin-name">{adminProfile.name}</div>
          </>
        )}
      </div>
      
      <nav className="admin-nav">
        <Link 
          to="/admin/dashboard" 
          className={`nav-item ${isActive('/admin/dashboard') ? 'active' : ''}`}
        >
          <FaChartBar /> Dashboard
        </Link>
        <Link 
          to="/admin/users" 
          className={`nav-item ${isActive('/admin/users') ? 'active' : ''}`}
        >
          <FaUsers /> User Management
        </Link>
        <Link 
          to="/admin/trainers" 
          className={`nav-item ${isActive('/admin/trainers') ? 'active' : ''}`}
        >
          <FaUserTie /> Trainer Management
        </Link>
        <Link 
          to="/admin/content" 
          className={`nav-item ${isActive('/admin/content') ? 'active' : ''}`}
        >
          <FaDumbbell /> Content Management
        </Link>
        <Link 
          to="/admin/spa" 
          className={`nav-item ${isActive('/admin/spa') ? 'active' : ''}`}
        >
          <FaSpa /> SPA Management
        </Link>
        <Link 
          to="/admin/subscriptions" 
          className={`nav-item ${isActive('/admin/subscriptions') ? 'active' : ''}`}
        >
          <FaMoneyBillWave /> Subscriptions
        </Link>
        <Link 
          to="/admin/announcements" 
          className={`nav-item ${isActive('/admin/announcements') ? 'active' : ''}`}
        >
          <FaBullhorn /> Announcements
        </Link>
        <Link 
          to="/admin/analytics" 
          className={`nav-item ${isActive('/admin/analytics') ? 'active' : ''}`}
        >
          <FaChartBar /> Analytics
        </Link>
        <Link 
          to="/admin/settings" 
          className={`nav-item ${isActive('/admin/settings') ? 'active' : ''}`}
        >
          <FaCog /> Settings
        </Link>
        
        <button onClick={handleLogout} className="nav-item logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </div>
  );
};

export default AdminSidebar; 