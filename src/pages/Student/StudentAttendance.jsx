import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api.js';

export default function StudentAttendance() {
  const [records, setRecords] = useState([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await studentAPI.getAttendance();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const mapped = list.map(r => ({
          date: r.date,
          class: r.course?.class || '-',
          status: r.status
        }));
        setRecords(mapped);
      } catch (err) {
        console.error('Attendance fetch error:', err);
        setError(err.userMessage || 'Failed to load attendance');
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const filtered = records.filter(r =>
    filter === 'All' ? true : r.status === filter
  );

  return (
    <div className="container" style={{ padding: '100px 0' }}>
      <h1>Attendance Status</h1>
      <p>View your daily attendance status.</p>

      {loading && <div>Loading attendance...</div>}
      {error && !loading && <div style={{ color: 'red' }}>Error: {error}</div>}

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '16px 0' }}>
        <label htmlFor="filter"><strong>Filter:</strong></label>
        <select id="filter" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Present">Present</option>
          <option value="Absent">Absent</option>
        </select>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Date</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Class</th>
              <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row, idx) => (
              <tr key={idx}>
                <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2' }}>{row.date}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2' }}>{row.subject}</td>
                <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2', color: row.status === 'Absent' ? '#c62828' : '#2e7d32' }}>
                  {row.status}
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan="3" style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                  No attendance records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}