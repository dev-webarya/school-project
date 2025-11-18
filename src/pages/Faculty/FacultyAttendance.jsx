import React, { useEffect, useState } from 'react';
import { FaCalendarAlt } from 'react-icons/fa';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../hooks/useNotification.js';
import { facultyAPI } from '../../services/api.js';
import './FacultyAttendance.css';
import jsPDF from 'jspdf';

export default function FacultyAttendance() {
  const today = new Date().toISOString().slice(0, 10);
  const [searchParams, setSearchParams] = useSearchParams();
  const { showSuccess, showError } = useNotification();

  // Minimal state for simple marking
  const [date, setDate] = useState(today);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [studentIdInput, setStudentIdInput] = useState('');
  const [status, setStatus] = useState('Present'); // Present | Absent
  const [timeIn, setTimeIn] = useState(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [records, setRecords] = useState([]);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [courseId, setCourseId] = useState('');

  useEffect(() => {
    // Initialize from URL params
    const urlDate = searchParams.get('date');
    const urlCourse = searchParams.get('course');
    if (urlDate) setDate(urlDate);
    if (urlCourse) setCourseId(urlCourse);
    const fetchClasses = async () => {
      try {
        setLoadError(null);
        const classesRes = await facultyAPI.getClasses();
        const classData = Array.isArray(classesRes.data?.data) ? classesRes.data.data : [];
        setClasses(classData);
        // Auto-select first class if none chosen yet
        if (!selectedClass && classData.length > 0) {
          setSelectedClass(classData[0].class || classData[0].className || '');
        }
      } catch (err) {
        console.error('Failed to load classes:', err);
        setLoadError(err.userMessage || 'Failed to load classes');
      }
    };
    fetchClasses();
  }, []);

  // Derive courseId when class changes
  useEffect(() => {
    if (!selectedClass || classes.length === 0) return;
    const match = classes.find((c) => c.class === selectedClass);
    // Course documents use _id (or id) — not courseId
    const cid = match?._id || match?.id || match?.courseId;
    if (cid) setCourseId(cid);
  }, [selectedClass, classes]);

  // Persist date and course in URL params for shareable views
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (date) next.set('date', date); else next.delete('date');
    if (courseId) next.set('course', courseId); else next.delete('course');
    setSearchParams(next, { replace: true });
  }, [date, courseId]);
  // Load records whenever date or course changes
  useEffect(() => {
    if (!courseId || !date) return;
    loadAttendanceRecords();
  }, [courseId, date]);

  const onSubmitAttendance = async () => {
    try {
      setSubmitting(true);
      setSubmitMessage(null);
      setLoadError(null);

      if (!courseId) {
        setSubmitMessage('Please select a class to auto-fill course.');
        showError('Please select a class');
        return;
      }

      const trimmedId = studentIdInput.trim();
      if (!trimmedId) {
        showError('Please enter a Student ID');
        return;
      }

      const payload = {
        course: courseId,
        date,
        remarks,
        records: [
          {
            student: trimmedId,
            class: selectedClass || undefined,
            course: courseId,
            date,
            status,
            timeIn: (status === 'Present' || status === 'Late') ? timeIn : undefined,
            session: '1',
            remarks,
          },
        ],
      };

      const res = await facultyAPI.markAttendance(payload);
      const data = res.data;
      if (data?.success) {
        setSubmitMessage(`Attendance saved. Created: ${data.data?.created ?? 0}, Duplicates: ${data.data?.duplicates ?? 0}`);
        showSuccess('Attendance submitted successfully');
      } else {
        const msg = data?.message + (data?.error ? `: ${data.error}` : '') || 'Failed to save attendance';
        setSubmitMessage(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err.userMessage || err.message || 'Failed to connect to server';
      setSubmitMessage(msg);
      showError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const loadAttendanceRecords = async () => {
    try {
      setLoadingRecords(true);
      setRecords([]);
      setLoadError(null);
      const params = { course: courseId };
      if (date) {
        params.date_from = date;
        params.date_to = date;
      }
      const res = await facultyAPI.getAttendance(params);
      const data = res.data;
      if (data?.success) {
        setRecords(data.data || []);
        showSuccess(`Loaded ${data.data?.length ?? 0} record(s)`);
      } else {
        const msg = data?.message || 'Failed to fetch attendance records';
        setLoadError(msg);
        showError(msg);
      }
    } catch (err) {
      const msg = err.userMessage || err.message || 'Failed to connect to server';
      setLoadError(msg);
      showError(msg);
    } finally {
      setLoadingRecords(false);
    }
  };

  const exportRecordsToCSV = () => {
    try {
      if (!records || records.length === 0) {
        showError('No records to export');
        return;
      }
      const headers = ['Date', 'Student', 'Course', 'Status', 'Remarks'];
      const rows = records.map(r => [
        new Date(r.date).toLocaleDateString(),
        (r.student?.name || r.student?.studentId || r.student || '').toString().replace(/\n/g, ' '),
        (r.course?.courseCode || r.course || '').toString().replace(/\n/g, ' '),
        (r.status || '').toString(),
        (r.remarks || '-').toString().replace(/\n/g, ' '),
      ]);
      const escape = (val) => {
        const s = String(val ?? '');
        if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
        return s;
      };
      const csv = [headers.join(','), ...rows.map(row => row.map(escape).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const courseSlug = (courseId || 'course').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      a.download = `attendance_${courseSlug}_${date}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Exported records to CSV');
    } catch (err) {
      console.error('CSV export error', err);
      showError('Failed to export CSV');
    }
  };

  const exportRecordsToPDF = () => {
    try {
      if (!records || records.length === 0) {
        showError('No records to export');
        return;
      }

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = margin;

      doc.setFontSize(16);
      doc.text('Attendance Records', pageWidth / 2, y, { align: 'center' });
      y += 8;
      doc.setFontSize(11);
      doc.text(`Course: ${courseId || '-'}`, margin, y);
      doc.text(`Date: ${date || '-'}`, pageWidth - margin, y, { align: 'right' });
      y += 8;

      doc.setFontSize(12);
      doc.text('Date', margin, y);
      doc.text('Student', margin + 40, y);
      doc.text('Course', margin + 110, y);
      doc.text('Status', pageWidth - 50, y);
      y += 6;
      doc.setLineWidth(0.2);
      doc.line(margin, y, pageWidth - margin, y);
      y += 4;

      doc.setFontSize(10);
      records.forEach((r) => {
        if (y > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          y = margin;
        }
        const dateStr = new Date(r.date).toLocaleDateString();
        const studentStr = String(r.student?.name || r.student?.studentId || r.student || '');
        const courseStr = String(r.course?.courseCode || r.course || '');
        const statusStr = String(r.status || '');

        doc.text(dateStr, margin, y);
        doc.text(doc.splitTextToSize(studentStr, 65), margin + 40, y);
        doc.text(doc.splitTextToSize(courseStr, 45), margin + 110, y);
        doc.text(statusStr, pageWidth - 50, y);
        y += 6;
      });

      const courseSlug = (courseId || 'course').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`attendance_${courseSlug}_${date}.pdf`);
      showSuccess('Exported records to PDF');
    } catch (err) {
      console.error('PDF export error', err);
      showError('Failed to export PDF');
    }
  };

  return (
    <div className="attendance-page">
      <div className="attendance-header">
        <div>
          <h1>Faculty Attendance</h1>
          <p>Mark attendance by Class and Student ID.</p>
        </div>
      </div>

      <div className="attendance-toolbar">
        <div className="field">
          <label>Class</label>
          <select value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}>
            <option value="">Select class</option>
            <option value="NS">NS</option>
            <option value="LKG">LKG</option>
            <option value="UKG">UKG</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={`grade-${n}`} value={String(n)}>{n}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Date</label>
          <div className="date-input">
            <FaCalendarAlt />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        <div className="field grow">
          <label>Student ID</label>
          <input
            type="text"
            placeholder="Enter Student ID"
            value={studentIdInput}
            onChange={(e) => setStudentIdInput(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
          </select>
        </div>

        {status === 'Present' && (
          <div className="field">
            <label>Time In</label>
            <input type="time" value={timeIn} onChange={(e) => setTimeIn(e.target.value)} />
          </div>
        )}

        <div className="field grow">
          <label>Remarks</label>
          <input type="text" placeholder="Optional remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
        </div>

        <div className="actions">
          <button className="btn primary" onClick={onSubmitAttendance} disabled={submitting || !selectedClass || !studentIdInput.trim()}>
            {submitting ? 'Submitting…' : 'Mark Attendance'}
          </button>
        </div>
      </div>

      {submitMessage && (
        <div className={`inline-message ${submitMessage.includes('Failed') ? 'error' : 'info'}`}>{submitMessage}</div>
      )}

      {/* Recent Records (optional) */}
      <div className="records">
        <h2>Records for {date}</h2>
        {!loadingRecords && records.length === 0 && <p className="muted">No records found for selected date.</p>}
        {loadError && <p className="error">Error: {loadError}</p>}
        {records.length > 0 && (
          <div className="table-wrapper">
            <table className="attendance-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Class</th>
                  <th>Status</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r._id}>
                    <td>{r.student?.name || r.student?.studentId || '-'}</td>
                    <td>{r.course?.class || '-'}</td>
                    <td className={r.status === 'Present' ? 'status-present' : 'status-absent'}>{r.status}</td>
                    <td>{r.remarks || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}