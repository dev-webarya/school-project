import { useState } from 'react';
import { FaDownload, FaUpload, FaCheck, FaMobile, FaEnvelope, FaShieldAlt } from 'react-icons/fa';
import './Admissions.css';

// Add jsPDF import
import jsPDF from 'jspdf';
import { generalAPI } from '../../services/api.js';

const Admissions = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    parentName: '',
    email: '',
    phone: '',
    address: '',
    grade: '',
    previousSchool: '',
    documents: null
  });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  // OTP Verification States
  const [otpStep, setOtpStep] = useState('verified'); // default to form without OTP
  const [contactInfo, setContactInfo] = useState({
    mobile: '',
    email: ''
  });
  const [otpData, setOtpData] = useState({
    mobileOtp: '',
    emailOtp: '',
    mobileVerified: false,
    emailVerified: false
  });
  const [otpSent, setOtpSent] = useState({
    mobile: false,
    email: false
  });
  const [loading, setLoading] = useState({
    sendingMobileOtp: false,
    sendingEmailOtp: false,
    verifyingMobileOtp: false,
    verifyingEmailOtp: false
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prevState => ({
      ...prevState,
      documents: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Construct minimal payload for backend /api/general/admissions
      const payload = {
        studentInfo: {
          fullName: formData.fullName || 'Unknown',
          dateOfBirth: '2005-01-01', // default for demo; can be collected later
          gender: 'other'
        },
        academicInfo: {
          applyingForClass: formData.grade || 'Grade 1',
          academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1)
        },
        contactInfo: {
          email: formData.email,
          phone: formData.phone,
          address: {
            street: formData.address || '—',
            city: '—',
            state: '—',
            pincode: '000000'
          }
        },
        parentInfo: {
          father: { name: formData.parentName || 'Parent', phone: formData.phone }
        },
        previousSchool: formData.previousSchool || ''
      };

      const res = await generalAPI.submitAdmission(payload);
      if (res.data?.success) {
        setFormSubmitted(true);
      } else {
        alert(res.data?.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Submit admission error:', error);
      alert(error.userMessage || 'Failed to submit application. Please try again.');
    }
  };

  // OTP Verification Handlers
  const handleContactInfoChange = (e) => {
    const { name, value } = e.target;
    setContactInfo(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleOtpChange = (e) => {
    const { name, value } = e.target;
    setOtpData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const sendMobileOtp = async () => {
    setLoading(prev => ({ ...prev, sendingMobileOtp: true }));
    try {
      const res = await generalAPI.sendOTP(contactInfo.mobile);
      setOtpSent(prev => ({ ...prev, mobile: true }));
      alert(res.data?.message || `OTP sent to ${contactInfo.mobile}`);
    } catch (error) {
      alert(error.userMessage || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, sendingMobileOtp: false }));
    }
  };

  const sendEmailOtp = async () => {
    setLoading(prev => ({ ...prev, sendingEmailOtp: true }));
    try {
      const res = await generalAPI.sendEmailOTP(contactInfo.email);
      setOtpSent(prev => ({ ...prev, email: true }));
      alert(res.data?.message || `OTP sent to ${contactInfo.email}`);
    } catch (error) {
      alert(error.userMessage || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, sendingEmailOtp: false }));
    }
  };

  const verifyMobileOtp = async () => {
    setLoading(prev => ({ ...prev, verifyingMobileOtp: true }));
    try {
      const res = await generalAPI.verifyOTP(contactInfo.mobile, otpData.mobileOtp);
      if (res.data?.success) {
        setOtpData(prev => ({ ...prev, mobileVerified: true }));
        alert(res.data?.message || 'Mobile number verified successfully!');
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      alert(error.userMessage || 'Verification failed. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, verifyingMobileOtp: false }));
    }
  };

  const verifyEmailOtp = async () => {
    setLoading(prev => ({ ...prev, verifyingEmailOtp: true }));
    try {
      const res = await generalAPI.verifyEmailOTP(contactInfo.email, otpData.emailOtp);
      if (res.data?.success) {
        setOtpData(prev => ({ ...prev, emailVerified: true }));
        alert(res.data?.message || 'Email verified successfully!');
      } else {
        alert('Invalid OTP. Please try again.');
      }
    } catch (error) {
      alert(error.userMessage || 'Verification failed. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, verifyingEmailOtp: false }));
    }
  };

  const proceedToApplication = () => {
    if (otpData.mobileVerified) {
      setOtpStep('verified');
      // Pre-fill the form with verified contact info
      setFormData(prev => ({
        ...prev,
        email: contactInfo.email || '',
        phone: contactInfo.mobile
      }));
    } else {
      alert('Please verify your mobile number before proceeding.');
    }
  };

  const downloadForm = () => {
    // Generate a simple Admission Form PDF using jsPDF
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text('BBD Academy - Admission Form', 20, 20);

    doc.setFontSize(12);
    doc.text('Instructions:', 20, 35);
    doc.text('- Fill in all required fields clearly.', 20, 42);
    doc.text('- Attach necessary documents (Birth Certificate, Previous Marksheets).', 20, 49);
    doc.text('- Submit the completed form to the admissions office.', 20, 56);

    doc.text('Applicant Details (to be filled by applicant):', 20, 72);
    doc.text('Full Name: ________________________________', 20, 82);
    doc.text('Parent/Guardian Name: ______________________', 20, 92);
    doc.text('Email: ____________________________________', 20, 102);
    doc.text('Phone: ____________________________________', 20, 112);
    doc.text('Address: __________________________________', 20, 122);
    doc.text('Applying for Grade: ________________________', 20, 132);
    doc.text('Previous School: ___________________________', 20, 142);

    doc.text('Signature of Parent/Guardian: ______________', 20, 162);
    doc.text('Date: ___________________', 120, 162);

    doc.save('BBD-Academy-Admission-Form.pdf');
  };

  return (
    <main className="admissions-page">
      {/* Hero Section */}
      <section className="admissions-hero">
        <div className="container">
          <h1>Admissions</h1>
          <p>Join our prestigious institution for a bright future</p>
        </div>
      </section>

      {/* Admissions Content */}
      <section className="admissions-content section">
        <div className="container">
          <div className="admissions-grid">
            <div className="admissions-info">
              <h2>Admission Process</h2>
              <p>BBD Academy welcomes applications from students who are eager to learn and grow in a nurturing environment. Our admission process is designed to be straightforward and student-friendly.</p>
              
              <div className="admission-steps">
                <div className="step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h3>Application Submission</h3>
                    <p>Complete the online application form or download the PDF form for offline submission.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h3>Document Verification</h3>
                    <p>Submit required documents for verification (birth certificate, previous school records, etc.)</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h3>Entrance Assessment</h3>
                    <p>Students may be required to take an entrance assessment based on their grade level.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h3>Interview</h3>
                    <p>A brief interview with the student and parents to understand expectations and goals.</p>
                  </div>
                </div>
                
                <div className="step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h3>Admission Confirmation</h3>
                    <p>Successful applicants will receive an admission offer and fee payment details.</p>
                  </div>
                </div>
              </div>
              
              <div className="download-section">
                <h3>Download Admission Form</h3>
                <p>If you prefer to fill out a physical form, you can download our admission form in PDF format.</p>
                <button className="download-btn" onClick={downloadForm}>
                  <FaDownload /> Download Admission Form (PDF)
                </button>
              </div>
            </div>
            
            <div className="admissions-form-container">
              {formSubmitted ? (
                <div className="form-success">
                  <div className="success-icon">
                    <FaCheck />
                  </div>
                  <h2>Application Submitted!</h2>
                  <p>Thank you for applying to BBD Academy. We have received your application and will contact you shortly.</p>
                  <p>Application Reference: <strong>APP-{Math.floor(Math.random() * 10000)}</strong></p>
                  <button className="btn-primary" onClick={() => {
                    setFormSubmitted(false);
                    setOtpStep('verified');
                    setContactInfo({ mobile: '', email: '' });
                    setOtpData({ mobileOtp: '', emailOtp: '', mobileVerified: false, emailVerified: false });
                    setOtpSent({ mobile: false, email: false });
                  }}>Submit Another Application</button>
                </div>
              ) : otpStep === 'contact' ? (
                <div className="otp-verification-container">
                  <div className="verification-header">
                    <FaShieldAlt className="security-icon" />
                    <h2>Secure Verification Required</h2>
                    <p>Please verify your mobile number to proceed with the admission application. Email verification is optional but recommended.</p>
                  </div>
                  
                  <div className="contact-verification-form">
                    <div className="verification-step">
                      <div className="step-header">
                        <FaMobile className="step-icon" />
                        <h3>Mobile Number Verification</h3>
                      </div>
                      <div className="input-group">
                        <input
                          type="tel"
                          name="mobile"
                          placeholder="Enter your mobile number"
                          value={contactInfo.mobile}
                          onChange={handleContactInfoChange}
                          maxLength="10"
                          pattern="[0-9]{10}"
                        />
                        <button
                          type="button"
                          onClick={sendMobileOtp}
                          disabled={!contactInfo.mobile || contactInfo.mobile.length !== 10 || loading.sendingMobileOtp}
                          className="send-otp-btn"
                        >
                          {loading.sendingMobileOtp ? 'Sending...' : otpSent.mobile ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                      
                      {otpSent.mobile && (
                        <div className="otp-input-group">
                          <input
                            type="text"
                            name="mobileOtp"
                            placeholder="Enter 6-digit OTP"
                            value={otpData.mobileOtp}
                            onChange={handleOtpChange}
                            maxLength="6"
                            pattern="[0-9]{6}"
                          />
                          <button
                            type="button"
                            onClick={verifyMobileOtp}
                            disabled={otpData.mobileOtp.length !== 6 || loading.verifyingMobileOtp || otpData.mobileVerified}
                            className="verify-otp-btn"
                          >
                            {loading.verifyingMobileOtp ? 'Verifying...' : otpData.mobileVerified ? 'Verified ✓' : 'Verify'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="verification-step">
                      <div className="step-header">
                        <FaEnvelope className="step-icon" />
                        <h3>Email Verification <span className="optional-label">(Optional)</span></h3>
                      </div>
                      <div className="input-group">
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email address"
                          value={contactInfo.email}
                          onChange={handleContactInfoChange}
                        />
                        <button
                          type="button"
                          onClick={sendEmailOtp}
                          disabled={!contactInfo.email || !contactInfo.email.includes('@') || loading.sendingEmailOtp}
                          className="send-otp-btn"
                        >
                          {loading.sendingEmailOtp ? 'Sending...' : otpSent.email ? 'Resend OTP' : 'Send OTP'}
                        </button>
                      </div>
                      
                      {otpSent.email && (
                        <div className="otp-input-group">
                          <input
                            type="text"
                            name="emailOtp"
                            placeholder="Enter 6-digit OTP"
                            value={otpData.emailOtp}
                            onChange={handleOtpChange}
                            maxLength="6"
                            pattern="[0-9]{6}"
                          />
                          <button
                            type="button"
                            onClick={verifyEmailOtp}
                            disabled={otpData.emailOtp.length !== 6 || loading.verifyingEmailOtp || otpData.emailVerified}
                            className="verify-otp-btn"
                          >
                            {loading.verifyingEmailOtp ? 'Verifying...' : otpData.emailVerified ? 'Verified ✓' : 'Verify'}
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="proceed-section">
                      <p className="proceed-info">
                        <strong>Mobile verification is required.</strong> Email verification is optional but recommended for better communication.
                      </p>
                      <button
                        type="button"
                        onClick={proceedToApplication}
                        disabled={!otpData.mobileVerified}
                        className="proceed-btn"
                      >
                        Proceed to Application Form
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="verified-header">
                    <FaCheck className="verified-icon" />
                    <h2>Online Application Form</h2>
                    <p>Please fill out the form below to complete your admission application.</p>
                  </div>
                  
                  <form className="admissions-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                      <label htmlFor="fullName">Full Name *</label>
                      <input 
                        type="text" 
                        id="fullName" 
                        name="fullName" 
                        value={formData.fullName} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="parentName">Parent/Guardian Name *</label>
                      <input 
                        type="text" 
                        id="parentName" 
                        name="parentName" 
                        value={formData.parentName} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="email">Email Address *</label>
                        <input 
                          type="email" 
                          id="email" 
                          name="email" 
                          value={formData.email} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="phone">Phone Number *</label>
                        <input 
                          type="tel" 
                          id="phone" 
                          name="phone" 
                          value={formData.phone} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="address">Address *</label>
                      <textarea 
                        id="address" 
                        name="address" 
                        value={formData.address} 
                        onChange={handleChange} 
                        required 
                      />
                    </div>
                    
                    <div className="form-row">
                      <div className="form-group">
                        <label htmlFor="grade">Applying for Grade *</label>
                        <select 
                          id="grade" 
                          name="grade" 
                          value={formData.grade} 
                          onChange={handleChange} 
                          required
                        >
                          <option value="">Select Grade</option>
                          <option value="NS">NS</option>
                          <option value="LKG">LKG</option>
                          <option value="UKG">UKG</option>
                          {[...Array(12)].map((_, i) => (
                            <option key={i} value={`${i+1}`}> {i+1}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="form-group">
                        <label htmlFor="previousSchool">Previous School (if any)</label>
                        <input 
                          type="text" 
                          id="previousSchool" 
                          name="previousSchool" 
                          value={formData.previousSchool} 
                          onChange={handleChange} 
                        />
                      </div>
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="documents">Upload Documents (Birth Certificate, Previous Marksheets)</label>
                      <div className="file-upload">
                        <input 
                          type="file" 
                          id="documents" 
                          name="documents" 
                          onChange={handleFileChange} 
                        />
                        <div className="upload-icon">
                          <FaUpload />
                        </div>
                        <span>Click to browse files</span>
                      </div>
                    </div>
                    
                    <div className="form-actions">
                      <button type="submit" className="submit-btn">Submit Application</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Admissions;