import React, { useEffect, useState } from 'react';
import api, { adminAPI } from '../../services/api.js';
import config from '../../config/config.js';
import './StudentEnrollment.css';

// Minimal implementation aligned with tests in src/tests/StudentEnrollment.test.js
const StudentEnrollment = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [students, setStudents] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [waitlists, setWaitlists] = useState([]);
  const [view, setView] = useState('students');
  const [classFilter, setClassFilter] = useState('All Classes');
  const [search, setSearch] = useState('');

  const [showWaitlistModal, setShowWaitlistModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        let studentsRes, admissionsRes;

        if (config.IS_E2E) {
          [studentsRes, admissionsRes] = await Promise.all([
            adminAPI.getStudents({ params: { page: 1, limit: 50 } }),
            api.get('/e2e/admissions')
          ]);
        } else {
          [studentsRes] = await Promise.all([
            adminAPI.getStudents({ params: { page: 1, limit: 50 } })
          ]);
          try {
            admissionsRes = await adminAPI.getAdmissions({ params: { status: 'submitted', limit: 50 } });
          } catch (admErr) {
            console.warn('Admin admissions fetch failed:', admErr);
          }
        }

        // Courses view removed in enrollment; subjects fetch omitted

        // Students (admin list API returns transformed data)
        const studentsData = studentsRes?.data?.data?.students || [];
        const mappedStudents = studentsData.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          studentId: s.studentId || s.admissionNumber || '-',
          department: s.department || '-',
          year: s.year || '-',
          gpa: s.gpa || null
        }));

        // Admissions mapped into local waitlist view
        let mappedWaitlists = [];
        if (admissionsRes) {
          const admissionsData = config.IS_E2E
            ? (Array.isArray(admissionsRes?.data?.data)
                ? admissionsRes.data.data
                : (Array.isArray(admissionsRes?.data) ? admissionsRes.data : []))
            : (Array.isArray(admissionsRes?.data?.data?.admissions)
                ? admissionsRes.data.data.admissions
                : []);

          mappedWaitlists = (admissionsData || []).map(app => ({
            id: app._id || app.id || app.applicationNumber,
            applicantName: app?.studentInfo?.name || app?.studentInfo?.fullName || '-',
            applyingClass: app?.academicInfo?.applyingForClass || '-',
            applicationNumber: app?.applicationNumber || '-',
            status: app?.status || 'submitted',
            receivedAt: app?.submittedAt || app?.createdAt || null,
            processed: app?.status === 'approved'
          }));
        }

        setStudents(mappedStudents);
        setEnrollments([]);
        setWaitlists(mappedWaitlists);
      } catch (err) {
        console.error('Enrollment data fetch error:', err);
        setError(err.userMessage || 'Failed to load enrollment data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Courses enrollment actions removed

  const processWaitlist = (wl) => {
    // Placeholder for future backend integration; update local state only
    const updated = waitlists.map(w => w === wl ? { ...w, processed: true } : w);
    setWaitlists(updated);
  };

  const removeFromWaitlist = (wl) => {
    const updated = waitlists.filter(w => !(w.courseId === wl.courseId && w.studentId === wl.studentId));
    setWaitlists(updated);
  };

  // Metrics derived directly in render

  return (
    <div className="enroll-container">
      <h1 className="enroll-title">Student Enrollment Management</h1>

      {loading && <div>Loading enrollment data...</div>}
      {error && !loading && (
        <div style={{ color: 'red', marginBottom: 12 }}>Error: {error}</div>
      )}

      {!loading && (
        <>
          <div className="metrics">
            <div className="metric">
              <span className="metric-label">Total Students</span>
              <span className="metric-value">{students.length}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Active Enrollments</span>
              <span className="metric-value">{enrollments.length}</span>
            </div>
            <div className="metric">
              <span className="metric-label">Waitlisted Students</span>
              <span className="metric-value">{waitlists.length}</span>
            </div>
          </div>

          <div className="filters">
            <select value={view} onChange={(e) => setView(e.target.value)}>
              <option value="students">Student</option>
              <option value="waitlist">Waitlist</option>
              <option value="analytics">Analytics</option>
            </select>

            {view === 'students' && (
              <>
                <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
                  <option>All Classes</option>
                  {config.CLASS_OPTIONS?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <input
                  className="search-input"
                  placeholder="Search Student..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </>
            )}

            {/* Courses filter removed */}
          </div>

          {view === 'students' && (
            <div>
              <h2>Student Management</h2>
              <div className="card-grid">
                {students
                  .filter(s => (
                    classFilter === 'All Classes' || s.year === classFilter || s.class === classFilter
                  ))
                  .filter(s => (
                    search ? (s.name?.toLowerCase().includes(search.toLowerCase()) || s.studentId?.toLowerCase().includes(search.toLowerCase())) : true
                  ))
                  .map((s, idx) => (
                    <div key={s.id || s.studentId || s.email || idx} className="course-card">
                      <div className="card-header">
                        <strong>{s.name}</strong>
                        <span className="status-badge active">STUDENT</span>
                      </div>
                      <div className="card-sub">ID: {s.studentId} • {s.department} • {s.year || '-'}</div>
                      <div className="card-sub">{s.email}</div>
                    </div>
                  ))}
                {students.length === 0 && (
                  <div style={{ color: '#666' }}>No students found.</div>
                )}
              </div>
            </div>
          )}

          {view === 'waitlist' && (
            <div>
              <h2>Waitlist Management</h2>
              <div className="card-grid">
                {waitlists.length === 0 && (
                  <div style={{ color: '#666' }}>No waitlisted applications yet.</div>
                )}
                {waitlists.map((wl) => (
                  <div key={wl.id} className="course-card">
                    <div className="card-header">
                      <strong>{wl.applicantName}</strong>
                      <span className={`status-badge ${wl.processed ? 'approved' : 'submitted'}`}>{(wl.status || 'submitted').toUpperCase()}</span>
                    </div>
                    <div className="card-sub">Application #{wl.applicationNumber}</div>
                    <div className="card-sub">Class: {wl.applyingClass}</div>
                    {wl.receivedAt && <div className="card-sub">Received: {new Date(wl.receivedAt).toLocaleString()}</div>}
                    <div className="card-actions">
                      <button onClick={() => processWaitlist(wl)}>Process</button>
                      <button onClick={() => removeFromWaitlist(wl)} className="secondary">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {view === 'analytics' && (
            <div>
              <h2>Enrollment Analytics</h2>
              <div style={{ marginTop: 12, marginBottom: 8, fontWeight: 600 }}>Enrollment by Classes</div>
              {(() => {
                const counts = students.reduce((acc, s) => {
                  const key = s.year || s.class || 'Unknown';
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {});
                const entries = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
                const max = Math.max(1, ...entries.map(([_, c]) => c));
                return (
                  <div>
                    {entries.length === 0 && (
                      <div style={{ color: '#666' }}>No enrollment data available.</div>
                    )}
                    {entries.map(([cls, count]) => (
                      <div key={cls} style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0' }}>
                        <div style={{ width: 120 }}>{cls}</div>
                        <div style={{ flex: 1, background: '#eef2ff', height: 12, position: 'relative' }}>
                          <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: '#3b82f6' }}></div>
                        </div>
                        <div style={{ width: 36, textAlign: 'right' }}>{count}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Courses list removed */}

          {/* Enrollment/Waitlist modals removed with courses view */}
        </>
      )}
    </div>
  );
};

export default StudentEnrollment;