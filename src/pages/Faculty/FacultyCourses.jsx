import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChalkboard, FaClock, FaUserGraduate, FaPlus } from 'react-icons/fa';
import { facultyAPI } from '../../services/api.js';
import { useNotification } from '../../hooks/useNotification';
import { useLoading } from '../../hooks/useLoading';

export default function FacultyCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    courseName: '',
    subject: '',
    class: '',
    section: '',
    days: '',
    startTime: '',
    endTime: '',
    description: ''
  });
  const [assignmentForms, setAssignmentForms] = useState({});

  const { showSuccess, showError } = useNotification();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setLoading(true);
        const res = await facultyAPI.getClasses();
        const data = res.data;
        if (data?.success && Array.isArray(data.data)) {
          const normalized = data.data.map(c => ({
            id: c._id || c.id,
            title: `${c.subject || ''}`.trim() && `${c.courseName || ''}`.trim()
              ? `${c.subject} - ${c.courseName}`
              : (c.courseName || c.subject || 'Untitled Course'),
            // Display-friendly class label
            class: `Class ${c.class}${c.section ? '-' + c.section : ''}`,
            // Raw values needed for API payloads
            subject: c.subject || '',
            classRaw: c.class || '',
            section: c.section || '',
            time: Array.isArray(c.schedule?.days) || c.schedule?.startTime || c.schedule?.endTime
              ? `${(Array.isArray(c.schedule?.days) ? c.schedule.days.join(', ') : '')} ${c.schedule?.startTime || ''}${c.schedule?.endTime ? ' - ' + c.schedule.endTime : ''}`.trim()
              : 'To be announced',
            students: Array.isArray(c.enrolledStudents) ? c.enrolledStudents.length : 0,
            description: c.description || ''
          }));
          if (mounted) setCourses(normalized);
          setError(null);
        } else {
          setError(data?.message || 'Failed to load courses');
          setCourses([]);
        }
      } catch (err) {
        const msg = err.userMessage || err.message || 'Failed to connect to server';
        setError(msg);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const createCourse = async (e) => {
    e.preventDefault();
    try {
      startLoading('Creating course...');
      const payload = {
        courseName: form.courseName.trim(),
        subject: form.subject.trim(),
        class: form.class.trim(),
        section: form.section.trim(),
        schedule: {
          days: form.days.split(',').map(d => d.trim()).filter(Boolean),
          startTime: form.startTime.trim(),
          endTime: form.endTime.trim()
        },
        description: form.description.trim()
      };
      const res = await facultyAPI.createCourse(payload);
      if (res.data?.success) {
        showSuccess('Course created');
        // Reload list
        setCourses(prev => [{
          id: res.data.data._id,
          title: `${res.data.data.subject} - ${res.data.data.courseName}`,
          class: `Class ${res.data.data.class}${res.data.data.section ? '-' + res.data.data.section : ''}`,
          time: (Array.isArray(res.data.data.schedule?.days) ? res.data.data.schedule.days.join(', ') : '') +
            (res.data.data.schedule?.startTime ? ` ${res.data.data.schedule.startTime}` : '') +
            (res.data.data.schedule?.endTime ? ` - ${res.data.data.schedule.endTime}` : ''),
          students: 0,
          description: res.data.data.description || ''
        }, ...prev]);
        setForm({ courseName: '', subject: '', class: '', section: '', days: '', startTime: '', endTime: '', description: '' });
      } else {
        throw new Error(res.data?.message || 'Failed to create course');
      }
    } catch (err) {
      showError(err.userMessage || err.message || 'Failed to create course');
    } finally {
      stopLoading();
    }
  };

  const toggleAssignmentForm = (courseId) => {
    setAssignmentForms(prev => ({ ...prev, [courseId]: prev[courseId] ? null : { title: '', dueDate: '', description: '' } }));
  };

  const handleAssignmentChange = (courseId, e) => {
    const { name, value } = e.target;
    setAssignmentForms(prev => ({ ...prev, [courseId]: { ...(prev[courseId] || {}), [name]: value } }));
  };

  const deleteCourse = async (course) => {
    try {
      const confirmed = window.confirm(`Delete course "${course.title}"? This cannot be undone.`);
      if (!confirmed) return;
      startLoading('Deleting course...');
      const res = await facultyAPI.deleteCourse(course.id);
      if (res.data?.success) {
        setCourses(prev => prev.filter(c => c.id !== course.id));
        showSuccess('Course deleted');
      } else {
        throw new Error(res.data?.message || 'Failed to delete course');
      }
    } catch (err) {
      showError(err.userMessage || err.message || 'Failed to delete course');
    } finally {
      stopLoading();
    }
  };

  const createAssignmentForCourse = async (course) => {
    try {
      startLoading('Creating assignment...');
      const af = assignmentForms[course.id] || {};
      const payload = {
        title: (af.title || '').trim(),
        subject: course.subject || '',
        class: (course.classRaw || '').toString(),
        section: course.section || '',
        courseId: course.id,
        dueDate: af.dueDate,
        description: (af.description || '').trim()
      };
      if (!payload.title || !payload.subject || !payload.class || !payload.dueDate) {
        showError('Title, Subject, Class and Due Date are required');
        return;
      }
      const res = await facultyAPI.createAssignment(payload);
      if (res.data?.success) {
        showSuccess('Assignment created');
        setAssignmentForms(prev => ({ ...prev, [course.id]: null }));
      } else {
        throw new Error(res.data?.message || 'Failed to create assignment');
      }
    } catch (err) {
      showError(err.userMessage || err.message || 'Failed to create assignment');
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>My Courses</h1>
      <p>Courses you are currently teaching.</p>

      {/* Create Course */}
      <form onSubmit={createCourse} style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FaPlus /> Create Course</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <input name="courseName" value={form.courseName} onChange={handleChange} placeholder="Course Name" required style={{ padding: 8 }} />
          <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" required style={{ padding: 8 }} />
          <input name="class" value={form.class} onChange={handleChange} placeholder="Class (e.g., 10)" required style={{ padding: 8 }} />
          <input name="section" value={form.section} onChange={handleChange} placeholder="Section (e.g., A)" style={{ padding: 8 }} />
          <input name="days" value={form.days} onChange={handleChange} placeholder="Days (Mon, Tue)" style={{ padding: 8 }} />
          <input name="startTime" value={form.startTime} onChange={handleChange} placeholder="Start (HH:mm)" style={{ padding: 8 }} />
          <input name="endTime" value={form.endTime} onChange={handleChange} placeholder="End (HH:mm)" style={{ padding: 8 }} />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={{ padding: 8 }} />
        </div>
        <button type="submit" style={{ marginTop: 12, background: '#1a237e', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Create</button>
      </form>

      {loading && (
        <p style={{ color: '#666' }}>Loading courses...</p>
      )}
      {error && !loading && (
        <p style={{ color: 'red' }}>Error: {error}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {(courses.length === 0 && !loading) && (
          <p style={{ color: '#888' }}>No courses available. Please ensure backend provides faculty classes.</p>
        )}
        {courses.length > 0 && courses.map(course => (
          <div key={course.id} style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaChalkboard style={{ color: '#1a237e' }} />
              <h3 style={{ margin: 0 }}>{course.title}</h3>
            </div>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Class:</strong> {course.class}</p>
            <p style={{ margin: '6px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaClock /> {course.time}
            </p>
            <p style={{ margin: '6px 0', color: '#555', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FaUserGraduate /> Students: {course.students}
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => navigate(`/faculty/courses/${course.id}`)} style={{ background: '#1a237e', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                View Class Details
              </button>
              <button onClick={() => deleteCourse(course)} style={{ background: '#c62828', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer' }}>
                Delete Course
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <button onClick={() => toggleAssignmentForm(course.id)} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '6px 10px', borderRadius: 4, cursor: 'pointer' }}>
                <FaPlus /> Create Assignment
              </button>
            </div>
            {assignmentForms[course.id] && (
              <div style={{ marginTop: 12, background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                  <input name="title" value={assignmentForms[course.id].title || ''} onChange={(e) => handleAssignmentChange(course.id, e)} placeholder="Title" required style={{ padding: 8 }} />
                  <input name="dueDate" type="date" value={assignmentForms[course.id].dueDate || ''} onChange={(e) => handleAssignmentChange(course.id, e)} required style={{ padding: 8 }} />
                  <input name="description" value={assignmentForms[course.id].description || ''} onChange={(e) => handleAssignmentChange(course.id, e)} placeholder="Description" style={{ padding: 8 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button onClick={() => createAssignmentForCourse(course)} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                  <button onClick={() => toggleAssignmentForm(course.id)} style={{ background: '#e0e0e0', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}