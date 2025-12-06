import React, { useState, useEffect } from 'react';
import config from '../../config/config.js';
import { studentAPI, paymentsAPI } from '../../services/api.js';
import { FaCalendarAlt, FaBook, FaGraduationCap, FaChalkboard, FaFileAlt, FaCreditCard, FaUsers, FaClipboardCheck, FaCalendarCheck, FaClipboardList, FaExclamationTriangle, FaClock, FaDownload } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './StudentDashboard.css';

export default function StudentDashboard() {
  const { token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attendancePercent, setAttendancePercent] = useState(null);
  const [fees, setFees] = useState([]);
  const [isFeeLoading, setIsFeeLoading] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await studentAPI.getDashboard();
      const data = response.data;

      if (data?.success) {
        setDashboardData(data.data);
        setError(null);
      } else {
        setError(data?.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.userMessage || 'Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchAttendanceSummary = async () => {
      try {
        const res = await studentAPI.getAttendance();
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        const total = list.length;
        const presentCount = list.filter(r => r.status === 'Present' || r.status === 'Late').length;
        setAttendancePercent(total > 0 ? Math.round((presentCount / total) * 100) : 0);
      } catch (err) {
        console.error('Student attendance summary error:', err);
      }
    };
    fetchAttendanceSummary();
  }, []);

  useEffect(() => {
    const loadFees = async () => {
      setIsFeeLoading(true);
      try {
        const res = await studentAPI.getFees();
        const payload = res?.data?.data || {};
        const dues = Array.isArray(payload.dues) ? payload.dues : [];
        const payments = Array.isArray(payload.payments) ? payload.payments : [];
        const normalized = dues.map(d => ({
          id: String(d._id || Math.random()),
          type: `Installment ${d.installmentNumber}`,
          amount: Number(d.amount || 0),
          dueDate: d.dueDate || new Date().toISOString(),
          status: d.status || 'pending',
          paidDate: d.status === 'paid' ? (payments.find(p => p.installmentNumber === d.installmentNumber)?.paymentDetails?.paymentDate || null) : null
        }));
        setFees(normalized);
      } catch (_) {
        setFees([]);
      } finally {
        setIsFeeLoading(false);
      }
    };
    loadFees();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return '#28a745';
      case 'pending': return '#ffc107';
      case 'overdue': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <FaDownload />;
      case 'pending': return <FaClock />;
      case 'overdue': return <FaExclamationTriangle />;
      default: return <FaClock />;
    }
  };

  const handlePayNow = async (fee) => {
    try {
      setSelectedFee(fee);
      const create = await paymentsAPI.create({ amount: fee.amount, currency: 'INR', description: fee.type, metadata: { dueId: fee.id } });
      const { intent, keyId } = create.data || {};
      const load = await new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.onload = () => resolve(true);
        s.onerror = reject;
        document.body.appendChild(s);
      });
      void load;
      const options = {
        key: keyId || config.RAZORPAY_KEY_ID,
        amount: intent?.amount,
        currency: intent?.currency || 'INR',
        name: config.APP_NAME,
        description: fee.type,
        order_id: intent?.id,
        prefill: {},
        handler: async (response) => {
          try {
            await paymentsAPI.capture({ paymentId: response.razorpay_payment_id, orderId: response.razorpay_order_id, signature: response.razorpay_signature });
            const res = await studentAPI.payFees({ dueId: fee.id, paymentMethod: 'online', transactionId: response.razorpay_payment_id });
            const p = res?.data?.data?.payment;
            setFees(prev => prev.map(f => f.id === fee.id ? { ...f, status: 'paid', paidDate: new Date().toISOString() } : f));
          } catch (e) {
            alert(e.userMessage || 'Payment verification failed');
          } finally {
            setSelectedFee(null);
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      alert(error.userMessage || 'Payment failed. Please try again.');
      setSelectedFee(null);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <h1>Student Dashboard</h1>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <h1>Student Dashboard</h1>
        <p style={{ color: 'red' }}>Error: {error}</p>
        <button onClick={fetchDashboardData} style={{ padding: '10px 20px', background: '#1a237e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Retry
        </button>
      </div>
    );
  }

  const assignments = dashboardData?.assignments?.list || [];
  const totalPending = fees.filter(f => f.status !== 'paid').reduce((sum, f) => sum + f.amount, 0);
  const totalPaid = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="container" style={{ padding: '40px 0' }}>
      <h1>Student Dashboard</h1>
      <p>Welcome back, Student! Here's your academic overview.</p>

      {/* Welcome header with actual student details */}
      <div style={{ background: 'white', borderRadius: '8px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '12px' }}>
        <h2 style={{ margin: 0 }}>
          Welcome, {dashboardData?.studentInfo?.name || 'Student'}
        </h2>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Class: <strong>{dashboardData?.studentInfo?.class || 'N/A'}</strong>
          {dashboardData?.studentInfo?.section ? <> • Section: <strong>{dashboardData.studentInfo.section}</strong></> : null}
        </p>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Roll Number: <strong>{dashboardData?.studentInfo?.rollNumber || 'N/A'}</strong>
        </p>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Student ID: <strong>{dashboardData?.studentInfo?.studentId || 'N/A'}</strong>
          {dashboardData?.studentInfo?.admissionNumber ? <> • Admission No: <strong>{dashboardData.studentInfo.admissionNumber}</strong></> : null}
        </p>
        <p style={{ margin: '6px 0', color: '#555' }}>
          Email: <strong>{dashboardData?.studentInfo?.email || 'N/A'}</strong>
        </p>
      </div>

      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        marginTop: '20px'
      }}>
        <h2 style={{ margin: '0 0 15px 0' }}>Fee Payment</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '15px',
          marginBottom: '15px'
        }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>Total Pending</h3>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>₹{totalPending.toLocaleString()}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>Total Paid</h3>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>₹{totalPaid.toLocaleString()}</p>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white', borderRadius: '8px', padding: '16px', textAlign: 'center' }}>
            <h3 style={{ margin: 0 }}>Total Fees</h3>
            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 700 }}>₹{(totalPending + totalPaid).toLocaleString()}</p>
          </div>
        </div>

        <div>
          {(isFeeLoading ? [] : fees).map((fee) => (
            <div key={fee.id} style={{ border: '1px solid #e9ecef', borderRadius: '8px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: fee.status === 'overdue' ? '#fff5f5' : '#fff' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <h4 style={{ margin: 0 }}>{fee.type}</h4>
                  <span style={{ color: getStatusColor(fee.status), display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.9rem' }}>
                    {getStatusIcon(fee.status)}
                    {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                  </span>
                </div>
                <p style={{ margin: 0, color: '#666', fontSize: '0.85rem' }}>Due: {new Date(fee.dueDate).toLocaleDateString()}{fee.paidDate && ` • Paid: ${new Date(fee.paidDate).toLocaleDateString()}`}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 600 }}>₹{fee.amount.toLocaleString()}</p>
                {fee.status !== 'paid' && (
                  <button onClick={() => handlePayNow(fee)} style={{ background: fee.status === 'overdue' ? '#dc3545' : '#1a237e', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '5px', cursor: 'pointer' }}>
                    Pay Now
                  </button>
                )}
                {fee.status === 'paid' && (
                  <button style={{ background: '#6c757d', color: 'white', border: 'none', padding: '8px 14px', borderRadius: '5px', cursor: 'pointer' }}>
                    <FaDownload style={{ marginRight: '6px' }} /> Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          textAlign: 'center'
        }}>
          <div style={{ 
             width: '50px', 
             height: '50px', 
             borderRadius: '50%', 
             background: '#4285F4',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'white',
             fontSize: '1.5rem',
             margin: '0 auto 10px'
           }}>
             <FaCalendarCheck />
           </div>
           <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#333' }}>
             {attendancePercent ?? dashboardData?.attendanceSummary?.percentage ?? '0'}%
           </h3>
           <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Attendance</p>
         </div>
 
         <div style={{
           background: 'white',
           borderRadius: '8px',
           padding: '20px',
           boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
           textAlign: 'center'
         }}>
           <div style={{ 
             width: '50px', 
             height: '50px', 
             borderRadius: '50%', 
             background: '#34A853',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'white',
             fontSize: '1.5rem',
             margin: '0 auto 10px'
           }}>
             <FaBook />
           </div>
           <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#333' }}>
             {dashboardData?.quickStats?.totalSubjects || '0'}
           </h3>
           <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Subjects</p>
         </div>
 
         <div style={{
           background: 'white',
           borderRadius: '8px',
           padding: '20px',
           boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
           textAlign: 'center'
         }}>
           <div style={{ 
             width: '50px', 
             height: '50px', 
             borderRadius: '50%', 
             background: '#FF9800',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'white',
             fontSize: '1.5rem',
             margin: '0 auto 10px'
           }}>
             <FaClipboardList />
           </div>
           <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#333' }}>
             {dashboardData?.quickStats?.pendingAssignments || '0'}
           </h3>
           <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Pending</p>
         </div>
 
         <div style={{
           background: 'white',
           borderRadius: '8px',
           padding: '20px',
           boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
           textAlign: 'center'
         }}>
           <div style={{ 
             width: '50px', 
             height: '50px', 
             borderRadius: '50%', 
             background: '#9C27B0',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center',
             color: 'white',
             fontSize: '1.5rem',
             margin: '0 auto 10px'
           }}>
             <FaGraduationCap />
           </div>
           <h3 style={{ margin: '0 0 5px 0', fontSize: '1.5rem', color: '#333' }}>
             {dashboardData?.quickStats?.averageGrade || 'N/A'}
           </h3>
           <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>Avg Grade</p>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
        gap: '20px',
        margin: '30px 0'
      }}>
        <Link to="/student/courses" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#4285F4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              <FaBook />
            </div>
            <h3 style={{ margin: '0', color: '#333' }}>My Courses</h3>
          </div>
        </Link>

        <Link to="/student/grades" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#EA4335',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              <FaGraduationCap />
            </div>
            <h3 style={{ margin: '0', color: '#333' }}>Grades</h3>
          </div>
        </Link>

        <Link to="/student/attendance" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#FBBC05',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              <FaCalendarAlt />
            </div>
            <h3 style={{ margin: '0', color: '#333' }}>Attendance</h3>
          </div>
        </Link>

        <Link to="/student/online-classes" style={{ textDecoration: 'none' }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            padding: '20px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
            transition: 'transform 0.2s',
            cursor: 'pointer'
          }}>
            <div style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: '50%', 
              background: '#34A853',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.5rem'
            }}>
              <FaChalkboard />
            </div>
            <h3 style={{ margin: '0', color: '#333' }}>Online Classes</h3>
          </div>
        </Link>
      </div>

      

      {/* Pending Assignments */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)'
      }}>
        <h2 style={{ margin: '0 0 15px 0', fontSize: '1.2rem' }}>Assignments</h2>
        <div>
          {assignments.map(assignment => (
            <div key={assignment.id} style={{ 
              padding: '15px', 
              borderRadius: '6px',
              border: '1px solid #f0f0f0',
              marginBottom: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ margin: '0', fontSize: '1.1rem', color: '#1a237e' }}>{assignment.title}</h3>
                <span style={{ 
                  fontSize: '0.8rem', 
                  padding: '3px 8px', 
                  borderRadius: '4px',
                  background: assignment.status === 'Pending' ? '#ffebee' : '#e8f5e9',
                  color: assignment.status === 'Pending' ? '#c62828' : '#2e7d32'
                }}>
                  {assignment.status}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginTop: '10px',
                color: '#666',
                fontSize: '0.9rem'
              }}>
                <span>{assignment.subject}</span>
                <span>Due: {assignment.dueDate}</span>
              </div>
            </div>
          ))}
        </div>
        <Link to="/student/assignments" style={{ textDecoration: 'none' }}>
          <button style={{
            background: '#1a237e',
            border: 'none',
            color: 'white',
            fontWeight: '500',
            padding: '10px 15px',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '10px'
          }}>
            View All Assignments
          </button>
        </Link>
      </div>

      {/* Enhanced Quick Actions */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        marginTop: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', fontSize: '1.2rem' }}>Quick Actions</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px'
        }}>
          <Link to="/student/assignments" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#4285F4',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <FaFileAlt />
              </div>
              <div>
                <h4 style={{ margin: '0', color: '#333', fontSize: '0.9rem' }}>Assignments</h4>
                <p style={{ margin: '0', color: '#666', fontSize: '0.8rem' }}>Submit & track</p>
              </div>
            </div>
          </Link>

          <Link to="/student/fee-payment" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#34A853',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <FaCreditCard />
              </div>
              <div>
                <h4 style={{ margin: '0', color: '#333', fontSize: '0.9rem' }}>Fee Payment</h4>
                <p style={{ margin: '0', color: '#666', fontSize: '0.8rem' }}>Pay fees online</p>
              </div>
            </div>
          </Link>

          <Link to="/student/online-classes" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#EA4335',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <FaChalkboard />
              </div>
              <div>
                <h4 style={{ margin: '0', color: '#333', fontSize: '0.9rem' }}>Online Classes</h4>
                <p style={{ margin: '0', color: '#666', fontSize: '0.8rem' }}>Join live sessions</p>
              </div>
            </div>
          </Link>

          <Link to="/student/grades" style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#f8f9fa',
              borderRadius: '6px',
              padding: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              transition: 'background 0.2s',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: '#FBBC04',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <FaGraduationCap />
              </div>
              <div>
                <h4 style={{ margin: '0', color: '#333', fontSize: '0.9rem' }}>Grades</h4>
                <p style={{ margin: '0', color: '#666', fontSize: '0.8rem' }}>View results</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
