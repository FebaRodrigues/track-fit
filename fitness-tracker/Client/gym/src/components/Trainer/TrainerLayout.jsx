import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import TrainerSidebar from './TrainerSidebar';
import './TrainerLayout.css';

const TrainerLayout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated as trainer
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    
    if (!token || role !== 'trainer') {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="trainer-layout">
      <TrainerSidebar />
      <main className="trainer-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default TrainerLayout; 