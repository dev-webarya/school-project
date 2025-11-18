import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaGraduationCap, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { authAPI } from '../../services/api';
import { useNotification } from '../../hooks/useNotification';
import config from '../../config/config.js';
import './StudentLogin.css';

const StudentLogin = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1);
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();
  const { showError, showSuccess } = useNotification();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) {
      clearError();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      const result = await login({
        email: loginData.email,
        password: loginData.password,
        role: 'student'
      });

      if (result.success) {
        // Successful login - redirect to original path or dashboard
        const from = location.state?.from?.pathname || '/student/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      // Display error to user
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      showError(errorMessage);
    } finally {
      setIsLogging(false);
    }
    
    setIsLogging(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotToggle = (e) => {
    e.preventDefault();
    clearError?.();
    setForgotMode((prev) => !prev);
    setResetStep(1);
    setResetEmail('');
    setResetOtp('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      return showError('Please enter your email');
    }
    try {
      setIsLogging(true);
      const resp = await authAPI.forgotPassword({ email: resetEmail });
      const message = resp?.data?.message || 'OTP sent to your email';
      showSuccess(message);
      if (resp?.data?.preview) {
        showSuccess(`Dev email preview: ${resp.data.preview}`);
        try { window.open(resp.data.preview, '_blank', 'noopener,noreferrer'); } catch (e) { console.log('Preview open failed'); }
      }
      if (resp?.data?.debugOtp) {
        showSuccess(`Dev OTP: ${resp.data.debugOtp}`);
      }
      setResetStep(2);
    } catch (err) {
      showError(err.userMessage || err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLogging(false);
    }
  };

  const handleSubmitReset = async (e) => {
    e.preventDefault();
    if (!resetOtp || resetOtp.length !== 6) {
      return showError('Please enter the 6-digit OTP');
    }
    if (!newPassword || newPassword.length < 6) {
      return showError('Password must be at least 6 characters');
    }
    if (newPassword !== confirmPassword) {
      return showError('Passwords do not match');
    }
    try {
      setIsLogging(true);
      const resp = await authAPI.resetPassword({ email: resetEmail, otp: resetOtp, password: newPassword });
      showSuccess(resp?.data?.message || 'Password reset successful');
      setForgotMode(false);
      setResetStep(1);
      // Optionally auto-fill email back in login form
      setLoginData((d) => ({ ...d, email: resetEmail }));
    } catch (err) {
      showError(err.userMessage || err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <main className="student-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <FaGraduationCap />
            </div>
            <h2>Student Login</h2>
            <p>Enter your credentials to access the student dashboard</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label htmlFor="email">
                <FaUser className="input-icon" />
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={loginData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                <FaLock className="input-icon" />
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={loginData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={togglePasswordVisibility}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="login-btn"
              disabled={isLogging}
            >
              {isLogging ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="login-actions">
            <button type="button" onClick={handleForgotToggle} className="forgot-password-link" aria-label={forgotMode ? 'Back to Login' : 'Forgot password?'}>
              {forgotMode ? 'Back to Login' : 'Forgot password?'}
            </button>
          </div>

          {forgotMode && (
            <div className="forgot-password-card">
              <h4>Reset your password</h4>
              {resetStep === 1 && (
                <form onSubmit={handleRequestReset} className="forgot-form">
                  <div className="input-group">
                    <label htmlFor="resetEmail">Email</label>
                    <div className="input-with-icon">
                      <FaUser className="input-icon" />
                      <input
                        type="email"
                        id="resetEmail"
                        name="resetEmail"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Enter your registered email"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="login-btn" disabled={isLogging}>
                    {isLogging ? 'Sending OTP...' : 'Send OTP'}
                  </button>
                </form>
              )}

              {resetStep === 2 && (
                <form onSubmit={handleSubmitReset} className="forgot-form">
                  <div className="input-group">
                    <label htmlFor="resetOtp">OTP</label>
                    <div className="input-with-icon">
                      <FaLock className="input-icon" />
                      <input
                        type="text"
                        id="resetOtp"
                        name="resetOtp"
                        value={resetOtp}
                        onChange={(e) => setResetOtp(e.target.value)}
                        placeholder="Enter 6-digit OTP"
                        required
                      />
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="newPassword">New Password</label>
                    <div className="input-with-icon">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        name="newPassword"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password"
                        required
                      />
                      <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                  <div className="input-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <div className="input-with-icon">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter new password"
                        required
                      />
                    </div>
                  </div>
                  <button type="submit" className="login-btn" disabled={isLogging}>
                    {isLogging ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Demo credentials removed for production */}
        </div>
      </div>
    </main>
  );
};

export default StudentLogin;
