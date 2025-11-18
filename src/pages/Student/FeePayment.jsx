import React, { useEffect, useState } from 'react';
import { FaCreditCard, FaUniversity, FaWallet, FaDownload, FaCheckCircle, FaExclamationTriangle, FaClock } from 'react-icons/fa';
import { studentAPI } from '../../services/api';

export default function FeePayment() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [fees, setFees] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadFees = async () => {
      setIsLoading(true);
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
          session: '',
          description: '',
          paidDate: d.status === 'paid' ? (payments.find(p => p.installmentNumber === d.installmentNumber)?.paymentDetails?.paymentDate || null) : null
        }));
        setFees(normalized);
        setHistory(payments.map(p => ({
          id: String(p._id || Math.random()),
          type: `Installment ${p.installmentNumber}`,
          amount: Number(p.paymentDetails?.amount || 0),
          date: p.paymentDetails?.paymentDate || new Date().toISOString(),
          transactionId: p.paymentDetails?.transactionId || '',
          method: p.paymentDetails?.paymentMethod || ''
        })));
      } catch (error) {
        setFees([]);
        setHistory([]);
      } finally {
        setIsLoading(false);
      }
    };
    loadFees();
  }, []);

  const [history, setHistory] = useState([]);

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
      case 'paid': return <FaCheckCircle />;
      case 'pending': return <FaClock />;
      case 'overdue': return <FaExclamationTriangle />;
      default: return <FaClock />;
    }
  };

  const handlePayNow = (fee) => {
    setSelectedFee(fee);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    if (!selectedFee) return;
    try {
      const res = await studentAPI.payFees({ dueId: selectedFee.id, paymentMethod: selectedPaymentMethod });
      const p = res?.data?.data?.payment;
      alert(`Payment of ₹${selectedFee.amount} processed successfully!`);
      setFees(prev => prev.map(f => f.id === selectedFee.id ? { ...f, status: 'paid', paidDate: new Date().toISOString() } : f));
      if (p) {
        setHistory(prev => [{
          id: String(p._id || Math.random()),
          type: `Installment ${p.installmentNumber}`,
          amount: Number(p.paymentDetails?.amount || 0),
          date: p.paymentDetails?.paymentDate || new Date().toISOString(),
          transactionId: p.paymentDetails?.transactionId || '',
          method: p.paymentDetails?.paymentMethod || ''
        }, ...prev]);
      }
    } catch (error) {
      alert(error.userMessage || 'Payment failed. Please try again.');
    } finally {
      setShowPaymentModal(false);
      setSelectedFee(null);
    }
  };

  const totalPending = fees
    .filter(fee => fee.status !== 'paid')
    .reduce((sum, fee) => sum + fee.amount, 0);

  const totalPaid = fees
    .filter(fee => fee.status === 'paid')
    .reduce((sum, fee) => sum + fee.amount, 0);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Fee Payment</h1>

      {/* Fee Summary */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Pending</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold' }}>₹{totalPending.toLocaleString()}</p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Paid</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold' }}>₹{totalPaid.toLocaleString()}</p>
        </div>
        
        <div style={{
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          padding: '20px',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Total Fees</h3>
          <p style={{ margin: '0', fontSize: '2rem', fontWeight: 'bold' }}>₹{(totalPending + totalPaid).toLocaleString()}</p>
        </div>
      </div>

      {/* Current Fees */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '25px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Current Session Fees</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {(isLoading ? [] : fees).map(fee => (
            <div key={fee.id} style={{
              border: '1px solid #e9ecef',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: fee.status === 'overdue' ? '#fff5f5' : '#fff'
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                  <h4 style={{ margin: '0', color: '#333' }}>{fee.type}</h4>
                  <span style={{ 
                    color: getStatusColor(fee.status),
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    fontSize: '0.9rem'
                  }}>
                    {getStatusIcon(fee.status)}
                    {fee.status.charAt(0).toUpperCase() + fee.status.slice(1)}
                  </span>
                </div>
                <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>{fee.description}</p>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '0.8rem' }}>
                  Due: {new Date(fee.dueDate).toLocaleDateString()}
                  {fee.paidDate && ` | Paid: ${new Date(fee.paidDate).toLocaleDateString()}`}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: '0 0 10px 0', fontSize: '1.2rem', fontWeight: 'bold', color: '#333' }}>
                  ₹{fee.amount.toLocaleString()}
                </p>
                {fee.status !== 'paid' && (
                  <button
                    onClick={() => handlePayNow(fee)}
                    style={{
                      background: fee.status === 'overdue' ? '#dc3545' : '#007bff',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    Pay Now
                  </button>
                )}
                {fee.status === 'paid' && (
                  <button
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                  >
                    <FaDownload style={{ marginRight: '5px' }} />
                    Receipt
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        padding: '25px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Payment History</h2>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Fee Type</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Transaction ID</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Method</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map(payment => (
                <tr key={payment.id}>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{payment.type}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>₹{payment.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{new Date(payment.date).toLocaleDateString()}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{payment.transactionId}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>{payment.method}</td>
                  <td style={{ padding: '12px', borderBottom: '1px solid #dee2e6' }}>
                    <button style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '6px 12px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.8rem'
                    }}>
                      <FaDownload style={{ marginRight: '5px' }} />
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <h3 style={{ marginBottom: '20px', color: '#333' }}>Payment Details</h3>
            
            <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>{selectedFee?.type}</p>
              <p style={{ margin: '0 0 5px 0', color: '#666' }}>{selectedFee?.description}</p>
              <p style={{ margin: '0', fontSize: '1.2rem', fontWeight: 'bold', color: '#007bff' }}>
                Amount: ₹{selectedFee?.amount.toLocaleString()}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Payment Method</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="card"
                    checked={selectedPaymentMethod === 'card'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <FaCreditCard />
                  Credit/Debit Card
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="netbanking"
                    checked={selectedPaymentMethod === 'netbanking'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <FaUniversity />
                  Net Banking
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="wallet"
                    checked={selectedPaymentMethod === 'wallet'}
                    onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                  />
                  <FaWallet />
                  Digital Wallet
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={processPayment}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Pay ₹{selectedFee?.amount.toLocaleString()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}