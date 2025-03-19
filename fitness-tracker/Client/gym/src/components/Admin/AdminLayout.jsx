import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import Footer from '../Footer';
import { getAdminProfile } from '../../api';
import '../../styles/AdminStyle.css';

const AdminLayout = () => {
  const [adminProfile, setAdminProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        // Check if token and role exist before making API calls
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        
        if (!token || role !== 'admin') {
          console.error('Authentication issue in AdminLayout');
          setError('Authentication required. Please log in again.');
          // Redirect to home page if not authenticated
          navigate('/');
          return;
        }
        
        const response = await getAdminProfile();
        setAdminProfile(response.data);
      } catch (err) {
        console.error('Error fetching admin profile:', err);
        setError('Failed to load admin profile');
        // Redirect to home page on error
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminProfile();
  }, [navigate]);

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="admin-layout-content">
        <div className="content-container">
          <div className="content-wrapper">
            <Outlet context={[adminProfile, setAdminProfile]} />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AdminLayout; 