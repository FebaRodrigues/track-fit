import React, { useState, useEffect } from 'react';
import { Box, Button, Typography, Alert, TextField, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { resetConnection } from '../../utils/resetConnection';
import { healthCheck } from '../../utils/apiConfig';

const ConnectionStatus = () => {
  const [isConnected, setIsConnected] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Check connection status
  useEffect(() => {
    let mounted = true;
    
    const checkConnection = async () => {
      if (!mounted) return;
      
      try {
        setCheckingConnection(true);
        
        // Use the healthCheck function from apiConfig
        const isHealthy = await healthCheck();
        
        if (mounted) {
          setIsConnected(isHealthy);
          if (isHealthy) {
            setRetryCount(0);
          } else {
            setRetryCount(prev => prev + 1);
          }
        }
      } catch (error) {
        console.error('Health check failed:', error);
        if (mounted) {
          setIsConnected(false);
          setRetryCount(prev => prev + 1);
        }
      } finally {
        if (mounted) {
          setCheckingConnection(false);
        }
      }
    };

    // Check immediately on component mount
    checkConnection();
    
    // Then check periodically
    const interval = setInterval(checkConnection, 30000);
    
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleRetryConnection = async () => {
    setCheckingConnection(true);
    try {
      const isHealthy = await healthCheck();
      setIsConnected(isHealthy);
      if (isHealthy) {
        setRetryCount(0);
      }
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setCheckingConnection(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleResetConnection = () => {
    resetConnection();
    window.location.reload();
  };

  // Only show when there's a connection issue and we've tried a few times
  // This prevents showing the alert on temporary network issues
  if (isConnected || retryCount < 2) return null;

  return (
    <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 9999 }}>
      <Alert 
        severity="warning" 
        variant="filled"
        sx={{ 
          opacity: 0.9,
          '&:hover': { opacity: 1 },
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          maxWidth: '300px'
        }}
        action={
          <Box>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetryConnection}
              disabled={checkingConnection}
              startIcon={checkingConnection ? <CircularProgress size={14} color="inherit" /> : null}
            >
              Retry
            </Button>
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleOpenDialog}
              disabled={checkingConnection}
            >
              Help
            </Button>
          </Box>
        }
      >
        Server connection issue detected
      </Alert>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Connection Troubleshooting</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            We're having trouble connecting to our servers. This could be due to:
          </Typography>
          <ul>
            <li>A temporary server outage</li>
            <li>Network connectivity issues on your end</li>
            <li>Server maintenance</li>
          </ul>
          <Typography variant="body1" sx={{ mb: 1, mt: 2 }}>
            You can try these steps:
          </Typography>
          <ol>
            <li>Check your internet connection</li>
            <li>Refresh the page</li>
            <li>Try again in a few minutes</li>
            <li>Clear your browser cache</li>
          </ol>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          <Button onClick={handleResetConnection} variant="contained" color="primary">
            Reset & Reload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ConnectionStatus; 