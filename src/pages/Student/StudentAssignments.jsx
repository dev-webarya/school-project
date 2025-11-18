import React, { useEffect, useState } from 'react';
import { FaFileAlt } from 'react-icons/fa';
import { studentAPI } from '../../services/api.js';
import { useNotification } from '../../hooks/useNotification';
import { useLoading } from '../../hooks/useLoading';

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submissionForms, setSubmissionForms] = useState({});

  const { showError, showSuccess } = useNotification();
  const { startLoading, stopLoading } = useLoading();

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        startLoading('Loading assignments...');
        const res = await studentAPI.getAssignments();
        const data = res.data?.data ?? [];
        setAssignments(Array.isArray(data) ? data : []);
        setError('');
      } catch (err) {
        const msg = err.userMessage || err.message || 'Failed to load assignments';
        setError(msg);
        setAssignments([]);
        showError(msg);
      } finally {
        setLoading(false);
        stopLoading();
      }
    };
    loadAssignments();
  }, []);

  const toggleSubmission = (id) => {
    setSubmissionForms(prev => ({ ...prev, [id]: prev[id] ? null : { content: '' } }));
  };

  const handleSubmissionChange = (id, e) => {
    const { name, value } = e.target;
    setSubmissionForms(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [name]: value } }));
  };

  const submitAssignment = async (id) => {
    try {
      startLoading('Submitting assignment...');
      const payload = { content: (submissionForms[id]?.content || '').trim() };
      const res = await studentAPI.submitAssignment(id, payload);
      if (res.data?.success) {
        setSubmissionForms(prev => ({ ...prev, [id]: null }));
        showSuccess('Assignment submitted');
      } else {
        throw new Error(res.data?.message || 'Failed to submit assignment');
      }
    } catch (err) {
      showError(err.userMessage || err.message || 'Failed to submit assignment');
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Assignments</h1>
      <p>View upcoming and submitted assignments.</p>

      {loading && <p style={{ color: '#666' }}>Loading...</p>}
      {error && !loading && <p style={{ color: 'red' }}>Error: {error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {assignments.map(a => (
          <div key={a._id} style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <FaFileAlt style={{ color: '#1a237e' }} />
              <h3 style={{ margin: 0 }}>{a.title}</h3>
            </div>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Subject:</strong> {a.subject}</p>
            <p style={{ margin: '6px 0', color: '#555' }}><strong>Due Date:</strong> {new Date(a.dueDate).toLocaleDateString()}</p>
            {a.course && (
              <p style={{ margin: '6px 0', color: '#555' }}><strong>Course:</strong> {a.course.courseName} (Class {a.course.class}{a.course.section ? '-' + a.course.section : ''})</p>
            )}
            {a.description && (
              <p style={{ margin: '6px 0', color: '#555' }}>{a.description}</p>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => toggleSubmission(a._id)} style={{ background: '#1a237e', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Submit</button>
            </div>
            {submissionForms[a._id] && (
              <div style={{ marginTop: 10, background: '#f9f9f9', padding: 12, borderRadius: 6 }}>
                <textarea name="content" value={submissionForms[a._id].content || ''} onChange={(e) => handleSubmissionChange(a._id, e)} placeholder="Your answer..." rows={4} style={{ width: '100%', padding: 8 }} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button onClick={() => submitAssignment(a._id)} style={{ background: '#2e7d32', color: 'white', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Submit</button>
                  <button onClick={() => toggleSubmission(a._id)} style={{ background: '#e0e0e0', border: 'none', padding: '8px 12px', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}