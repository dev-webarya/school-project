import React, { useState, useEffect } from 'react';
import { FaVideo, FaCalendarAlt, FaClock, FaUsers, FaChalkboardTeacher } from 'react-icons/fa';
import { studentAPI } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import { useLoading } from '../../hooks/useLoading';

export default function StudentOnlineClasses() {
  const [onlineClasses, setOnlineClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [joinDetails, setJoinDetails] = useState({});

  const { startLoading, stopLoading } = useLoading();
  const { showSuccess, showError } = useNotification();

  // Fetch online classes on component mount
  useEffect(() => {
    fetchOnlineClasses();
  }, []);

  const fetchOnlineClasses = async () => {
    try {
      setLoading(true);
      startLoading('Fetching online classes...');
      
      const response = await studentAPI.getOnlineClasses();
      if (response.data.success) {
        if (Array.isArray(response.data.data)) {
          setOnlineClasses(response.data.data);
        } else {
          console.warn('API response data is not an array:', response.data.data);
          setOnlineClasses([]);
        }
      } else {
        throw new Error(response.data.message || 'Failed to fetch online classes');
      }
    } catch (err) {
      console.error('Error fetching online classes:', err);
      setError(err.message || 'Failed to fetch online classes');
      showError('Failed to fetch online classes');
      setOnlineClasses([]);
    } finally {
      setLoading(false);
      stopLoading();
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess('Copied to clipboard');
    } catch (e) {
      showError('Failed to copy');
    }
  };

  const joinClass = async (classId) => {
    try {
      startLoading('Fetching join details...');
      const response = await studentAPI.joinOnlineClass(classId);
      if (response.data?.success) {
        const data = response.data.data || {};
        setJoinDetails(prev => ({ ...prev, [classId]: data }));
        showSuccess('Join details ready');
        // Auto-open meeting link when class is live
        if (data.status === 'live' && data.meetingLink) {
          window.open(data.meetingLink, '_blank', 'noopener,noreferrer');
        }
      } else {
        throw new Error(response.data?.message || 'Failed to get join details');
      }
    } catch (err) {
      console.error('Error joining class:', err);
      showError(err.userMessage || err.message || 'Failed to get join details');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const isToday = (dateString) => {
    const today = new Date();
    const classDate = new Date(dateString);
    return today.toDateString() === classDate.toDateString();
  };

  // Ensure onlineClasses is always treated as an array
  const safeOnlineClasses = Array.isArray(onlineClasses) ? onlineClasses : [];

  if (loading && safeOnlineClasses.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
        <p>Loading your online classes...</p>
      </div>
    );
  }

  if (error && safeOnlineClasses.length === 0) {
    return (
      <div className="container" style={{ padding: '100px 0', textAlign: 'center' }}>
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
    <div className="container" style={{ padding: '100px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1>Online Classes</h1>
          <p>Join your scheduled online classes for your class</p>
        </div>
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

      {safeOnlineClasses.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#666' }}>
          <FaVideo style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.3 }} />
          <h3>No Online Classes Scheduled</h3>
          <p>Your teachers haven't scheduled any online classes yet. Check back later!</p>
        </div>
      ) : (
        <div>
          {/* Stats Summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaVideo style={{ color: '#4caf50', fontSize: '24px' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#4caf50' }}>
                    {safeOnlineClasses.filter(c => c.status === 'live').length}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Live Now</p>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaCalendarAlt style={{ color: '#2196f3', fontSize: '24px' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#2196f3' }}>
                    {safeOnlineClasses.filter(c => c.status === 'scheduled').length}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Scheduled</p>
                </div>
              </div>
            </div>
            <div style={{ background: 'white', borderRadius: '8px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <FaChalkboardTeacher style={{ color: '#ff9800', fontSize: '24px' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#ff9800' }}>
                    {safeOnlineClasses.length}
                  </h3>
                  <p style={{ margin: 0, color: '#666' }}>Total Classes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Classes Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
            {safeOnlineClasses.map(cls => (
              <div key={cls._id} style={{ 
                background: 'white',
                border: '1px solid #e0e0e0', 
                borderRadius: '12px', 
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${getStatusColor(cls.status)}`,
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ 
                      background: getStatusColor(cls.status), 
                      color: 'white', 
                      padding: '4px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {getStatusText(cls.status)}
                    </div>
                    {isToday(cls.date) && (
                      <div style={{ 
                        background: '#ff9800', 
                        color: 'white', 
                        padding: '4px 8px', 
                        borderRadius: '12px', 
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        Today
                      </div>
                    )}
                  </div>
                  <div style={{ color: '#666' }}>
                    {getPlatformIcon(cls.platform)}
                  </div>
                </div>

                <h3 style={{ margin: '0 0 12px 0', color: '#1a237e', fontSize: '18px' }}>{cls.title}</h3>
                
                <div style={{ display: 'grid', gap: '8px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <FaCalendarAlt />
                    <span>{formatDate(cls.date)} at {formatTime(cls.time)}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <FaClock />
                    <span>{cls.duration} minutes</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                    <FaUsers />
                    <span>{cls.subject} - Class {cls.className}</span>
                  </div>
                  {cls.teacher && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666' }}>
                      <FaChalkboardTeacher />
                      <span>{cls.teacher}</span>
                    </div>
                  )}
                </div>

                {cls.description && (
                  <p style={{ margin: '0 0 16px 0', color: '#666', fontSize: '14px', lineHeight: '1.5' }}>
                    {cls.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button
                    onClick={() => joinClass(cls._id)}
                    style={{
                      background: cls.status === 'live' ? '#4caf50' : '#2196f3',
                      color: 'white',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    <FaVideo /> {cls.status === 'live' ? 'Join Now' : 'Get Join Link'}
                  </button>

                  {joinDetails[cls._id]?.meetingLink && (
                    <a
                      href={joinDetails[cls._id].meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        background: '#f5f5f5',
                        color: '#1a237e',
                        border: '1px solid #ddd',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        textDecoration: 'none',
                        fontSize: '12px'
                      }}
                    >
                      Open Link
                    </a>
                  )}

                  {joinDetails[cls._id]?.accessCode && (
                    <div style={{ 
                      marginLeft: 'auto',
                      padding: '8px 12px', 
                      background: '#f5f5f5', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      Code: {joinDetails[cls._id].accessCode}
                      <button
                        onClick={() => copyToClipboard(joinDetails[cls._id].accessCode)}
                        style={{
                          background: '#e0e0e0',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '4px 8px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                      >
                        Copy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}