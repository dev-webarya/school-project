import React, { useEffect, useState } from 'react';
import { FaTasks, FaPlus } from 'react-icons/fa';
import { facultyAPI } from '../../services/api.js';
import { useNotification } from '../../hooks/useNotification';
import { useLoading } from '../../hooks/useLoading';

export default function FacultyAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ title: '', subject: '', class: '', section: '', courseId: '', dueDate: '', description: '' });

  const { showSuccess, showError } = useNotification();
  const { startLoading, stopLoading } = useLoading();

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const res = await facultyAPI.getAssignments();
      const data = res.data?.data ?? [];
      setAssignments(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      const msg = err.userMessage || err.message || 'Failed to load assignments';
      setError(msg);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAssignments(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const createAssignment = async (e) => {
    e.preventDefault();
    try {
      startLoading('Creating assignment...');
      const payload = {
        title: form.title.trim(),
        subject: form.subject.trim(),
        class: form.class.trim(),
        section: form.section.trim(),
        dueDate: form.dueDate,
        description: form.description.trim()
      };
      if (form.courseId) payload.courseId = form.courseId.trim();

      const res = await facultyAPI.createAssignment(payload);
      if (res.data?.success) {
        showSuccess('Assignment created');
        setAssignments(prev => [res.data.data, ...prev]);
        setForm({ title: '', subject: '', class: '', section: '', courseId: '', dueDate: '', description: '' });
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
      <h1>Assignments</h1>
      <p>Create and manage assignments for your classes.</p>

      <form onSubmit={createAssignment} style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: 20 }}>
        <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}><FaPlus /> Create Assignment</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required style={{ padding: 8 }} />
          <input name="subject" value={form.subject} onChange={handleChange} placeholder="Subject" required style={{ padding: 8 }} />
          <input name="class" value={form.class} onChange={handleChange} placeholder="Class (e.g., 10)" required style={{ padding: 8 }} />
          <input name="section" value={form.section} onChange={handleChange} placeholder="Section (e.g., A)" style={{ padding: 8 }} />
          <input name="courseId" value={form.courseId} onChange={handleChange} placeholder="Course ID (optional)" style={{ padding: 8 }} />
          <input name="dueDate" type="date" value={form.dueDate} onChange={handleChange} required style={{ padding: 8 }} />
          <input name="description" value={form.description} onChange={handleChange} placeholder="Description" style={{ padding: 8 }} />
        </div>
        <button type="submit" style={{ marginTop: 12, background: '#1a237e', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Create</button>
      </form>

      {loading && <p style={{ color: '#666' }}>Loading assignments...</p>}
      {error && !loading && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
        {assignments.map(a => (
          <div key={a._id} style={{ background: 'white', borderRadius: 8, padding: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <FaTasks style={{ color: '#1a237e' }} />
              <h3 style={{ margin: 0 }}>{a.title}</h3>
            </div>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Subject:</strong> {a.subject}</p>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Class:</strong> {a.class}{a.section ? '-' + a.section : ''}</p>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Due Date:</strong> {new Date(a.dueDate).toLocaleDateString()}</p>
            {a.course && (
              <p style={{ margin: '6px 0', color: '#555' }}><strong>Course:</strong> {a.course.courseName} ({a.course.subject})</p>
            )}
            {a.description && <p style={{ margin: '6px 0', color: '#555' }}>{a.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}