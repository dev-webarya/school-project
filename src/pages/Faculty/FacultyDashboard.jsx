import React, { useState, useEffect } from 'react';
import { facultyAPI } from '../../services/api.js';
import { FaClipboardList, FaUsers, FaChalkboardTeacher, FaVideo, FaTasks } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './FacultyDashboard.css';

export default function FacultyDashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [session, setSession] = useState('1');
  const REFRESH_MS = 30000; // 30 seconds

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await facultyAPI.getDashboard({ session });
      const data = response.data;
      if (data?.success) {
        setDashboardData(data.data);
        setLastUpdated(new Date());
        setError(null);
      } else {
        setError(data?.message || 'Failed to fetch dashboard data');
        setDashboardData(null);
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      const msg = err.userMessage || err.message || 'Failed to connect to server';
      setError(msg);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh polling
  useEffect(() => {
    const timer = setInterval(() => {
      fetchDashboardData();
    }, REFRESH_MS);
    return () => clearInterval(timer);
  }, [session]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <h1>Faculty Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <h1>Faculty Dashboard</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={fetchDashboardData} style={{ padding: '10px 20px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const stats = [
    { title: 'Classes Today', value: dashboardData?.stats?.classesToday || 0, icon: <FaChalkboardTeacher />, color: '#1a237e' },
    { title: 'Active Courses', value: dashboardData?.stats?.activeCourses || 0, icon: <FaClipboardList />, color: '#0d1757', to: '/faculty/courses' },
    { title: 'Total Students', value: dashboardData?.stats?.totalStudents || 0, icon: <FaUsers />, color: '#3f51b5' },
    { title: 'Assignments', value: dashboardData?.stats?.totalAssignments || 0, icon: <FaTasks />, color: '#2e7d32', to: '/faculty/assignments' },
  ];


  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1>Faculty Dashboard</h1>
          <p>Overview of your teaching schedule and activity.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: '#666' }}>Session</span>
            <select value={session} onChange={(e) => setSession(e.target.value)} style={{ padding: '6px 8px' }}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </label>
          <span style={{ fontSize: '0.85rem', color: '#666' }}>
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : '—'}
          </span>
          <button onClick={fetchDashboardData} style={{ padding: '8px 12px', background: '#f5f5f5', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Refresh</button>
        </div>
      </div>

      {/* Welcome header with actual faculty details */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '12px' }}>
        <h2 style={{ margin: 0 }}>
          Welcome, {dashboardData?.facultyInfo?.name || 'Faculty'}
        </h2>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Employee ID: <strong>{dashboardData?.facultyInfo?.employeeId || 'N/A'}</strong>
        </p>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Department: <strong>{dashboardData?.facultyInfo?.department || 'Not specified'}</strong>
        </p>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Email: <strong>{dashboardData?.facultyInfo?.email || 'N/A'}</strong>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {stats.map((s, i) => {
          const card = (
            <div key={i} style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '12px', cursor: s.to ? 'pointer' : 'default' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: s.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
                {s.icon}
              </div>
              <div>
                <h3 style={{ margin: 0 }}>{s.value}</h3>
                <p style={{ margin: 0, color: '#666' }}>{s.title}</p>
              </div>
            </div>
          );
          return s.to ? (
            <Link key={i} to={s.to} style={{ textDecoration: 'none' }}>
              {card}
            </Link>
          ) : card;
        })}
      </div>

      <div style={{ marginTop: '30px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Today's Classes</h2>
          <div>
            {dashboardData?.upcomingClasses?.length > 0 ? dashboardData.upcomingClasses.map((cls, idx) => (
              <div key={cls.id || idx} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>
                    <strong>{
                      (typeof cls.time === 'string' && cls.time)
                        ? (/AM|PM/i.test(cls.time)
                            ? cls.time
                            : new Date(`1970-01-01T${cls.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }))
                        : '—'
                    }</strong> • {(cls.subject || cls.course)}
                  </p>
                  <span style={{ fontSize: '0.8rem', color: '#888' }}>
                    {cls.class} • Room: {cls.room || 'N/A'}
                  </span>
                </div>
                <span style={{ padding: '2px 6px', borderRadius: '12px', fontSize: '0.7rem', background: '#fff3e0', color: '#ef6c00' }}>
                  today
                </span>
              </div>
            )) : (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>No classes scheduled for today</p>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.2rem' }}>Recent Activities</h2>
          <div>
            {dashboardData?.recentActivities?.length > 0 ? dashboardData.recentActivities.map(activity => (
              <div key={activity.id} style={{ padding: '12px 0', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>{activity.message}</p>
                    <span style={{ fontSize: '0.8rem', color: '#888' }}>{activity.class} • {activity.time}</span>
                  </div>
                  <span style={{ 
                    padding: '2px 6px', 
                    borderRadius: '12px', 
                    fontSize: '0.7rem', 
                    background: activity.type === 'assignment' ? '#e3f2fd' : activity.type === 'attendance' ? '#f3e5f5' : '#e8f5e9',
                    color: activity.type === 'assignment' ? '#1976d2' : activity.type === 'attendance' ? '#7b1fa2' : '#388e3c'
                  }}>
                    {activity.type}
                  </span>
                </div>
              </div>
            )) : (
              <p style={{ color: '#888', textAlign: 'center', padding: '20px 0' }}>No recent activities</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '30px' }}>
        <h2 style={{ marginBottom: '20px', fontSize: '1.2rem' }}>Quick Actions</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          <Link to="/faculty/online-classes" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '8px', 
              padding: '20px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.borderColor = '#1a237e';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.borderColor = 'transparent';
            }}>
              <div style={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%', 
                background: '#4caf50', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.3rem' 
              }}>
                <FaVideo />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#1a237e' }}>Online Classes</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>Create & manage virtual classes</p>
              </div>
            </div>
          </Link>
          <Link to="/faculty/teaching-assignments" style={{ textDecoration: 'none' }}>
            <div style={{ 
              background: 'white', 
              borderRadius: '8px', 
              padding: '20px', 
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px',
              cursor: 'pointer',
              transition: 'transform 0.2s',
              border: '2px solid transparent'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.borderColor = '#1a237e';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.borderColor = 'transparent';
            }}>
              <div style={{ 
                width: 50, 
                height: 50, 
                borderRadius: '50%', 
                background: '#2e7d32', 
                color: 'white', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontSize: '1.3rem' 
              }}>
                <FaTasks />
              </div>
              <div>
                <h3 style={{ margin: 0, color: '#1a237e' }}>Teaching Assignments</h3>
                <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>View admin-assigned responsibilities</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}