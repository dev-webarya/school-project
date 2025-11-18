import React, { useState, useEffect } from 'react';
import { FaVideo, FaCalendarAlt, FaClock, FaUsers, FaPlus, FaEdit, FaTrash, FaPlay, FaStop } from 'react-icons/fa';
import { facultyAPI } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { useLoading } from '../../hooks/useLoading';

export default function OnlineClasses() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { startLoading, stopLoading } = useLoading();
  const { showSuccess, showError } = useNotification();

  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    className: '',
    date: '',
    time: '',
    duration: 60,
    platform: 'zoom',
    description: ''
  });

  const subjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'Social Studies', 'Computer Science', 'Hindi'];
  const classOptions = ['NS', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

  // Fetch online classes on component mount
  useEffect(() => {
    fetchOnlineClasses();
  }, []);

  const fetchOnlineClasses = async () => {
    try {
      setLoading(true);
      startLoading('Fetching online classes...');
      
      const response = await facultyAPI.getOnlineClasses();
      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          setClasses(response.data.data);
        } else {
          console.warn('API response data is not an array:', response.data.data);
          setClasses([]);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch online classes');
      }
    } catch (err) {
      console.error('Error fetching online classes:', err);
      setError(err.message || 'Failed to fetch online classes');
      showError('Failed to fetch online classes');
      setClasses([]);
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      startLoading('Creating online class...');
      
      const response = await facultyAPI.createOnlineClass(formData);
      if (response.data.success) {
        showSuccess('Online class created successfully');
        setClasses(prev => [...prev, response.data.data]);
        setFormData({
          title: '',
          subject: '',
          className: '',
          date: '',
          time: '',
          duration: 60,
          platform: 'zoom',
          description: ''
        });
        setActiveTab('dashboard');
      } else {
        throw new Error(response.data.message || 'Failed to create online class');
      }
    } catch (err) {
      console.error('Error creating online class:', err);
      showError(err.message || 'Failed to create online class');
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const startClass = async (classId) => {
    try {
      startLoading('Starting online class...');
      
      const response = await facultyAPI.updateOnlineClassStatus(classId, 'live');
      if (response.data.success) {
        showSuccess('Class started successfully');
        setClasses(prev => prev.map(cls => 
          cls._id === classId ? { ...cls, status: 'live' } : cls
        ));
      } else {
        throw new Error(response.data.message || 'Failed to start class');
      }
    } catch (err) {
      console.error('Error starting class:', err);
      showError(err.message || 'Failed to start class');
    } finally {
      stopLoading();
    }
  };

  const endClass = async (classId) => {
    try {
      startLoading('Ending online class...');
      
      const response = await facultyAPI.updateOnlineClassStatus(classId, 'completed');
      if (response.data.success) {
        showSuccess('Class ended successfully');
        setClasses(prev => prev.map(cls => 
          cls._id === classId ? { ...cls, status: 'completed' } : cls
        ));
      } else {
        throw new Error(response.data.message || 'Failed to end class');
      }
    } catch (err) {
      console.error('Error ending class:', err);
      showError(err.message || 'Failed to end class');
    } finally {
      stopLoading();
    }
  };

  const deleteClass = async (classId) => {
    if (!window.confirm('Are you sure you want to delete this class?')) {
      return;
    }

    try {
      startLoading('Deleting online class...');
      
      const response = await facultyAPI.deleteOnlineClass(classId);
      if (response.data.success) {
        showSuccess('Class deleted successfully');
        setClasses(prev => prev.filter(cls => cls._id !== classId));
      } else {
        throw new Error(response.data.message || 'Failed to delete class');
      }
    } catch (err) {
      console.error('Error deleting class:', err);
      showError(err.message || 'Failed to delete class');
    } finally {
      stopLoading();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live': return '#4caf50';
      case 'scheduled': return '#2196f3';
      case 'completed': return '#9e9e9e';
      default: return '#757575';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'live': return 'Live Now';
      case 'scheduled': return 'Scheduled';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const getPlatformIcon = (platform) => {
    switch (platform) {
      case 'zoom': return '🎥';
      case 'meet': return '📹';
      case 'teams': return '💻';
      default: return '📺';
    }
  };

  // Ensure classes is always treated as an array
  const safeClasses = Array.isArray(classes) ? classes : [];

  if (loading && safeClasses.length === 0) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading online classes...</p>
      </div>
    );
  }

  if (error && safeClasses.length === 0) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
        <p>{error}</p>
        <button 
          onClick={fetchOnlineClasses}
          style={{
            background: '#1a237e',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            marginTop: '16px'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Online Classes</h1>
          <p>Manage your virtual classroom sessions</p>
        </div>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            background: '#1a237e',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px'
          }}
        >
          <FaPlus /> Create New Class
        </button>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', borderBottom: '2px solid #f0f0f0' }}>
        <button
          onClick={() => setActiveTab('dashboard')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'dashboard' ? '600' : '400',
            color: activeTab === 'dashboard' ? '#1a237e' : '#666',
            borderBottom: activeTab === 'dashboard' ? '2px solid #1a237e' : 'none'
          }}
        >
          Class Dashboard
        </button>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            background: 'none',
            border: 'none',
            padding: '12px 0',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'create' ? '600' : '400',
            color: activeTab === 'create' ? '#1a237e' : '#666',
            borderBottom: activeTab === 'create' ? '2px solid #1a237e' : 'none'
          }}
        >
          Create Class
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Quick Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaVideo style={{ color: '#4caf50', fontSize: '24px' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#4caf50' }}>
                    {safeClasses.filter(c => c.status === 'live').length}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Live Classes</p>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaCalendarAlt style={{ color: '#2196f3', fontSize: '24px' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#2196f3' }}>
                    {safeClasses.filter(c => c.status === 'scheduled').length}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Scheduled</p>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaUsers style={{ color: '#ff9800', fontSize: '24px' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#ff9800' }}>
                    {safeClasses.reduce((total, c) => total + (c.students?.length || 0), 0)}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Total Students</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes List */}
          <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Your Classes</h2>
              <button
                onClick={fetchOnlineClasses}
                style={{
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                🔄 Refresh
              </button>
            </div>
            
            {safeClasses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                <FaVideo style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }} />
                <p>No classes scheduled yet. Create your first online class!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {safeClasses.map(cls => (
                  <div key={cls._id} style={{ 
                    border: '1px solid #e0e0e0', 
                    borderRadius: '8px', 
                    padding: '20px',
                    borderLeft: `4px solid ${getStatusColor(cls.status)}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ margin: 0, color: '#1a237e' }}>{cls.title}</h3>
                          <span style={{ 
                            background: getStatusColor(cls.status), 
                            color: 'white', 
                            padding: '4px 8px', 
                            borderRadius: '12px', 
                            fontSize: '12px',
                            fontWeight: '500'
                          }}>
                            {getStatusText(cls.status)}
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                            <FaCalendarAlt />
                            <span>{new Date(cls.date).toLocaleDateString()} at {cls.time}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                            <FaClock />
                            <span>{cls.duration} minutes</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#666' }}>
                            <FaUsers />
                            <span>{cls.students?.length || 0} students</span>
                          </div>
                          <div style={{ color: '#666' }}>
                            <strong>{cls.subject}</strong> - Class {cls.className}
                          </div>
                          <div style={{ color: '#666' }}>
                            {cls.platform ? (getPlatformIcon(cls.platform) + ' ' + cls.platform.charAt(0).toUpperCase() + cls.platform.slice(1)) : '📺 Unknown'}
                          </div>
                        </div>
                        <p style={{ margin: 0, color: '#888', fontSize: '14px' }}>{cls.description}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '20px' }}>
                        {cls.status === 'scheduled' && (
                          <button
                            onClick={() => startClass(cls._id)}
                            style={{
                              background: '#4caf50',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FaPlay /> Start
                          </button>
                        )}
                        {cls.status === 'live' && (
                          <button
                            onClick={() => endClass(cls._id)}
                            style={{
                              background: '#f44336',
                              color: 'white',
                              border: 'none',
                              padding: '8px 12px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}
                          >
                            <FaStop /> End
                          </button>
                        )}
                        <a
                          href={cls.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: '#2196f3',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <FaVideo /> Join
                        </a>
                        <button
                          onClick={() => deleteClass(cls._id)}
                          style={{
                            background: '#f44336',
                            color: 'white',
                            border: 'none',
                            padding: '8px 12px',
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    {cls.accessCode && (
                      <div style={{ marginTop: '12px', padding: '8px', background: '#f5f5f5', borderRadius: '4px' }}>
                        <strong>Access Code:</strong> {cls.accessCode}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Class Tab */}
      {activeTab === 'create' && (
        <div style={{ background: 'white', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px' }}>Create New Online Class</h2>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Class Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                  placeholder="e.g., Mathematics - Algebra Basics"
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Subject *</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Class *</label>
                <select
                  name="className"
                  value={formData.className}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="">Select Class</option>
                  {classOptions.map(cls => (
                    <option key={cls} value={cls}>Class {cls}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Date *</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Time *</label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Duration (minutes) *</label>
                <select
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Platform *</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  required
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    fontSize: '16px'
                  }}
                >
                  <option value="zoom">Zoom</option>
                  <option value="meet">Google Meet</option>
                  <option value="teams">Microsoft Teams</option>
                </select>
              </div>
            </div>

            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
                placeholder="Brief description of the class content..."
              />
            </div>

            <div style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: '#1a237e',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '16px',
                  fontWeight: '500',
                  opacity: loading ? 0.6 : 1
                }}
              >
                {loading ? 'Creating...' : 'Create Class'}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('dashboard')}
                style={{
                  background: '#f5f5f5',
                  color: '#333',
                  border: '1px solid #ddd',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}