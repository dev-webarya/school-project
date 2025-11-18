import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaChalkboardTeacher, FaUser, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { authAPI } from '../../services/api.js';
import config from '../../config/config.js';
import './FacultyLogin.css';

const FacultyLogin = () => {
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: request OTP, 2: submit OTP + new password
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { login, error, clearError } = useAuth();
  const { showNotification } = useNotification();

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
        role: 'faculty'
      });

      if (result.success) {
        // Successful login - redirect to original path or dashboard
        const from = location.state?.from?.pathname || '/faculty/dashboard';
        navigate(from, { replace: true });
      }
    } catch (err) {
      console.error('Login error:', err);
      // Display error to user
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      showNotification(errorMessage, 'error');
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
    setIsLogging(true);
    try {
      const resp = await authAPI.forgotPassword({ email: resetEmail });
      const data = resp?.data;
      if (data?.success) {
        showNotification('OTP sent to your email. Check inbox/spam.', 'info');
        if (data?.preview) {
          showNotification(`Dev email preview: ${data.preview}`, 'info');
          try { window.open(data.preview, '_blank', 'noopener,noreferrer'); } catch (e) { console.log('Preview open failed'); }
        }
        if (data?.debugOtp) {
          showNotification(`Dev OTP: ${data.debugOtp}`, 'info');
        }
        setResetStep(2);
      } else {
        showNotification(data?.message || 'Failed to send OTP. Try again.', 'error');
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      showNotification(err.userMessage || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setIsLogging(false);
    }
  };

  const handleSubmitReset = async (e) => {
    e.preventDefault();
    clearError?.();

    if (newPassword !== confirmPassword) {
      showNotification('Passwords do not match.', 'error');
      return;
    }

    setIsLogging(true);
    try {
      const resp = await authAPI.resetPassword({
        email: resetEmail,
        otp: resetOtp,
        password: newPassword
      });
      const data = resp?.data;
      if (data?.success) {
        showNotification('Password reset successful. You can now log in.', 'success');
        setForgotMode(false);
        setResetStep(1);
        setResetEmail('');
        setResetOtp('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showNotification(data?.message || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      console.error('Reset password error:', err);
      showNotification(err.userMessage || 'Failed to reset password. Please try again.', 'error');
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <main className="faculty-login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">
              <FaChalkboardTeacher />
            </div>
            <h2>Faculty Login</h2>
            <p>Enter your credentials to access the faculty dashboard</p>
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

export default FacultyLogin;
