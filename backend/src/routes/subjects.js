const express = require('express');
const router = express.Router();
const { Subject, Faculty } = require('../models');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Helper function to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// GET /api/subjects - Get all subjects with filtering and pagination
router.get('/', 
  authenticateToken,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('department').optional().isString(),
    query('class').optional().isString(),
    query('category').optional().isString(),
    query('status').optional().isIn(['active', 'inactive']),
    query('search').optional().isString()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 10,
        department,
        class: className,
        category,
        status,
        search
      } = req.query;

      // Build filter object
      const filter = {};
      
      if (department) filter.department = department;
      if (className) filter['applicableClasses.class'] = className;
      if (category) filter.category = category;
      if (status) filter.isActive = status === 'active';
      
      if (search) {
        filter.$or = [
          { subjectName: { $regex: search, $options: 'i' } },
          { subjectCode: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const skip = (page - 1) * limit;
      
      const subjects = await Subject.find(filter)
        .populate('assignedFaculty.faculty', 'user employeeId designation')
        .populate('prerequisites', 'subjectName subjectCode')
        .populate('corequisites', 'subjectName subjectCode')
        .populate('createdBy', 'firstName lastName')
        .populate('lastModifiedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Subject.countDocuments(filter);

      // Calculate statistics
      const stats = await Subject.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalSubjects: { $sum: 1 },
            activeSubjects: { $sum: { $cond: ['$isActive', 1, 0] } },
            approvedSubjects: { $sum: { $cond: [{ $eq: ['$approvalStatus', 'Approved'] }, 1, 0] } },
            totalCredits: { $sum: '$credits' },
            avgCredits: { $avg: '$credits' }
          }
        }
      ]);

      res.json({
        success: true,
        data: {
          subjects,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalItems: total,
            itemsPerPage: parseInt(limit)
          },
          statistics: stats[0] || {
            totalSubjects: 0,
            activeSubjects: 0,
            approvedSubjects: 0,
            totalCredits: 0,
            avgCredits: 0
          }
        }
      });
    } catch (error) {
      console.error('Error fetching subjects:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subjects',
        error: error.message
      });
    }
  }
);

// GET /api/subjects/:id - Get subject by ID
router.get('/:id',
  authenticateToken,
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id)
        .populate('assignedFaculty.faculty', 'user employeeId designation department')
        .populate('prerequisites', 'subjectName subjectCode department')
        .populate('corequisites', 'subjectName subjectCode department')
        .populate('createdBy', 'firstName lastName email')
        .populate('lastModifiedBy', 'firstName lastName email');

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      res.json({
        success: true,
        data: subject
      });
    } catch (error) {
      console.error('Error fetching subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch subject',
        error: error.message
      });
    }
  }
);

// POST /api/subjects - Create new subject
router.post('/',
  authenticateToken,
  requireRole(['admin', 'principal']),
  [
    body('subjectCode').notEmpty().matches(/^[A-Z]{2,4}\d{3}$/).withMessage('Subject code must be in format like MATH101'),
    body('subjectName').notEmpty().isLength({ max: 100 }),
    body('department').notEmpty().isIn([
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
      'Physics', 'Chemistry', 'Biology', 'Computer Science',
      'Physical Education', 'Arts', 'Music', 'Languages',
      'Commerce', 'Economics', 'Geography', 'History'
    ]),
    body('category').notEmpty().isIn(['Core', 'Elective', 'Optional', 'Extra-curricular', 'Vocational']),
    body('credits').isInt({ min: 1, max: 10 }),
    body('totalHours').isInt({ min: 1 }),
    body('theoryHours').optional().isInt({ min: 0 }),
    body('practicalHours').optional().isInt({ min: 0 }),
    body('applicableClasses').isArray({ min: 1 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      // Check if subject code already exists
      const existingSubject = await Subject.findOne({ subjectCode: req.body.subjectCode });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Subject code already exists'
        });
      }

      const subjectData = {
        ...req.body,
        createdBy: req.user.id,
        theoryHours: req.body.theoryHours || 0,
        practicalHours: req.body.practicalHours || 0
      };

      const subject = new Subject(subjectData);
      await subject.save();

      const populatedSubject = await Subject.findById(subject._id)
        .populate('createdBy', 'firstName lastName');

      res.status(201).json({
        success: true,
        message: 'Subject created successfully',
        data: populatedSubject
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create subject',
        error: error.message
      });
    }
  }
);

// PUT /api/subjects/:id - Update subject
router.put('/:id',
  authenticateToken,
  requireRole(['admin', 'principal']),
  [
    param('id').isMongoId(),
    body('subjectName').optional().isLength({ max: 100 }),
    body('department').optional().isIn([
      'Mathematics', 'Science', 'English', 'Hindi', 'Social Studies',
      'Physics', 'Chemistry', 'Biology', 'Computer Science',
      'Physical Education', 'Arts', 'Music', 'Languages',
      'Commerce', 'Economics', 'Geography', 'History'
    ]),
    body('category').optional().isIn(['Core', 'Elective', 'Optional', 'Extra-curricular', 'Vocational']),
    body('credits').optional().isInt({ min: 1, max: 10 }),
    body('totalHours').optional().isInt({ min: 1 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      // Update fields
      Object.keys(req.body).forEach(key => {
        if (key !== 'subjectCode') { // Prevent changing subject code
          subject[key] = req.body[key];
        }
      });

      subject.lastModifiedBy = req.user.id;
      subject.version += 1;

      await subject.save();

      const updatedSubject = await Subject.findById(subject._id)
        .populate('assignedFaculty.faculty', 'user employeeId designation')
        .populate('lastModifiedBy', 'firstName lastName');

      res.json({
        success: true,
        message: 'Subject updated successfully',
        data: updatedSubject
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update subject',
        error: error.message
      });
    }
  }
);

// DELETE /api/subjects/:id - Delete subject (soft delete)
router.delete('/:id',
  authenticateToken,
  requireRole(['admin', 'principal']),
  [param('id').isMongoId()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      subject.isActive = false;
      subject.lastModifiedBy = req.user.id;
      await subject.save();

      res.json({
        success: true,
        message: 'Subject deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete subject',
        error: error.message
      });
    }
  }
);

// POST /api/subjects/:id/curriculum/units - Add curriculum unit
router.post('/:id/curriculum/units',
  authenticateToken,
  requireRole(['admin', 'principal', 'faculty']),
  [
    param('id').isMongoId(),
    body('unitNumber').isInt({ min: 1 }),
    body('unitTitle').notEmpty(),
    body('topics').isArray({ min: 1 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      await subject.addUnit(req.body);

      res.json({
        success: true,
        message: 'Curriculum unit added successfully',
        data: subject
      });
    } catch (error) {
      console.error('Error adding curriculum unit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add curriculum unit',
        error: error.message
      });
    }
  }
);

// POST /api/subjects/:id/faculty - Assign faculty to subject
router.post('/:id/faculty',
  authenticateToken,
  requireRole(['admin', 'principal']),
  [
    param('id').isMongoId(),
    body('facultyId').isMongoId(),
    body('role').isIn(['Primary', 'Assistant', 'Lab Instructor', 'Guest']),
    body('classes').isArray()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      const faculty = await Faculty.findById(req.body.facultyId);
      if (!faculty) {
        return res.status(404).json({
          success: false,
          message: 'Faculty not found'
        });
      }

      await subject.assignFaculty(req.body.facultyId, req.body.role, req.body.classes);

      const updatedSubject = await Subject.findById(subject._id)
        .populate('assignedFaculty.faculty', 'user employeeId designation');

      res.json({
        success: true,
        message: 'Faculty assigned successfully',
        data: updatedSubject
      });
    } catch (error) {
      console.error('Error assigning faculty:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to assign faculty',
        error: error.message
      });
    }
  }
);

// PUT /api/subjects/:id/approval - Update approval status
router.put('/:id/approval',
  authenticateToken,
  requireRole(['admin', 'principal']),
  [
    param('id').isMongoId(),
    body('status').isIn(['Draft', 'Pending', 'Approved', 'Rejected'])
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const subject = await Subject.findById(req.params.id);
      if (!subject) {
        return res.status(404).json({
          success: false,
          message: 'Subject not found'
        });
      }

      await subject.updateApprovalStatus(req.body.status, req.user.id);

      res.json({
        success: true,
        message: 'Approval status updated successfully',
        data: subject
      });
    } catch (error) {
      console.error('Error updating approval status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update approval status',
        error: error.message
      });
    }
  }
);

// GET /api/subjects/departments/stats - Get department-wise statistics
router.get('/departments/stats',
  authenticateToken,
  async (req, res) => {
    try {
      const stats = await Subject.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$department',
            totalSubjects: { $sum: 1 },
            totalCredits: { $sum: '$credits' },
            avgCredits: { $avg: '$credits' },
            categories: { $addToSet: '$category' }
          }
        },
        { $sort: { totalSubjects: -1 } }
      ]);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching department stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch department statistics',
        error: error.message
      });
    }
  }
);

module.exports = router;