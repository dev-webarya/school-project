import React, { useEffect, useState } from 'react';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './AdminGrades.css';

export default function AdminGrades() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    email: '',
    subjectName: '',        // simplified: subject name
    employeeId: '',         // Faculty Employee ID
    assessmentType: 'Assignment',
    maxMarks: 100,
    obtainedMarks: 0,
    academicYear: '',
    session: '1',
    remarks: '',
    isPublished: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [grades, setGrades] = useState([]);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [newSubject, setNewSubject] = useState({ subjectName: '', employeeId: '' });
  const [creatingSubject, setCreatingSubject] = useState(false);
  const [subjectMsg, setSubjectMsg] = useState('');

  const createSubject = async (e) => {
    e.preventDefault();
    setCreatingSubject(true);
    setSubjectMsg('');
    try {
      const payload = {
        subjectName: newSubject.subjectName.trim(),
        employeeId: newSubject.employeeId.trim().toUpperCase(),
      };
      const res = await adminAPI.createSimpleSubject(payload);
      if (res.data?.success) {
        setSubjectMsg(`Created subject: ${res.data.data.courseName} (${res.data.data.courseCode})`);
      } else {
        setSubjectMsg(res.data?.message || 'Failed to create subject.');
      }
    } catch (err) {
      setSubjectMsg(err.response?.data?.message || 'Failed to create subject.');
    } finally {
      setCreatingSubject(false);
    }
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const fetchGrades = async () => {
    try {
      setLoadingGrades(true);
      const params = {};
      if (form.email) params.email = form.email;
      params.limit = 10;
      const res = await adminAPI.getGrades(params);
      setGrades(res.data?.data || []);
    } catch (err) {
      console.error('Fetch grades error:', err);
    } finally {
      setLoadingGrades(false);
    }
  };

  useEffect(() => {
    fetchGrades();
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        email: form.email?.trim(),
        subjectName: form.subjectName?.trim(),
        employeeId: form.employeeId?.trim().toUpperCase(),
        assessmentType: form.assessmentType,
        maxMarks: Number(form.maxMarks),
        obtainedMarks: Number(form.obtainedMarks),
        academicYear: form.academicYear || undefined,
        session: form.session,
        remarks: form.remarks,
        isPublished: !!form.isPublished,
      };
      const res = await adminAPI.createGrade(payload);
      if (res.data?.success) {
        await fetchGrades();
        setForm(prev => ({ ...prev, obtainedMarks: 0, remarks: '' }));
      }
    } catch (err) {
      console.error('Create grade error:', err);
      // Prefer server message if present, else the userMessage
      const serverMsg = err.response?.data?.message;
      setError(serverMsg || err.userMessage || 'Failed to create grade.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-grades-page">
      <section className="section-card">
        <h3 className="section-title">Create Subject</h3>
        {subjectMsg && <div className="info-text">{subjectMsg}</div>}
        <form onSubmit={createSubject} className="form-grid">
          <label>
            <span>Subject Name</span>
            <input
              value={newSubject.subjectName}
              onChange={e => setNewSubject({ ...newSubject, subjectName: e.target.value })}
              placeholder="e.g., Mathematic"
              required
            />
          </label>
          <label>
            <span>Faculty Employee ID</span>
            <input
              value={newSubject.employeeId}
              onChange={e => setNewSubject({ ...newSubject, employeeId: e.target.value })}
              placeholder="e.g., FAC011"
              required
            />
          </label>
          <button type="submit" disabled={creatingSubject} className="btn btn-primary grid-span-2">
            {creatingSubject ? 'Creating...' : 'Create Subject'}
          </button>
        </form>
      </section>

      <h2 className="page-title">Admin: Create Grade (Simple)</h2>
      <p className="muted">Logged in as {user?.email}</p>

      <form onSubmit={onSubmit} className="grade-form">
        {error && <div className="error-text">{error}</div>}
        <div className="form-grid">
          <label>
            <span>Email (student)</span>
            <input type="email" name="email" value={form.email} onChange={onChange} required placeholder="student@example.com" />
          </label>
          <label>
            <span>Subject Name</span>
            <input type="text" name="subjectName" value={form.subjectName} onChange={onChange} required placeholder="e.g. Mathematics I" />
          </label>
          <label>
            <span>Faculty Employee ID</span>
            <input type="text" name="employeeId" value={form.employeeId} onChange={onChange} required placeholder="e.g. FAC003" />
          </label>
          <label>
            <span>Assessment Type</span>
            <select name="assessmentType" value={form.assessmentType} onChange={onChange} required>
              <option value="">Select type</option>
              <option value="Quiz">Quiz</option>
              <option value="Assignment">Assignment</option>
              <option value="Midterm">Midterm</option>
              <option value="Final">Final</option>
              <option value="Project">Project</option>
              <option value="Presentation">Presentation</option>
              <option value="Lab">Lab</option>
              <option value="Homework">Homework</option>
            </select>
          </label>
          <label>
            <span>Session</span>
            <select name="session" value={form.session} onChange={onChange} required>
              <option value="1">Session 1</option>
              <option value="2">Session 2</option>
            </select>
          </label>
          <label>
            <span>Academic Year</span>
            <input type="text" name="academicYear" value={form.academicYear} onChange={onChange} placeholder="2024-25" />
          </label>
          <label>
            <span>Max Marks</span>
            <input type="number" name="maxMarks" value={form.maxMarks} onChange={onChange} min="1" required />
          </label>
          <label>
            <span>Obtained Marks</span>
            <input type="number" name="obtainedMarks" value={form.obtainedMarks} onChange={onChange} min="0" required />
          </label>
          <label className="grid-span-2">
            <span>Remarks</span>
            <input type="text" name="remarks" value={form.remarks} onChange={onChange} placeholder="Optional remarks" />
          </label>
        </div>
        <label className="checkbox-row">
          <input type="checkbox" name="isPublished" checked={form.isPublished} onChange={onChange} />
          <span>Publish grade (visible to student)</span>
        </label>
        <button type="submit" disabled={submitting} className="btn btn-primary">
          {submitting ? 'Submitting...' : 'Create Grade'}
        </button>
      </form>

      <div className="recent-grades">
        <div className="list-header">
          <h3 className="section-title">Recent Grades {form.email ? `for ${form.email}` : ''}</h3>
          <button onClick={fetchGrades} disabled={loadingGrades} className="btn btn-secondary">
            {loadingGrades ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="table-wrap">
          <table className="grades-table">
            <thead>
              <tr>
                <th>Subject</th>
                <th>Assessment</th>
                <th>Marks</th>
                <th>Total</th>
                <th>Grade</th>
                <th>Date</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {grades.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty">No grades found.</td>
                </tr>
              )}
              {grades.map(g => (
                <tr key={g._id}>
                  <td>{g.course?.courseName || g.course?.name || g.course?.subject || '—'}</td>
                  <td>{g.assessmentName}</td>
                  <td>{g.obtainedMarks}</td>
                  <td>{g.maxMarks}</td>
                  <td><span className={`badge ${g.letterGrade ? 'badge-grade' : 'badge-muted'}`}>{g.letterGrade || '—'}</span></td>
                  <td>{g.assessmentDate ? new Date(g.assessmentDate).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge ${g.isPublished ? 'badge-success' : 'badge-neutral'}`}>{g.isPublished ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}