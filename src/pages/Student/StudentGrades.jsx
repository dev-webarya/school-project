import React, { useEffect, useState } from 'react';
import { studentAPI } from '../../services/api';

const E2E = import.meta.env.VITE_E2E_MODE === 'true';
// Use Vite env base URL so dev goes through proxy and avoids CORS
const API_BASE = `${(import.meta.env.VITE_API_BASE_URL || '/api')}/e2e`;

export default function StudentGrades() {
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPublishedGrades = async () => {
      try {
        setLoading(true);
        const { data } = await studentAPI.getGrades();
        setGrades(data?.data || []);
        setError(null);
      } catch (err) {
        console.error('Student grades fetch error:', err);
        setError(err.response?.data?.message || 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    };
    fetchPublishedGrades();
  }, []);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>My Grades</h1>
      <p>View your academic performance across all subjects.</p>

      <div style={{ overflowX: 'auto', marginTop: '30px' }}>
        {loading ? (
          <p>Loading grades...</p>
        ) : error ? (
          <p style={{ color: 'red' }}>Error: {error}</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Subject</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Assessment</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>Marks</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>Total</th>
                <th style={{ textAlign: 'center', padding: '12px', borderBottom: '1px solid #eee' }}>Grade</th>
                <th style={{ textAlign: 'left', padding: '12px', borderBottom: '1px solid #eee' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((grade, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2', fontWeight: '500' }}>{grade.subject}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2' }}>{grade.assessment}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2', textAlign: 'center' }}>{grade.marks}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2', textAlign: 'center' }}>{grade.totalMarks}</td>
                  <td style={{ 
                    padding: '12px', 
                    borderBottom: '1px solid #f2f2f2', 
                    textAlign: 'center',
                    fontWeight: '600',
                    color: (grade.grade || '').includes('A') ? '#2e7d32' : (grade.grade || '').includes('B') ? '#1565c0' : '#c62828'
                  }}>
                    {grade.grade}
                  </td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #f2f2f2' }}>{grade.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ 
        background: '#f5f9ff', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '30px',
        border: '1px solid #e3f2fd'
      }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#1a237e' }}>Grade Scale</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
          <div>A+ (Above 90): Outstanding</div>
          <div>A (85-90): Excellent</div>
          <div>B+ (80-85): Very Good</div>
          <div>B (70-80): Good</div>
          <div>C+ (60-70): Satisfactory</div>
          <div>C (50-60): Average</div>
          <div>D (33-49): Pass</div>
          <div>F (Below 33): Fail</div>
        </div>
      </div>
    </div>
  );
}