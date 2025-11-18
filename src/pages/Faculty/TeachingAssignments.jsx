import React, { useEffect, useState } from 'react';
import { FaClipboardList } from 'react-icons/fa';
import { facultyAPI } from '../../services/api.js';

export default function TeachingAssignments() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState('1');
  const [academicYear, setAcademicYear] = useState(getDefaultAcademicYear());
  const [status, setStatus] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async (params = {}) => {
    try {
      setLoading(true);
      const statusParam = status === 'all' ? undefined : status;
      const res = await facultyAPI.getTeachingAssignments({ params: { session, academicYear, status: statusParam, ...params } });
      const data = res.data?.data ?? [];
      setItems(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      const msg = err.userMessage || err.message || 'Failed to load teaching assignments';
      setError(msg);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = async (e) => {
    const { name, value } = e.target;
    if (name === 'session') setSession(value);
    if (name === 'academicYear') setAcademicYear(value);
    if (name === 'status') setStatus(value);
  };

  useEffect(() => {
    // refetch when filters change
    load();
  }, [session, academicYear, status]);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Teaching Assignments</h1>
      <p>Assignments given by Admin that define your teaching responsibilities.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '12px 0 20px', flexWrap: 'wrap' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#666' }}>Session</span>
          <select name="session" value={session} onChange={handleFilterChange} style={{ padding: '6px 8px' }}>
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#666' }}>Academic Year</span>
          <select name="academicYear" value={academicYear} onChange={handleFilterChange} style={{ padding: '6px 8px' }}>
            {getRecentYears().map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#666' }}>Status</span>
          <select name="status" value={status} onChange={handleFilterChange} style={{ padding: '6px 8px' }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </label>
      </div>

      {loading && <p style={{ color: '#666' }}>Loading teaching assignments...</p>}
      {error && !loading && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {items.map(a => (
          <div key={a._id} style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FaClipboardList style={{ color: '#1a237e' }} />
              <h3 style={{ margin: 0 }}>{formatTitle(a)}</h3>
              {a.completed && (
                <span style={{ marginLeft: 'auto', background: '#27ae60', color: 'white', fontSize: 12, padding: '4px 8px', borderRadius: 999 }}>Completed</span>
              )}
            </div>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Academic Year:</strong> {a.academicYear}</p>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Session:</strong> {a.session}</p>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Type:</strong> {capitalize(a.assignmentType)}</p>
            {a.workload ? (
              <p style={{ margin: '6px 0', color: '#555' }}><strong>Workload:</strong> {a.workload}h</p>
            ) : null}
            {(a.startDate || a.endDate) && (
              <p style={{ margin: '6px 0', color: '#555' }}><strong>Dates:</strong> {formatDateRange(a.startDate, a.endDate)}</p>
            )}
            {a.notes && <p style={{ margin: '6px 0', color: '#555' }}>{a.notes}</p>}
          </div>
        ))}
        {!loading && !items.length && (
          <p style={{ color: '#888' }}>No teaching assignments found for the selected filters.</p>
        )}
      </div>
    </div>
  );
}

function formatTitle(a) {
  const courseName = a.course?.courseName || a.courseId || 'General';
  const className = a.class?.name || a.classId || 'General';
  return `${courseName} • ${className}`;
}

function formatDateRange(start, end) {
  const s = start ? new Date(start).toLocaleDateString() : '—';
  const e = end ? new Date(end).toLocaleDateString() : '—';
  return `${s} → ${e}`;
}

function capitalize(str) {
  if (!str) return '';
  return String(str).charAt(0).toUpperCase() + String(str).slice(1);
}

function getDefaultAcademicYear() {
  const today = new Date();
  const year = today.getMonth() >= 5 ? today.getFullYear() : today.getFullYear() - 1; // academic year starts around June
  return `${year}-${year + 1}`;
}

function getRecentYears() {
  const startYear = new Date().getFullYear() - 1;
  return [
    `${startYear - 1}-${startYear}`,
    `${startYear}-${startYear + 1}`,
    `${startYear + 1}-${startYear + 2}`
  ];
}