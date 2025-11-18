import React, { useEffect, useState } from 'react';
import { FaUserCog } from 'react-icons/fa';
import { facultyAPI } from '../../services/api.js';

export default function FacultyProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await facultyAPI.getProfile();
        if (!mounted) return;
        setProfile(res.data.data);
      } catch (e) {
        setError(e.userMessage || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <h1>Profile</h1>
        <p>Loading your profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container" style={{ padding: '40px 0' }}>
        <h1>Profile</h1>
        <p style={{ color: '#b00020' }}>{error}</p>
      </div>
    );
  }

  const name = profile?.user?.name || 'Unknown';
  const department = profile?.department || 'Not specified';
  const designation = profile?.designation || 'Not specified';
  const email = profile?.user?.email || 'N/A';
  const phone = profile?.user?.phone || 'N/A';
  const employeeId = profile?.employeeId || 'N/A';
  const joiningDate = profile?.joiningDate ? new Date(profile.joiningDate).toLocaleDateString() : 'N/A';

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Profile</h1>
      <p>Your faculty profile and contact information.</p>

      <div style={{ background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaUserCog style={{ color: '#1a237e', fontSize: '1.5rem' }} />
          <h2 style={{ margin: 0 }}>{name}</h2>
        </div>
        <p><strong>Department:</strong> {department}</p>
        <p><strong>Designation:</strong> {designation}</p>
        <p><strong>Email:</strong> {email}</p>
        <p><strong>Phone:</strong> {phone}</p>
        <p><strong>Employee ID:</strong> {employeeId}</p>
        <p><strong>Joining Date:</strong> {joiningDate}</p>
      </div>
    </div>
  );
}