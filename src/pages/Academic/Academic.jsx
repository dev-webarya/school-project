import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUserGraduate } from 'react-icons/fa';
import { generalAPI } from '../../services/api.js';
import { useNotification } from '../../hooks/useNotification.js';
import './Academic.css';

const Academic = () => {
  const [activeTab, setActiveTab] = useState('sessions');
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [academicSessions, setAcademicSessions] = useState([]);
  // Departments and Academic Documents removed

  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load events as academic sessions (fallback-friendly mapping)
        const eventsRes = await generalAPI.getEvents();
        // Backend returns { success: true, data: events }
        const events = Array.isArray(eventsRes.data) ? eventsRes.data : (eventsRes.data?.data || []);
        // Only show Exam-related events under Academic Sessions
        const examEvents = (events || []).filter((evt) => {
          const typeStr = (evt.eventType || evt.type || '').toLowerCase();
          return typeStr.includes('exam');
        });
        const mappedSessions = (examEvents || []).map((evt, idx) => {
          const start = evt.startDate || evt.date || evt.start || evt.createdAt;
          const end = evt.endDate || evt.end || evt.updatedAt;
          const startStr = start ? new Date(start).toLocaleDateString() : 'TBD';
          const endStr = end ? new Date(end).toLocaleDateString() : 'TBD';
          const year = start ? `${new Date(start).getFullYear()}` : (evt.year || 'Upcoming');
          const highlights = [
            evt.title || evt.name || 'Exam',
            evt.description || evt.details || ''
          ].filter(Boolean);
          return {
            id: evt._id || evt.id || idx + 1,
            year,
            startDate: startStr,
            endDate: endStr,
            highlights,
          };
        });
        setAcademicSessions(mappedSessions.length ? mappedSessions : []);

        // Removed Departments and Academic Documents data loading
      } catch (err) {
        setError(err.userMessage || 'Failed to load academic data');
        showError(err.userMessage || 'Failed to load academic data');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <main className="academic-page">
      {/* Hero Section */}
      <section className="academic-hero">
        <div className="container">
          <h1>Academic</h1>
          <p>Excellence in education through innovative teaching and comprehensive learning</p>
        </div>
      </section>

      {/* Academic Content */}
      <section className="academic-content section">
        <div className="container">
          <div className="academic-tabs">
            <button 
              className={activeTab === 'sessions' ? 'active' : ''} 
              onClick={() => setActiveTab('sessions')}
            >
              <FaCalendarAlt /> Academic Sessions
            </button>
            {/* Departments and Academic Documents tabs removed */}
            <Link to="/academic/updates" className="tab-link">
              <FaUserGraduate /> Academy Updates
            </Link>
          </div>

          <div className="academic-tab-content">
            {loading && <p>Loading academic information...</p>}
            {error && !loading && <p className="error-text">{error}</p>}
            {activeTab === 'sessions' && (
              <div className="sessions-content">
                <h2>Academic Sessions</h2>
                <p>BBD Academy follows an annual academic calendar. Here are the details of our current and previous academic sessions:</p>
                
                <div className="sessions-list">
                  {academicSessions.length === 0 && !loading && !error && (
                    <p>No sessions available.</p>
                  )}
                  {academicSessions.map(session => (
                    <div className="session-card" key={session.id}>
                      <div className="session-header">
                        <h3>{session.year}</h3>
                        <span className="session-dates">
                          <FaCalendarAlt /> {session.startDate} to {session.endDate}
                        </span>
                      </div>
                      <div className="session-highlights">
                        <h4>Session Highlights:</h4>
                        <ul>
                          {session.highlights.map((highlight, index) => (
                            <li key={index}>{highlight}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Departments and Academic Documents sections removed */}
          </div>
        </div>
      </section>
    </main>
  );
};


export default Academic;