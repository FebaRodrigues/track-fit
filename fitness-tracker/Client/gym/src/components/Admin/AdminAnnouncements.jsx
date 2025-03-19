// src/components/Admin/AdminAnnouncements.jsx
import React, { useState, useEffect } from 'react';
import { getAnnouncementsAdmin, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../../api';
import { Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes } from 'react-icons/fa';
import '../../styles/AdminStyle.css';

const AdminAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isActive: true,
    id: null
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAnnouncementsAdmin();
      console.log('Fetched announcements:', response.data);
      setAnnouncements(response.data);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setError('Failed to load announcements. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (formData.id) {
        // Update existing announcement
        await updateAnnouncement(formData.id, {
          title: formData.title,
          content: formData.content,
          isActive: formData.isActive
        });
      } else {
        // Create new announcement
        await createAnnouncement({
          title: formData.title,
          content: formData.content,
          isActive: formData.isActive
        });
      }
      
      // Refresh announcements list
      await fetchAnnouncements();
      
      // Reset form
      resetForm();
    } catch (err) {
      console.error('Error saving announcement:', err);
      setError('Failed to save announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (announcement) => {
    setFormData({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content,
      isActive: announcement.isActive || true
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      await deleteAnnouncement(id);
      await fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      setError('Failed to delete announcement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      isActive: true,
      id: null
    });
    setShowForm(false);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="admin-content">
      <div className="admin-announcements-container">
        <div className="section-header">
          <h2>Announcements Management</h2>
          <Button 
            variant={showForm ? "secondary" : "primary"} 
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? 'Cancel' : <><FaPlus /> Create Announcement</>}
          </Button>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        
        {showForm && (
          <div className="announcement-form">
            <h3>{formData.id ? 'Edit Announcement' : 'Create New Announcement'}</h3>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Title</Form.Label>
                <Form.Control
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter announcement title"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Content</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter announcement content"
                />
              </Form.Group>

              <Form.Group className="mb-3 checkbox-group">
                <Form.Check
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  label="Active"
                />
              </Form.Group>

              <div className="d-flex justify-content-end gap-2">
                <Button variant="secondary" onClick={resetForm}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                      <span className="ms-2">Saving...</span>
                    </>
                  ) : (
                    <>{formData.id ? 'Update' : 'Create'}</>
                  )}
                </Button>
              </div>
            </Form>
          </div>
        )}
        
        {loading && !showForm ? (
          <div className="text-center my-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </div>
        ) : (
          <>
            {announcements.length > 0 ? (
              <div className="announcements-list">
                {announcements.map((announcement) => (
                  <div 
                    key={announcement._id} 
                    className={`announcement-card ${!announcement.isActive ? 'inactive' : ''}`}
                  >
                    <div className="announcement-header">
                      <h3>{announcement.title}</h3>
                      <span className={`announcement-status status ${announcement.isActive ? 'active' : 'inactive'}`}>
                        {announcement.isActive ? (
                          <><FaCheck /> Active</>
                        ) : (
                          <><FaTimes /> Inactive</>
                        )}
                      </span>
                    </div>
                    <div className="announcement-content">
                      {announcement.content}
                    </div>
                    <div className="announcement-footer">
                      <span className="announcement-date">
                        {announcement.updatedAt 
                          ? `Updated: ${formatDate(announcement.updatedAt)}` 
                          : `Created: ${formatDate(announcement.createdAt)}`}
                      </span>
                      <div className="announcement-actions">
                        <button 
                          className="icon-button edit" 
                          onClick={() => handleEdit(announcement)}
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="icon-button delete" 
                          onClick={() => handleDelete(announcement._id)}
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>No announcements found. Create your first announcement!</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminAnnouncements;