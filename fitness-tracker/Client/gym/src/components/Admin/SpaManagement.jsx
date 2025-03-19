import React, { useState, useEffect } from 'react';
import API from '../../api';
import { toast } from 'react-toastify';
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import 'react-tabs/style/react-tabs.css';

const SpaManagement = () => {
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabIndex, setTabIndex] = useState(0);
  
  // For service form
  const [newService, setNewService] = useState({
    name: '',
    description: '',
    duration: 60,
    price: 0,
    image: ''
  });
  
  // For editing service
  const [editingService, setEditingService] = useState(null);
  
  // For reports
  const [reportPeriod, setReportPeriod] = useState('month');
  const [reportData, setReportData] = useState({
    totalBookings: 0,
    confirmedBookings: 0,
    pendingBookings: 0,
    cancelledBookings: 0,
    completedBookings: 0,
    totalRevenue: 0,
    freeSessionsUsed: 0,
    popularServices: []
  });

  useEffect(() => {
    fetchServices();
    fetchBookings();
    generateReport(reportPeriod);
  }, [reportPeriod]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const response = await API.get('/spa/services');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching SPA services:', error);
      setError('Failed to load SPA services');
      toast.error('Error loading SPA services');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await API.get('/spa/bookings');
      setBookings(response.data);
    } catch (error) {
      console.error('Error fetching SPA bookings:', error);
      setError('Failed to load SPA bookings');
      toast.error('Error loading SPA bookings');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (period) => {
    try {
      setLoading(true);
      const response = await API.get(`/spa/reports?period=${period}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Error generating SPA report:', error);
      toast.error('Error generating SPA report');
    } finally {
      setLoading(false);
    }
  };

  const handleServiceChange = (e) => {
    const { name, value } = e.target;
    setNewService(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? parseFloat(value) : value
    }));
  };

  const handleEditServiceChange = (e) => {
    const { name, value } = e.target;
    setEditingService(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'duration' ? parseFloat(value) : value
    }));
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await API.post('/spa/services', newService);
      toast.success('SPA service created successfully');
      setNewService({
        name: '',
        description: '',
        duration: 60,
        price: 0,
        image: ''
      });
      fetchServices();
    } catch (error) {
      console.error('Error creating SPA service:', error);
      toast.error('Failed to create SPA service');
    }
  };

  const handleEditService = (service) => {
    setEditingService(service);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/spa/services/${editingService._id}`, editingService);
      toast.success('SPA service updated successfully');
      setEditingService(null);
      fetchServices();
    } catch (error) {
      console.error('Error updating SPA service:', error);
      toast.error('Failed to update SPA service');
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) {
      return;
    }
    
    try {
      await API.delete(`/spa/services/${serviceId}`);
      toast.success('SPA service deleted successfully');
      fetchServices();
    } catch (error) {
      console.error('Error deleting SPA service:', error);
      toast.error('Failed to delete SPA service');
    }
  };

  const handleUpdateBookingStatus = async (bookingId, status) => {
    try {
      await API.put(`/spa/bookings/${bookingId}`, { status });
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      fetchBookings();
      generateReport(reportPeriod);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Completed':
        return 'bg-blue-100 text-blue-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && services.length === 0 && bookings.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold mb-6">SPA Management</h2>
      
      <Tabs selectedIndex={tabIndex} onSelect={index => setTabIndex(index)}>
        <TabList className="flex border-b mb-6">
          <Tab className="px-4 py-2 cursor-pointer border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 focus:outline-none">Bookings</Tab>
          <Tab className="px-4 py-2 cursor-pointer border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 focus:outline-none">Services</Tab>
          <Tab className="px-4 py-2 cursor-pointer border-b-2 border-transparent hover:text-blue-600 hover:border-blue-600 focus:outline-none">Reports</Tab>
        </TabList>
        
        {/* Bookings Tab */}
        <TabPanel>
          <h3 className="text-xl font-semibold mb-4">SPA Bookings</h3>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-2 px-4 border-b text-left">User</th>
                  <th className="py-2 px-4 border-b text-left">Service</th>
                  <th className="py-2 px-4 border-b text-left">Date & Time</th>
                  <th className="py-2 px-4 border-b text-left">Status</th>
                  <th className="py-2 px-4 border-b text-left">Free Session</th>
                </tr>
              </thead>
              <tbody>
                {bookings.length > 0 ? (
                  bookings.map(booking => (
                    <tr key={booking._id} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">
                        {booking.userId?.name || 'Unknown User'}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {booking.serviceId?.name || booking.serviceName || 
                         (typeof booking.serviceId === 'string' ? `Service ID: ${booking.serviceId}` : 
                          (booking.price ? `Service (Price: ₹${booking.price})` : 'Unknown Service'))}
                      </td>
                      <td className="py-2 px-4 border-b">
                        {new Date(booking.date).toLocaleDateString()} at {booking.time}
                      </td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(booking.status)}`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">
                        {booking.isFreeSession ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-4 text-center text-gray-500">
                      No bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabPanel>
        
        {/* Services Tab */}
        <TabPanel>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">SPA Services</h3>
              
              <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
                {services.map(service => (
                  <div key={service._id} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-lg font-medium">{service.name}</h4>
                        <p className="text-gray-600 text-sm">{service.description}</p>
                        <div className="mt-1 flex items-center text-sm">
                          <span className="mr-4">Duration: {service.duration} min</span>
                          <span>Price: ₹{service.price}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditService(service)}
                          className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteService(service._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              {editingService ? (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Edit Service</h3>
                  <form onSubmit={handleUpdateService}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={editingService.name}
                        onChange={handleEditServiceChange}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={editingService.description}
                        onChange={handleEditServiceChange}
                        className="w-full p-2 border rounded"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={editingService.duration}
                          onChange={handleEditServiceChange}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={editingService.price}
                          onChange={handleEditServiceChange}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Image URL
                      </label>
                      <input
                        type="text"
                        name="image"
                        value={editingService.image}
                        onChange={handleEditServiceChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingService(null)}
                        className="mr-2 bg-gray-300 text-gray-800 py-2 px-4 rounded hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                      >
                        Update Service
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="bg-white shadow rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Add New Service</h3>
                  <form onSubmit={handleCreateService}>
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={newService.name}
                        onChange={handleServiceChange}
                        className="w-full p-2 border rounded"
                        required
                      />
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Description
                      </label>
                      <textarea
                        name="description"
                        value={newService.description}
                        onChange={handleServiceChange}
                        className="w-full p-2 border rounded"
                        rows="3"
                        required
                      ></textarea>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Duration (minutes)
                        </label>
                        <input
                          type="number"
                          name="duration"
                          value={newService.duration}
                          onChange={handleServiceChange}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">
                          Price (₹)
                        </label>
                        <input
                          type="number"
                          name="price"
                          value={newService.price}
                          onChange={handleServiceChange}
                          className="w-full p-2 border rounded"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700 text-sm font-bold mb-2">
                        Image URL
                      </label>
                      <input
                        type="text"
                        name="image"
                        value={newService.image}
                        onChange={handleServiceChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
                      >
                        Add Service
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        </TabPanel>
        
        {/* Reports Tab */}
        <TabPanel>
          <h3 className="text-xl font-semibold mb-4">SPA Reports</h3>
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              Report Period
            </label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
              className="p-2 border rounded"
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Total Bookings</h4>
              <p className="text-2xl font-bold">{reportData.totalBookings}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Total Revenue</h4>
              <p className="text-2xl font-bold">${reportData.totalRevenue.toFixed(2)}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Free Sessions Used</h4>
              <p className="text-2xl font-bold">{reportData.freeSessionsUsed}</p>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-gray-500 text-sm">Pending Bookings</h4>
              <p className="text-2xl font-bold">{reportData.pendingBookings}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-2">Booking Status</h4>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span>Confirmed</span>
                  <span className="font-semibold">{reportData.confirmedBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Pending</span>
                  <span className="font-semibold">{reportData.pendingBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Completed</span>
                  <span className="font-semibold">{reportData.completedBookings}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Cancelled</span>
                  <span className="font-semibold">{reportData.cancelledBookings}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow">
              <h4 className="text-lg font-semibold mb-2">Popular Services</h4>
              {reportData.popularServices.length > 0 ? (
                <div className="space-y-2">
                  {reportData.popularServices.map((service, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span>{service.name}</span>
                      <span className="font-semibold">{service.count} bookings</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No data available</p>
              )}
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  );
};

export default SpaManagement; 