import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaBookOpen, FaCalendarCheck, FaChartLine } from 'react-icons/fa';
import { adminAPI } from '../../services/api';
import { useNotification } from '../../components/Notification';
import LoadingSpinner from '../../components/Loading/LoadingSpinner';

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminAPI.getStudentById(id, { retry: true });
        if (!mounted) return;
        setData(res.data.data);
      } catch (err) {
        if (!mounted) return;
        setError(err.userMessage || 'Failed to load student details');
        showError(err.userMessage || 'Failed to load student details');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDetails();
    return () => { mounted = false; };
  }, [id]);

  const profile = data?.profile;
  const personal = profile?.personal || profile;
  const academicRecords = data?.academicRecords || [];
  const attendance = data?.attendance || [];
  const metrics = data?.performanceMetrics;

  return (
    <div className="student-profile-page">
      <div className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}><FaArrowLeft /> Back</button>
        <h1>Student Profile</h1>
      </div>

      {loading && (
        <div className="loading"><LoadingSpinner /> Loading student details…</div>
      )}

      {error && (
        <div className="error">{error}</div>
      )}

      {!loading && !error && profile && (
        <div className="content-grid">
          <section className="card">
            <div className="card-header"><FaUser /> Personal Information</div>
            <div className="card-body">
              <div className="info-grid">
                <div><strong>Name:</strong> {personal?.name || 'N/A'}</div>
                <div><strong>Email:</strong> {personal?.email || 'N/A'}</div>
                <div><strong>Phone:</strong> {personal?.phone || 'N/A'}</div>
                <div><strong>Student ID:</strong> {personal?.studentId || 'N/A'}</div>
                <div><strong>Roll No:</strong> {personal?.rollNumber || 'N/A'}</div>
                <div><strong>Class/Section:</strong> {(personal?.class || '-')}-{personal?.section || '-'}</div>
                <div><strong>Academic Year:</strong> {personal?.academicYear || 'N/A'}</div>
                <div><strong>Admission Date:</strong> {personal?.admissionDate ? new Date(personal.admissionDate).toLocaleDateString() : 'N/A'}</div>
                <div><strong>DOB:</strong> {personal?.dateOfBirth ? new Date(personal.dateOfBirth).toLocaleDateString() : 'N/A'}</div>
                <div><strong>Status:</strong> {personal?.status || 'N/A'}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header"><FaChartLine /> Performance Metrics</div>
            <div className="card-body">
              <div className="metrics-grid">
                <div className="metric">
                  <div className="metric-label">Attendance</div>
                  <div className="metric-value">{metrics?.attendancePercentage ?? 0}%</div>
                </div>
                <div className="metric">
                  <div className="metric-label">GPA Session 1</div>
                  <div className="metric-value">{metrics?.gpa?.session1 ?? metrics?.gpa?.semester1 ?? 0}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">GPA Session 2</div>
                  <div className="metric-value">{metrics?.gpa?.session2 ?? metrics?.gpa?.semester2 ?? 0}</div>
                </div>
                <div className="metric">
                  <div className="metric-label">GPA Overall</div>
                  <div className="metric-value">{metrics?.gpa?.overall ?? 0}</div>
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card-header"><FaBookOpen /> Academic Records</div>
            <div className="card-body">
              {academicRecords.length === 0 ? (
                <p className="muted">No published grades available.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Assessment</th>
                        <th>Type</th>
                        <th>Marks</th>
                        <th>%</th>
                        <th>Grade</th>
                        <th>Sec</th>
                      </tr>
                    </thead>
                    <tbody>
                      {academicRecords.map((r) => (
                        <tr key={r.id}>
                          <td>{r.assessmentDate ? new Date(r.assessmentDate).toLocaleDateString() : '-'}</td>
                          <td>{r.course?.name} ({r.course?.code})</td>
                          <td>{r.assessmentName}</td>
                          <td>{r.assessmentType}</td>
                          <td>{r.obtainedMarks}/{r.maxMarks}</td>
                          <td>{r.percentage}</td>
                          <td>{r.letterGrade}</td>
                          <td>{r.session}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card-header"><FaCalendarCheck /> Attendance History</div>
            <div className="card-body">
              {attendance.length === 0 ? (
                <p className="muted">No attendance records available.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Course</th>
                        <th>Status</th>
                        <th>Time In</th>
                        <th>Time Out</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((a) => (
                        <tr key={a.id}>
                          <td>{a.date ? new Date(a.date).toLocaleDateString() : '-'}</td>
                          <td>{a.course?.name} ({a.course?.code})</td>
                          <td className={a.status === 'Absent' ? 'status-absent' : 'status-present'}>{a.status}</td>
                          <td>{a.timeIn || '-'}</td>
                          <td>{a.timeOut || '-'}</td>
                          <td>{a.remarks || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      <style>{`
        .student-profile-page { padding: 20px; }
        .page-header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
        .back-btn { display: inline-flex; align-items: center; gap: 8px; background: #eee; border: none; padding: 8px 12px; border-radius: 6px; cursor: pointer; }
        .content-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
        @media (min-width: 992px) { .content-grid { grid-template-columns: 1fr 1fr; } }
        .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; }
        .card-header { display: flex; align-items: center; gap: 8px; background: #f8fafc; padding: 12px 16px; font-weight: 600; color: #333; border-bottom: 1px solid #e5e7eb; }
        .card-body { padding: 16px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .metric { background: #f6f7fb; padding: 12px; border-radius: 6px; text-align: center; }
        .metric-label { color: #666; font-size: 0.85rem; }
        .metric-value { color: #111; font-size: 1.1rem; font-weight: 700; }
        .table-wrapper { overflow-x: auto; }
        .table { width: 100%; border-collapse: collapse; }
        .table th, .table td { text-align: left; padding: 10px; border-bottom: 1px solid #f0f0f0; }
        .status-absent { color: #c62828; font-weight: 600; }
        .status-present { color: #2e7d32; font-weight: 600; }
        .loading { padding: 20px; color: #555; }
        .error { background: #fdecea; color: #b71c1c; padding: 12px; border: 1px solid #f5c6cb; border-radius: 6px; }
        .muted { color: #777; }
      `}</style>
    </div>
  );
}