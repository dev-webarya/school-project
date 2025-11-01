import React, { useState } from 'react';
import { FaChartBar, FaDownload, FaCalendarAlt, FaUsers, FaGraduationCap, FaRupeeSign, FaChartLine, FaPrint } from 'react-icons/fa';

export default function Reports() {
  const [selectedReport, setSelectedReport] = useState('academic');
  const [dateRange, setDateRange] = useState({ from: '2024-01-01', to: '2024-01-31' });
  const [selectedClass, setSelectedClass] = useState('all');

  const reportTypes = [
    {
      id: 'academic',
      title: 'Academic Performance',
      icon: <FaGraduationCap />,
      description: 'Student grades, attendance, and performance analytics',
      color: '#4285F4'
    },
    {
      id: 'financial',
      title: 'Financial Reports',
      icon: <FaRupeeSign />,
      description: 'Fee collection, expenses, and financial summaries',
      color: '#34A853'
    },
    {
      id: 'attendance',
      title: 'Attendance Reports',
      icon: <FaUsers />,
      description: 'Student and faculty attendance tracking',
      color: '#EA4335'
    },
    {
      id: 'enrollment',
      title: 'Enrollment Analytics',
      icon: <FaChartLine />,
      description: 'Student enrollment trends and demographics',
      color: '#FBBC05'
    }
  ];

  // Sample data for different reports
  const academicData = {
    classPerformance: [
      { class: '10th A', students: 35, avgGrade: 85.2, passRate: 94.3, topPerformer: 'Rahul Sharma' },
      { class: '10th B', students: 33, avgGrade: 82.1, passRate: 90.9, topPerformer: 'Priya Patel' },
      { class: '9th A', students: 38, avgGrade: 87.5, passRate: 97.4, topPerformer: 'Amit Kumar' },
      { class: '9th B', students: 36, avgGrade: 84.3, passRate: 91.7, topPerformer: 'Sneha Gupta' }
    ],
    subjectAnalysis: [
      { subject: 'Mathematics', avgScore: 78.5, passRate: 85.2, difficulty: 'High' },
      { subject: 'Science', avgScore: 82.1, passRate: 89.7, difficulty: 'Medium' },
      { subject: 'English', avgScore: 85.3, passScore: 92.1, difficulty: 'Low' },
      { subject: 'Social Studies', avgScore: 80.7, passRate: 87.4, difficulty: 'Medium' }
    ]
  };

  const financialData = {
    monthlyCollection: [
      { month: 'Jan 2024', target: 3000000, collected: 2850000, expenses: 1200000, profit: 1650000 },
      { month: 'Dec 2023', target: 3000000, collected: 2950000, expenses: 1150000, profit: 1800000 },
      { month: 'Nov 2023', target: 3000000, collected: 2800000, expenses: 1100000, profit: 1700000 }
    ],
    expenseBreakdown: [
      { category: 'Salaries', amount: 800000, percentage: 66.7 },
      { category: 'Infrastructure', amount: 200000, percentage: 16.7 },
      { category: 'Utilities', amount: 100000, percentage: 8.3 },
      { category: 'Supplies', amount: 100000, percentage: 8.3 }
    ]
  };

  const attendanceData = {
    classAttendance: [
      { class: '10th A', totalStudents: 35, presentToday: 33, attendanceRate: 94.3 },
      { class: '10th B', totalStudents: 33, presentToday: 30, attendanceRate: 90.9 },
      { class: '9th A', totalStudents: 38, presentToday: 37, attendanceRate: 97.4 },
      { class: '9th B', totalStudents: 36, presentToday: 33, attendanceRate: 91.7 }
    ],
    facultyAttendance: [
      { name: 'Dr. Sharma', department: 'Mathematics', daysPresent: 22, totalDays: 23, rate: 95.7 },
      { name: 'Mrs. Gupta', department: 'Science', daysPresent: 23, totalDays: 23, rate: 100 },
      { name: 'Mr. Patel', department: 'English', daysPresent: 21, totalDays: 23, rate: 91.3 }
    ]
  };

  const enrollmentData = {
    yearlyTrends: [
      { year: '2024', enrolled: 1250, graduated: 180, retention: 94.5 },
      { year: '2023', enrolled: 1180, graduated: 165, retention: 92.1 },
      { year: '2022', enrolled: 1120, graduated: 155, retention: 90.8 }
    ],
    demographics: [
      { category: 'Gender', male: 52, female: 48 },
      { category: 'Transport', bus: 65, private: 35 },
      { category: 'Locality', local: 78, outstation: 22 }
    ]
  };

  const generateReport = () => {
    alert(`Generating ${reportTypes.find(r => r.id === selectedReport)?.title} report for ${dateRange.from} to ${dateRange.to}`);
  };

  const ReportCard = ({ report }) => (
    <div
      onClick={() => setSelectedReport(report.id)}
      style={{
        background: selectedReport === report.id ? report.color + '10' : 'white',
        border: selectedReport === report.id ? `2px solid ${report.color}` : '1px solid #ddd',
        borderRadius: '8px',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxShadow: selectedReport === report.id ? '0 4px 15px rgba(0,0,0,0.1)' : '0 2px 5px rgba(0,0,0,0.05)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
        <div style={{
          width: '50px',
          height: '50px',
          borderRadius: '50%',
          background: report.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '1.5rem'
        }}>
          {report.icon}
        </div>
        <div>
          <h3 style={{ margin: '0', color: '#333' }}>{report.title}</h3>
          <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.9rem' }}>{report.description}</p>
        </div>
      </div>
    </div>
  );

  const AcademicReport = () => (
    <div>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Class Performance Overview</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Class</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Students</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Avg Grade</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Pass Rate</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Top Performer</th>
              </tr>
            </thead>
            <tbody>
              {academicData.classPerformance.map((cls, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{cls.class}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cls.students}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cls.avgGrade}%</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{ color: cls.passRate >= 95 ? '#4CAF50' : cls.passRate >= 85 ? '#FF9800' : '#f44336' }}>
                      {cls.passRate}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cls.topPerformer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Subject-wise Analysis</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Subject</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Avg Score</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Pass Rate</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {academicData.subjectAnalysis.map((subject, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{subject.subject}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{subject.avgScore}%</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{subject.passRate}%</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      background: subject.difficulty === 'High' ? '#ffebee' : subject.difficulty === 'Medium' ? '#fff3e0' : '#e8f5e9',
                      color: subject.difficulty === 'High' ? '#c62828' : subject.difficulty === 'Medium' ? '#ef6c00' : '#2e7d32'
                    }}>
                      {subject.difficulty}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const FinancialReport = () => (
    <div>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Monthly Financial Summary</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Month</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Target</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Collected</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Expenses</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Profit</th>
              </tr>
            </thead>
            <tbody>
              {financialData.monthlyCollection.map((month, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{month.month}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>₹{(month.target / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', color: '#4CAF50' }}>₹{(month.collected / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', color: '#f44336' }}>₹{(month.expenses / 100000).toFixed(1)}L</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd', color: '#1a237e', fontWeight: 'bold' }}>₹{(month.profit / 100000).toFixed(1)}L</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Expense Breakdown</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          {financialData.expenseBreakdown.map((expense, index) => (
            <div key={index} style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '15px',
              textAlign: 'center'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#1a237e' }}>{expense.category}</h4>
              <p style={{ margin: '0', fontSize: '1.2rem', fontWeight: 'bold' }}>₹{(expense.amount / 100000).toFixed(1)}L</p>
              <p style={{ margin: '5px 0 0 0', color: '#666' }}>{expense.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const AttendanceReport = () => (
    <div>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Student Attendance by Class</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Class</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Total Students</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Present Today</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Attendance Rate</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.classAttendance.map((cls, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{cls.class}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cls.totalStudents}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{cls.presentToday}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{ color: cls.attendanceRate >= 95 ? '#4CAF50' : cls.attendanceRate >= 85 ? '#FF9800' : '#f44336' }}>
                      {cls.attendanceRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Faculty Attendance</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Faculty</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Department</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Days Present</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Total Days</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Rate</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.facultyAttendance.map((faculty, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{faculty.name}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{faculty.department}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{faculty.daysPresent}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{faculty.totalDays}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{ color: faculty.rate >= 95 ? '#4CAF50' : faculty.rate >= 85 ? '#FF9800' : '#f44336' }}>
                      {faculty.rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const EnrollmentReport = () => (
    <div>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Yearly Enrollment Trends</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Year</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Enrolled</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Graduated</th>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Retention Rate</th>
              </tr>
            </thead>
            <tbody>
              {enrollmentData.yearlyTrends.map((year, index) => (
                <tr key={index}>
                  <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 'bold' }}>{year.year}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{year.enrolled}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>{year.graduated}</td>
                  <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                    <span style={{ color: year.retention >= 95 ? '#4CAF50' : year.retention >= 90 ? '#FF9800' : '#f44336' }}>
                      {year.retention}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>Student Demographics</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
          {enrollmentData.demographics.map((demo, index) => (
            <div key={index} style={{
              border: '1px solid #ddd',
              borderRadius: '6px',
              padding: '20px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: '#1a237e' }}>{demo.category} Distribution</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span>Male/Bus/Local:</span>
                <span style={{ fontWeight: 'bold' }}>{demo.male || demo.bus || demo.local}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Female/Private/Outstation:</span>
                <span style={{ fontWeight: 'bold' }}>{demo.female || demo.private || demo.outstation}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Reports & Analytics</h1>
      <p>Generate comprehensive reports and analyze school performance data.</p>

      {/* Report Type Selection */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px',
        margin: '30px 0'
      }}>
        {reportTypes.map(report => (
          <ReportCard key={report.id} report={report} />
        ))}
      </div>

      {/* Report Controls */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginBottom: '20px',
        display: 'flex',
        gap: '15px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FaCalendarAlt style={{ color: '#666' }} />
          <label>From:</label>
          <input
            type="date"
            value={dateRange.from}
            onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px 12px'
            }}
          />
          <label>To:</label>
          <input
            type="date"
            value={dateRange.to}
            onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            style={{
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '8px 12px'
            }}
          />
        </div>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          style={{
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '8px 12px'
          }}
        >
          <option value="all">All Classes</option>
          <option value="12th">12th</option>
          <option value="11th">11th</option>
          <option value="10th">10th</option>
          <option value="9th">9th</option>
          <option value="8th">8th</option>
          <option value="7th">7th</option>
          <option value="6th">6th</option>
          <option value="5th">5th</option>
          <option value="4th">4th</option>
          <option value="3rd">3rd</option>
          <option value="2nd">2nd</option>
          <option value="1st">1st</option>
          <option value="UKG">UKG</option>
          <option value="LKG">LKG</option>
          <option value="NS">NS</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
          <button
            onClick={generateReport}
            style={{
              background: '#1a237e',
              border: 'none',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaDownload /> Generate Report
          </button>
          <button
            style={{
              background: '#4CAF50',
              border: 'none',
              color: 'white',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
          >
            <FaPrint /> Print
          </button>
        </div>
      </div>

      {/* Report Content */}
      {selectedReport === 'academic' && <AcademicReport />}
      {selectedReport === 'financial' && <FinancialReport />}
      {selectedReport === 'attendance' && <AttendanceReport />}
      {selectedReport === 'enrollment' && <EnrollmentReport />}
    </div>
  );
}