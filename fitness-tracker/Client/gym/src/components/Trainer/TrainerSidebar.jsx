import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaUsers, FaDumbbell, FaChartBar, FaMoneyBillWave, FaCalendarAlt, FaBullhorn, FaSignOutAlt, FaUserCog } from 'react-icons/fa';
import './TrainerSidebar.css';
import '../../styles/TracFitLogo.css';

const TrainerSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [trainerProfile, setTrainerProfile] = useState(null);

  useEffect(() => {
    // Get trainer profile from localStorage
    const storedTrainer = localStorage.getItem('trainerUser');
    if (storedTrainer) {
      setTrainerProfile(JSON.parse(storedTrainer));
    }
  }, []);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleLogout = () => {
    // Clear all auth-related data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('trainerUser');
    
    // Redirect to home page
    navigate('/');
  };

  return (
    <div className="trainer-sidebar">
      {/* TracFit Logo/Title */}
      <div className="tracfit-logo">
        <Link to="/trainer/dashboard">
          <span className="track-part">Track</span><span className="fit-part">Fit</span>
        </Link>
      </div>
      
      <div className="trainer-profile-brief">
        {trainerProfile && (
          <>
            <div className="trainer-avatar">
              <img 
                src={trainerProfile.image || "https://via.placeholder.com/50"} 
                alt="Trainer" 
                key={`avatar-${trainerProfile._id}-${new Date().getTime()}`}
              />
            </div>
            <div className="trainer-name">{trainerProfile.name}</div>
          </>
        )}
      </div>
      
      <nav className="trainer-nav">
        <Link 
          to="/trainer/dashboard" 
          className={`nav-item ${isActive('/trainer/dashboard') ? 'active' : ''}`}
        >
          <FaChartBar /> Dashboard
        </Link>
        <Link 
          to="/trainer/clients" 
          className={`nav-item ${isActive('/trainer/clients') ? 'active' : ''}`}
        >
          <FaUsers /> Clients
        </Link>
        <Link 
          to="/trainer/workout-plans" 
          className={`nav-item ${isActive('/trainer/workout-plans') ? 'active' : ''}`}
        >
          <FaDumbbell /> Workout Plans
        </Link>
        <Link 
          to="/trainer/appointments" 
          className={`nav-item ${isActive('/trainer/appointments') ? 'active' : ''}`}
        >
          <FaCalendarAlt /> Appointments
        </Link>
        <Link 
          to="/trainer/payments" 
          className={`nav-item ${isActive('/trainer/payments') ? 'active' : ''}`}
        >
          <FaMoneyBillWave /> Payments
        </Link>
        <Link 
          to="/trainer/announcements" 
          className={`nav-item ${isActive('/trainer/announcements') ? 'active' : ''}`}
        >
          <FaBullhorn /> Announcements
        </Link>
        <Link 
          to="/trainer/profile" 
          className={`nav-item ${isActive('/trainer/profile') ? 'active' : ''}`}
        >
          <FaUserCog /> Profile
        </Link>
        
        <button onClick={handleLogout} className="nav-item logout-btn">
          <FaSignOutAlt /> Logout
        </button>
      </nav>
    </div>
  );
};

export default TrainerSidebar; 