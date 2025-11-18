import React, { useEffect, useMemo, useState } from 'react';
import { FaBook, FaChalkboardTeacher, FaClock } from 'react-icons/fa';
import { studentAPI, generalAPI } from '../../services/api.js';
import config from '../../config/config.js';

export default function StudentCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const formatSchedule = (schedule) => {
    if (!schedule) return 'To be announced';
    const days = Array.isArray(schedule?.days) ? schedule.days.join(', ') : '';
    const start = schedule?.startTime || '';
    const end = schedule?.endTime || '';
    if (days && start && end) return `${days} - ${start} to ${end}`;
    if (days && start) return `${days} - ${start}`;
    return typeof schedule === 'string' && schedule.length ? schedule : 'To be announced';
  };

  const normalizeCourse = (c) => {
    const enrolledCount = Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : (c.enrolled || 0);
    const capacity = c.maxStudents || c.capacity || 0;
    const progress = capacity > 0 ? Math.min(100, Math.round((enrolledCount / capacity) * 100)) : 0;
    const facultyName = c.faculty ? `${c.faculty.firstName ?? ''} ${c.faculty.lastName ?? ''}`.trim() : (c.instructor || 'TBA');

    return {
      id: c._id || c.id || `${Date.now()}-${Math.random()}`,
      name: c.courseName || c.name || 'Untitled',
      teacher: facultyName || 'TBA',
      schedule: formatSchedule(c.schedule),
      progress,
      description: c.description || 'Course details will be available soon.',
    };
  };

  useEffect(() => {
    let mounted = true;
    const loadCourses = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await studentAPI.getClasses({ retry: true });
        const data = res.data?.data ?? res.data ?? [];
        const list = Array.isArray(data) ? data : (Array.isArray(data?.classes) ? data.classes : []);
        const normalized = list.map((cl) => ({
          id: cl._id || cl.id || `${Date.now()}-${Math.random()}`,
          name: cl.courseName || cl.name || `${cl.class || ''}${cl.section ? '-' + cl.section : ''}` || 'Untitled Course',
          subject: cl.subject || 'Subject',
          courseCode: cl.courseCode || '',
          class: cl.class || '',
          section: cl.section || '',
          teacher: cl.faculty ? `${cl.faculty.firstName ?? ''} ${cl.faculty.lastName ?? ''}`.trim() : (cl.teacher || 'TBA'),
          schedule: formatSchedule(cl.schedule),
          progress: 0,
          description: cl.description || 'Course details will be available soon.',
        }));
        if (mounted) setCourses(normalized);
      } catch (err) {
        // Fallback to public subjects when authenticated endpoint fails
        try {
          const pub = await generalAPI.getPublicSubjects();
          const pubData = pub.data?.data ?? pub.data ?? [];
          const normalized = (Array.isArray(pubData) ? pubData : []).map((s) => ({
            id: s._id || s.id || `${Date.now()}-${Math.random()}`,
            name: s.name || s.title || 'Subject',
            teacher: s.department ? `${s.department} Department` : 'TBA',
            schedule: s.duration || 'To be announced',
            progress: 0,
            description: s.description || 'Subject details will be available soon.',
          }));
          if (mounted) {
            setCourses(normalized);
            setError('');
          }
        } catch (fallbackErr) {
          const msg = err.userMessage || err.message || 'Failed to load courses';
          if (mounted) {
            setError(msg);
            setCourses([]);
          }
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadCourses();
    return () => { mounted = false; };
  }, []);

  const openCourse = (course) => setSelectedCourse(course);
  const closeCourse = () => setSelectedCourse(null);

  const emptyState = useMemo(() => (
    <div style={{ background: '#fff', padding: 20, borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: 0, color: '#666' }}>No courses found.</p>
    </div>
  ), []);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>My Courses</h1>
      <p>View all your enrolled courses and track your progress.</p>

      {loading && (
        <p style={{ color: '#666' }}>Loading courses...</p>
      )}
      {error && !loading && (
        <p style={{ color: 'red' }}>Error: {error}</p>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '25px',
        margin: '30px 0'
      }}>
        {(courses.length === 0 && !loading) ? emptyState : courses.map(course => (
          <div key={course.id} style={{
            background: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ 
              height: '8px', 
              background: `linear-gradient(to right, #1a237e ${course.progress}%, #e0e0e0 ${course.progress}%)` 
            }}></div>
            <div style={{ padding: '20px' }}>
              <h2 style={{ margin: '0 0 10px 0', color: '#1a237e' }}>{course.name}</h2>
              <p style={{ margin: '0 0 15px 0', color: '#666', fontSize: '0.9rem' }}>
                {course.description}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FaChalkboardTeacher style={{ color: '#1a237e' }} />
                <span>{course.teacher}</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px' }}>
                <FaClock style={{ color: '#1a237e' }} />
                <span>{course.schedule}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontWeight: '500' }}>Progress: </span>
                  <span>{course.progress}%</span>
                </div>
                <button onClick={() => openCourse(course)} style={{
                  background: '#1a237e',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}>
                  <FaBook /> View Course
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedCourse && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'white', borderRadius: 12, padding: 24, width: 'min(640px, 92vw)', boxShadow: '0 6px 24px rgba(0,0,0,0.15)', maxHeight: '85vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, color: '#1a237e' }}>{selectedCourse.subject} — {selectedCourse.name}</h2>
            <p style={{ color: '#555' }}>{selectedCourse.description}</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginTop: 12 }}>
              <div><strong>Course Code:</strong> {selectedCourse.courseCode || '—'}</div>
              <div><strong>Class:</strong> {selectedCourse.class}{selectedCourse.section ? '-' + selectedCourse.section : ''}</div>
              <div><strong>Teacher:</strong> {selectedCourse.teacher}</div>
              <div><strong>Schedule:</strong> {selectedCourse.schedule}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button onClick={closeCourse} style={{ background: '#e0e0e0', color: '#333', border: 'none', padding: '8px 14px', borderRadius: 6, cursor: 'pointer' }}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}