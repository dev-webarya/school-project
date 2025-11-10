const express = require('express');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { generateToken, authenticateToken } = require('../middleware/auth');
const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login user (admin, faculty, student)
// @access  Public
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail({
      gmail_remove_dots: false,
      gmail_remove_subaddress: false,
      gmail_convert_googlemaildotcom: false
    })
    .withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['admin', 'faculty', 'student']).withMessage('Invalid role')
], async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const safeBody = { email: req.body?.email, role: req.body?.role };
      console.log('[Auth] Incoming login request:', safeBody);
    }
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;

    // Find user by email and role
    const user = await User.findOne({ email, role }).select('+password');
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Auth] Lookup by email+role:', { email, role, userFound: !!user });
    }
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Defensive: if password is missing on the user record, treat as invalid
    if (!user.password) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Auth] Missing password field on user record');
      }
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (user.isLocked) {
      return res.status(401).json({
        success: false,
        message: 'Account is temporarily locked due to too many failed login attempts'
      });
    }

    // Check password with defensive error handling
    let isPasswordValid = false;
    try {
      isPasswordValid = await user.comparePassword(password);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[Auth] Password compare result:', { email, role, ok: isPasswordValid });
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[Auth] Password compare error:', err?.message || err);
      }
      isPasswordValid = false;
    }
    if (!isPasswordValid) {
      // Increment login attempts
      await user.incLoginAttempts();
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Reset login attempts on successful login
    await user.resetLoginAttempts();
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    const responseData = {
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: userResponse,
        role: user.role
      }
    };
    
    console.log('Login response structure:', JSON.stringify(responseData, null, 2));
    res.json(responseData);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public (for students) / Private (for admin creating faculty)
router.post('/register', [
  body('firstName').trim().isLength({ min: 2 }).withMessage('First name must be at least 2 characters'),
  body('lastName').trim().isLength({ min: 2 }).withMessage('Last name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
  body('phone').matches(/^[0-9]{10}$/).withMessage('Please provide a valid 10-digit phone number'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'faculty']).withMessage('Invalid role')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, phone, password, role, dateOfBirth, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { phone }] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email or phone already exists'
      });
    }

    // Create new user
    const userData = {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      status: role === 'student' ? 'active' : 'pending' // Students are active by default, faculty needs admin approval
    };

    // Add optional fields if provided
    if (dateOfBirth) userData.dateOfBirth = dateOfBirth;
    if (gender) userData.gender = gender;

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: role === 'student' ? 'Registration successful' : 'Registration successful. Awaiting admin approval.',
      data: {
        user: userResponse
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // In a more sophisticated implementation, you might want to blacklist the token
    // For now, we'll just return success as the client will remove the token
    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/auth/forgot-password
// @desc    Send password reset OTP to email
// @access  Public
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Please provide a valid email')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Do not reveal that the email doesn't exist
      return res.json({ success: true, message: 'If an account exists, an OTP has been sent' });
    }

    // Generate 6-digit OTP and store hashed version
    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const crypto = require('crypto');
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    user.resetPasswordToken = hashedOtp;
    user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send OTP email
    try {
      const emailService = require('../services/emailService');
      const result = await emailService.sendOTP(email, otp, 'password-reset');

      const response = { success: true, message: 'Password reset OTP sent successfully' };
      if (process.env.NODE_ENV !== 'production' && result?.preview) {
        response.preview = result.preview;
      }
      return res.json(response);
    } catch (err) {
      console.error('Error sending password reset OTP:', err);
      // Still respond success to avoid leaking info, OTP is logged by service fallback
      return res.json({ success: true, message: 'Password reset OTP sent successfully' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password with email + OTP
// @access  Public
router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('Invalid OTP'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: errors.array() });
    }

    const { email, otp, password } = req.body;
    const crypto = require('crypto');
    const hashedOtp = crypto.createHash('sha256').update(String(otp)).digest('hex');

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset request' });
    }

    if (user.resetPasswordExpires < new Date()) {
      return res.status(410).json({ success: false, message: 'OTP expired. Please request a new one.' });
    }

    if (user.resetPasswordToken !== hashedOtp) {
      return res.status(400).json({ success: false, message: 'Incorrect OTP' });
    }

    // Update password; will be hashed by pre-save hook
    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();

    return res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token and get current user
// @access  Private
router.get('/verify', authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: userResponse,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const userResponse = req.user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;