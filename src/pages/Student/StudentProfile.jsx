import React, { useEffect, useMemo, useState } from 'react';
import { FaUserCheck } from 'react-icons/fa';
import { studentAPI } from '../../services/api.js';

export default function StudentProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const normalizeProfile = (raw) => {
    if (!raw || typeof raw !== 'object') return null;
    return {
      name: raw.user?.name || raw.name || 'Unknown',
      class: raw.class || '-',
      rollNo: raw.rollNumber || raw.rollNo || raw.admissionNumber || '-',
      email: raw.user?.email || raw.email || '-',
      phone: raw.user?.phone || raw.phone || '-',
      guardian: raw.guardian?.name || raw.guardianName || '-',
    };
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await studentAPI.getProfile();
        const data = res.data?.data ?? res.data ?? null;
        const normalized = normalizeProfile(data);
        if (mounted) setProfile(normalized);
      } catch (err) {
        const msg = err.userMessage || err.message || 'Failed to load profile';
        if (mounted) {
          setError(msg);
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const emptyState = useMemo(() => (
    <div style={{ background: '#fff', padding: 20, borderRadius: 8, boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: 0, color: '#666' }}>Profile data is not available.</p>
    </div>
  ), []);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Profile</h1>
      <p>Your student information and contact details.</p>

      {loading && (
        <p style={{ color: '#666' }}>Loading profile...</p>
      )}
      {error && !loading && (
        <p style={{ color: 'red' }}>Error: {error}</p>
      )}

      {!loading && !error && (!profile ? (
        emptyState
      ) : (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FaUserCheck style={{ color: '#1a237e', fontSize: '1.5rem' }} />
            <h2 style={{ margin: 0 }}>{profile.name}</h2>
          </div>
          <p><strong>Class:</strong> {profile.class}</p>
          <p><strong>Roll No:</strong> {profile.rollNo}</p>
          <p><strong>Email:</strong> {profile.email}</p>
          <p><strong>Phone:</strong> {profile.phone}</p>
          <p><strong>Guardian:</strong> {profile.guardian}</p>
        </div>
      ))}
    </div>
  );
}