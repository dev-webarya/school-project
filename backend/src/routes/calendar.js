const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { AcademicCalendar } = require('../models');

// @route   GET /api/calendar
// @desc    Get all calendar events
// @access  Private
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { startDate, endDate, eventType, targetAudience } = req.query;
    
    let query = { isActive: true };
    
    // Filter by date range
    if (startDate && endDate) {
      query.$or = [
        {
          startDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          endDate: { $gte: new Date(startDate), $lte: new Date(endDate) }
        },
        {
          startDate: { $lte: new Date(startDate) },
          endDate: { $gte: new Date(endDate) }
        }
      ];
    }
    
    // Filter by event type
    if (eventType) {
      query.eventType = eventType;
    }
    
    // Filter by target audience based on user role
    if (targetAudience) {
      query.targetAudience = { $in: [targetAudience, 'All'] };
    } else {
      // Default filter based on user role
      const userRole = req.user.role;
      if (userRole === 'student') {
        query.targetAudience = { $in: ['Students', 'All'] };
      } else if (userRole === 'faculty') {
        query.targetAudience = { $in: ['Faculty', 'All'] };
      }
      // Admin can see all events
    }
    
    const events = await AcademicCalendar.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get calendar events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar events'
    });
  }
});

// @route   GET /api/calendar/:id
// @desc    Get single calendar event
// @access  Private
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const event = await AcademicCalendar.findById(req.params.id)
      .populate('createdBy', 'firstName lastName');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch calendar event'
    });
  }
});

// @route   POST /api/calendar
// @desc    Create new calendar event
// @access  Private (Admin only)
router.post('/', [
  authenticateToken,
  requireRole(['admin']),
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('eventType').isIn([
    'Holiday', 'Exam', 'Assignment Due', 'Parent Meeting', 'Sports Event',
    'Cultural Event', 'Academic Event', 'Administrative', 'Fee Due Date',
    'Admission', 'Result Declaration', 'Vacation'
  ]).withMessage('Invalid event type'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
  body('endDate').isISO8601().withMessage('Valid end date is required'),
  body('targetAudience').isArray().withMessage('Target audience must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const eventData = {
      ...req.body,
      createdBy: req.user.id
    };
    
    const event = new AcademicCalendar(eventData);
    await event.save();
    
    await event.populate('createdBy', 'firstName lastName');

    try {
      const { Notice } = require('../models');
      const start = new Date(event.startDate);
      const end = new Date(event.endDate);
      const dateRange = start.toLocaleDateString('en-IN') + (end && end.getTime() !== start.getTime() ? ` - ${end.toLocaleDateString('en-IN')}` : '');
      const audience = Array.isArray(event.targetAudience) ? event.targetAudience.join(', ') : 'All';
      await Notice.create({
        title: `Calendar: ${event.title}`,
        description: `${event.eventType} | ${dateRange}${event.location ? ` | ${event.location}` : ''} | Audience: ${audience}`,
        category: 'AcademicCalendar',
        effectiveDate: event.startDate,
        priority: (event.priority || 'Medium').toLowerCase(),
        isActive: true,
        createdBy: req.user.id
      });
    } catch (_) { void 0; }
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Create calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create calendar event'
    });
  }
});

// @route   PUT /api/calendar/:id
// @desc    Update calendar event
// @access  Private (Admin only)
router.put('/:id', [
  authenticateToken,
  requireRole(['admin']),
  body('title').optional().trim().isLength({ min: 1 }).withMessage('Title cannot be empty'),
  body('eventType').optional().isIn([
    'Holiday', 'Exam', 'Assignment Due', 'Parent Meeting', 'Sports Event',
    'Cultural Event', 'Academic Event', 'Administrative', 'Fee Due Date',
    'Admission', 'Result Declaration', 'Vacation'
  ]).withMessage('Invalid event type'),
  body('startDate').optional().isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional().isISO8601().withMessage('Valid end date is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const event = await AcademicCalendar.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    console.error('Update calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update calendar event'
    });
  }
});

// @route   DELETE /api/calendar/:id
// @desc    Delete calendar event
// @access  Private (Admin only)
router.delete('/:id', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const event = await AcademicCalendar.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete calendar event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete calendar event'
    });
  }
});

// @route   GET /api/calendar/upcoming/:days
// @desc    Get upcoming events for specified number of days
// @access  Private
router.get('/upcoming/:days', authenticateToken, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 7;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + days);
    
    let query = {
      isActive: true,
      startDate: { $gte: startDate, $lte: endDate }
    };
    
    // Filter by user role
    const userRole = req.user.role;
    if (userRole === 'student') {
      query.targetAudience = { $in: ['Students', 'All'] };
    } else if (userRole === 'faculty') {
      query.targetAudience = { $in: ['Faculty', 'All'] };
    }
    
    const events = await AcademicCalendar.find(query)
      .populate('createdBy', 'firstName lastName')
      .sort({ startDate: 1 })
      .limit(10);
    
    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events'
    });
  }
});

module.exports = router;