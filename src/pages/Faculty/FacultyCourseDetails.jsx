import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { facultyAPI } from '../../services/api.js';
import { useNotification } from '../../hooks/useNotification';

export default function FacultyCourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await facultyAPI.getClasses();
        const items = res.data?.data || [];
        const found = items.find(c => String(c._id) === String(id));
        if (!found) {
          showError('Course not found');
          navigate('/faculty/courses');
          return;
        }
        if (mounted) setCourse(found);
      } catch (err) {
        showError(err.userMessage || err.message || 'Failed to load course');
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [id, navigate, showError]);

  if (loading) return <div className="container" style={{ padding: '40px 0' }}><p>Loading...</p></div>;
  if (!course) return null;

  const title = `${course.subject || ''}`.trim() && `${course.courseName || ''}`.trim()
    ? `${course.subject} - ${course.courseName}`
    : (course.courseName || course.subject || 'Untitled Course');
  const classLabel = `Class ${course.class}${course.section ? '-' + course.section : ''}`;
  const scheduleLabel = Array.isArray(course.schedule?.days) || course.schedule?.startTime || course.schedule?.endTime
    ? `${(Array.isArray(course.schedule?.days) ? course.schedule.days.join(', ') : '')} ${course.schedule?.startTime || ''}${course.schedule?.endTime ? ' - ' + course.schedule.endTime : ''}`.trim()
    : 'To be announced';

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>{title}</h1>
      <p style={{ color: '#555' }}>{classLabel}</p>
      <p style={{ color: '#555' }}><strong>Schedule:</strong> {scheduleLabel}</p>
      {course.description && <p style={{ color: '#555' }}><strong>Description:</strong> {course.description}</p>}

      <div style={{ marginTop: 20 }}>
        <h3>Enrolled Students ({Array.isArray(course.enrolledStudents) ? course.enrolledStudents.length : 0})</h3>
        {Array.isArray(course.enrolledStudents) && course.enrolledStudents.length > 0 ? (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {course.enrolledStudents.map((s) => (
              <li key={s._id || s.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <span>{s.user ? `${s.user.firstName || ''} ${s.user.lastName || ''}`.trim() : (s.studentId || 'Student')}</span>
                {s.rollNumber && <span style={{ color: '#777' }}> — Roll: {s.rollNumber}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p style={{ color: '#777' }}>No students enrolled yet.</p>
        )}
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
        <Link to="/faculty/courses" style={{ background: '#e0e0e0', padding: '8px 12px', borderRadius: 4 }}>Back to Courses</Link>
      </div>
    </div>
  );
}