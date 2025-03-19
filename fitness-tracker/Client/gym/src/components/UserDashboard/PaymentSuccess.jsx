import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { useContext } from 'react';
import '../../styles/PaymentSuccess.css';
import { detectServerPort } from '../../utils/serverPortDetector';

const PaymentSuccess = () => {
  const [redirectCountdown, setRedirectCountdown] = useState(5);
  const [verifying, setVerifying] = useState(true);
  const [verificationStatus, setVerificationStatus] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, fetchMembership } = useContext(AuthContext);

  // Extract session ID from URL
  const sessionId = new URLSearchParams(location.search).get('session_id');

  // Effect for verification and countdown
  useEffect(() => {
    // Show initial toast
    toast.info('Processing your payment...');
    
    // Store session ID in localStorage for verification after redirect
    if (sessionId) {
      localStorage.setItem('pendingStripeSession', sessionId);
      console.log('Stored session ID for verification:', sessionId);
      
      // Verify the payment with the server
      const verifyPayment = async () => {
        try {
          setVerifying(true);
          setVerificationStatus('Verifying payment with server...');
          
          // Ensure we're using the correct server port
          await detectServerPort();
          
          // Call the server to verify the payment
          const response = await API.get(`/payments/verify-session?session_id=${sessionId}`);
          console.log('Payment verification response:', response.data);
          
          // Check if payment was successful
          if (response.data.payment && response.data.payment.status === 'Completed') {
            setVerificationStatus('Payment verified successfully!');
            toast.success('Payment processed successfully!');
            
            // Refresh membership data in context
            if (user && user.id) {
              await fetchMembership(user.id);
            }
            
            // Start countdown after verification
            startCountdown();
          } else if (response.data.alreadyProcessed) {
            setVerificationStatus('Payment was already processed. Your membership is active.');
            toast.info('Payment was already processed. Your membership is active.');
            
            // Refresh membership data in context
            if (user && user.id) {
              await fetchMembership(user.id);
            }
            
            // Start countdown after verification
            startCountdown();
          } else {
            setVerificationStatus('Payment verification issue. Redirecting anyway...');
            toast.warning('Payment verification issue. Please check your dashboard for status.');
            startCountdown();
          }
        } catch (error) {
          console.error('Error verifying payment:', error);
          setVerificationStatus('Could not verify payment. Redirecting anyway...');
          toast.error('Error verifying payment. Please check your dashboard for status.');
          startCountdown();
        } finally {
          setVerifying(false);
        }
      };
      
      verifyPayment();
    } else {
      // No session ID, just start countdown
      setVerificationStatus('No payment session found. Redirecting...');
      startCountdown();
    }
    
    // Clean up function
    return () => {
      // Clear any timers if component unmounts
      if (window.countdownTimer) {
        clearInterval(window.countdownTimer);
      }
    };
  }, [sessionId, navigate, user, fetchMembership]);

  // Function to start countdown
  const startCountdown = () => {
    // Clear any existing timer
    if (window.countdownTimer) {
      clearInterval(window.countdownTimer);
    }
    
    // Set up countdown timer
    window.countdownTimer = setInterval(() => {
      setRedirectCountdown(prev => {
        if (prev <= 1) {
          clearInterval(window.countdownTimer);
          // Redirect to dashboard or login
          const token = localStorage.getItem('token');
          if (token) {
            navigate('/user/dashboard');
          } else {
            navigate('/users/login');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle manual redirect
  const handleRedirect = () => {
    if (window.countdownTimer) {
      clearInterval(window.countdownTimer);
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      navigate('/user/dashboard');
    } else {
      navigate('/users/login');
    }
  };

  return (
    <div className="payment-success-container">
      <div className="success-content">
        <div className="success-icon">✓</div>
        <h1>Payment Successful!</h1>
        <p>Thank you for your payment. Your membership has been activated.</p>
        
        <div className="membership-message">
          <p>You can view your membership details on your dashboard.</p>
        </div>
        
        {verifying ? (
          <p className="verification-status">{verificationStatus}</p>
        ) : (
          <p className="redirect-message">
            You will be redirected in {redirectCountdown} seconds...
          </p>
        )}
        
        <p className="status-message">{verificationStatus}</p>
        
        <button 
          onClick={handleRedirect} 
          className="dashboard-button"
          disabled={verifying}
        >
          {verifying && <span className="button-spinner"></span>}
          {localStorage.getItem('token') 
            ? 'Go to Dashboard Now' 
            : 'Go to Login Now'
          }
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess; 