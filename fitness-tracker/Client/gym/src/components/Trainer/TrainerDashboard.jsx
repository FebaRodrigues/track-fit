//src/components/Trainer/TrainerDashboard.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import API from "../../api";
import { useNavigate } from "react-router-dom";
import { 
  Grid, 
  Paper, 
  Typography, 
  Button, 
  Card, 
  CardContent, 
  CardActions, 
  Avatar, 
  List, 
  ListItem, 
  ListItemAvatar, 
  ListItemText, 
  Divider, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel, 
  Box, 
  Chip,
  CircularProgress,
  Alert,
  IconButton
} from '@mui/material';
import { 
  Person as PersonIcon, 
  Event as EventIcon, 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon, 
  Schedule as ScheduleIcon,
  ArrowForward as ArrowForwardIcon,
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  FitnessCenter as FitnessCenterIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import '../../styles/TrainerDashboard.css';

const TrainerDashboard = () => {
  const { trainer } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({
    totalClients: 0,
    pendingAppointments: 0,
    confirmedAppointments: 0,
    completedGoals: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!trainer || (!trainer.id && !trainer._id)) {
      setError("Trainer not authenticated or missing ID");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const trainerId = trainer.id || trainer._id;
        const clientsResponse = await API.get(`/trainers/${trainerId}/clients`);
        const appointmentsResponse = await API.get(`/appointments/trainer/${trainerId}`);
        
        setClients(clientsResponse.data);
        setAppointments(appointmentsResponse.data);
        
        // Calculate stats
        const pendingAppointments = appointmentsResponse.data.filter(a => a.status === 'pending').length;
        const confirmedAppointments = appointmentsResponse.data.filter(a => a.status === 'confirmed').length;
        
        setStats({
          totalClients: clientsResponse.data.length,
          pendingAppointments,
          confirmedAppointments,
          completedGoals: 0 // This would need a separate API call to get completed goals
        });
      } catch (err) {
        setError("Failed to fetch data: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainer, navigate]);

  const handleStatusUpdate = async (appointmentId, status) => {
    try {
      await API.put(`/appointments/${appointmentId}`, { status });
      const trainerId = trainer.id || trainer._id;
      const response = await API.get(`/appointments/trainer/${trainerId}`);
      setAppointments(response.data);
      
      // Update stats
      const pendingAppointments = response.data.filter(a => a.status === 'pending').length;
      const confirmedAppointments = response.data.filter(a => a.status === 'confirmed').length;
      
      setStats(prevStats => ({
        ...prevStats,
        pendingAppointments,
        confirmedAppointments
      }));
    } catch (err) {
      setError("Failed to update appointment status: " + err.message);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'error';
      case 'completed': return 'info';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      weekday: 'short',
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <CircularProgress />
    </Box>
  );
  
  if (error) return (
    <Box sx={{ p: 3 }}>
      <Alert severity="error">{error}</Alert>
    </Box>
  );

  const trainerId = trainer.id || trainer._id;

  return (
    <div className="trainer-dashboard">
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Trainer Dashboard
        </Typography>
        
        <Typography variant="h6" gutterBottom>
          Welcome, {trainer.name}
        </Typography>
        
        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4, mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} className="stats-card">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#3f51b5', mr: 2 }}>
                  <PeopleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.totalClients}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Clients</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} className="stats-card">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#f50057', mr: 2 }}>
                  <ScheduleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.pendingAppointments}</Typography>
                  <Typography variant="body2" color="textSecondary">Pending Appointments</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} className="stats-card">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#4caf50', mr: 2 }}>
                  <CheckCircleIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.confirmedAppointments}</Typography>
                  <Typography variant="body2" color="textSecondary">Confirmed Appointments</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} className="stats-card">
              <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
                <Avatar sx={{ bgcolor: '#ff9800', mr: 2 }}>
                  <FlagIcon />
                </Avatar>
                <Box>
                  <Typography variant="h4">{stats.completedGoals}</Typography>
                  <Typography variant="body2" color="textSecondary">Completed Goals</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        </Grid>
        
        {/* Quick Actions */}
        <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
          Quick Actions
        </Typography>
        
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/trainer/clients')}
              sx={{ p: 1.5 }}
            >
              Manage Clients
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="secondary" 
              fullWidth
              startIcon={<FitnessCenterIcon />}
              onClick={() => navigate('/trainer/workout-plans')}
              sx={{ p: 1.5 }}
            >
              Workout Plans
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              color="success" 
              fullWidth
              startIcon={<FlagIcon />}
              onClick={() => navigate('/trainer/goals')}
              sx={{ p: 1.5 }}
            >
              Goal Management
            </Button>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="outlined" 
              color="primary" 
              fullWidth
              startIcon={<PersonIcon />}
              onClick={() => navigate(`/trainers/profile/${trainerId}`)}
              sx={{ p: 1.5 }}
            >
        View Profile
            </Button>
          </Grid>
        </Grid>
        
        {/* Clients and Appointments Sections */}
        <Grid container spacing={3}>
          {/* Clients Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Your Clients
              </Typography>
              
      {clients.length > 0 ? (
                <List>
                  {clients.slice(0, 5).map((client) => (
                    <React.Fragment key={client._id}>
                      <ListItem 
                        button
                        onClick={() => navigate(`/trainer/clients?clientId=${client._id}`)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <PersonIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={client.name} 
                          secondary={client.email} 
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
                  No clients booked yet.
                </Typography>
              )}
              
              {clients.length > 5 && (
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Button 
                    variant="text" 
                    color="primary"
                    onClick={() => navigate('/trainer/clients')}
                  >
                    View All Clients
                  </Button>
                </Box>
              )}
            </Paper>
          </Grid>
          
          {/* Appointments Section */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Upcoming Appointments
              </Typography>
              
              {appointments.length > 0 ? (
                <List>
                  {appointments.slice(0, 5).map((appointment) => (
                    <React.Fragment key={appointment._id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar>
                            <EventIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText 
                          primary={appointment.userId.name} 
                          secondary={formatDate(appointment.date)}
                        />
                        <Chip 
                          label={appointment.status} 
                          color={getStatusColor(appointment.status)}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 120 }}>
                          <Select
                            value={appointment.status}
                            onChange={(e) => handleStatusUpdate(appointment._id, e.target.value)}
                            displayEmpty
                            variant="outlined"
                          >
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="confirmed">Confirmed</MenuItem>
                            <MenuItem value="cancelled">Cancelled</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                          </Select>
                        </FormControl>
                      </ListItem>
                      <Divider variant="inset" component="li" />
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <Typography variant="body1" color="textSecondary" sx={{ p: 2 }}>
                  No upcoming appointments.
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </div>
  );
};

export default TrainerDashboard;