import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaCalendarAlt } from 'react-icons/fa';
import { generalAPI } from '../../services/api.js';
import { useNotification } from '../../components/Notification';
import './AcademyUpdate.css';

const AcademyUpdate = () => {
  const { showError } = useNotification();

  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // View-only page: remove create/edit form and actions
  // Guard to prevent double-fetch in React.StrictMode (dev)
  const hasLoadedRef = useRef(false);

  const fetchUpdates = async () => {
    setLoading(true);
    setError(null);
    try {
      // Pull all public calendar events and show non-exam ones as updates
      const res = await generalAPI.getEvents();
      // Backend returns { success: true, data: events }
      const events = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      const nonExam = (events || []).filter((evt) => {
        const typeStr = (evt.eventType || evt.type || '').toLowerCase();
        return !typeStr.includes('exam');
      });
      const mapped = (nonExam || []).map((evt) => ({
        _id: evt._id || evt.id,
        title: evt.title,
        description: evt.description,
        category: evt.eventType || 'General',
        effectiveDate: (evt.startDate || evt.createdAt || '').substring(0, 10),
        priority: (evt.priority || '').toLowerCase() || 'normal',
      }));
      setUpdates(mapped);
    } catch (err) {
      setError(err.userMessage || 'Failed to load academy updates');
      showError(err.userMessage || 'Failed to load academy updates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;
    fetchUpdates();
  }, []);

  // Removed create/edit/delete handlers to make page strictly read-only

  return (
    <main className="academic-page">
      <section className="academic-hero">
        <div className="container">
          <h1>Academy Updates</h1>
          <p>Latest notices and updates relevant to academic activities</p>
        </div>
      </section>

      <section className="academic-content section">
        <div className="container">
          {/* Academic Navigation Tabs (Departments & Documents removed) */}
          <div className="academic-tabs">
            <Link to="/academic" className="tab-link">
              <FaCalendarAlt /> Academic Sessions
            </Link>
            <span className="tab-link active">
              <FaClipboardList /> Academy Updates
            </span>
          </div>

          <div className="academic-tab-content">
            {loading && <p>Loading updates...</p>}
            {error && !loading && <p className="error-text">{error}</p>}

            {!loading && !error && (
              <>
                {/* New Update button removed: updates are managed in Admin Academic Calendar */}

                <div className="updates-list">
                  {updates.length === 0 ? (
                    <p>No updates available.</p>
                  ) : (
                    updates.map((item) => (
                      <div key={item._id || item.id} className="update-card">
                        <div className="update-header">
                          <h3>{item.title}</h3>
                          <div className="update-meta">
                            <span className="category">{item.category || 'General'}</span>
                            <span className="date">{(item.effectiveDate || item.createdAt || '').substring(0, 10)}</span>
                          </div>
                        </div>
                        <p className="update-description">{item.description}</p>

                        {/* Edit/Delete actions removed on public view */}
                      </div>
                    ))
                  )}
                </div>
              </>
            )}

            {/* Update form removed: creation and edits are admin-only via Academic Calendar */}
          </div>
        </div>
      </section>
    </main>
  );
};

export default AcademyUpdate;