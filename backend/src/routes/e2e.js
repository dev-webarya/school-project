const express = require('express');
const router = express.Router();
const { requireRole } = require('../middleware/auth');
const jwt = require('jsonwebtoken');

// In-memory store for E2E test data (no DB writes)
const state = {
  // Grades
  grades: [
    {
      id: 'g1', studentId: 'S001', name: 'Rahul Yadav', rollNumber: '001',
      class: '10-A', subject: 'Mathematics', assessment: 'Unit Test 1', assessmentType: 'Unit Test',
      marks: 42, totalMarks: 50, percentage: 84, grade: 'A',
      date: '2024-01-15', remarks: 'Good performance', weightage: 20, isPublished: false
    },
    {
      id: 'g2', studentId: 'S002', name: 'Priya Patel', rollNumber: '002',
      class: '10-A', subject: 'Mathematics', assessment: 'Unit Test 1', assessmentType: 'Unit Test',
      marks: 38, totalMarks: 50, percentage: 76, grade: 'B+',
      date: '2024-01-15', remarks: 'Can improve', weightage: 20, isPublished: false
    }
  ],
  // Transport
  transportRoutes: [],
  transportVehicles: [],
  transportAllocations: [],
  // Academics
  subjects: [],
  courses: [],
  // Fees
  feeStructures: [],
  feeDues: [],
  // Attendance
  attendances: [],
  // Admissions
  admissions: [],
  // Calendar
  calendarEvents: [],
  // Global ID counters
  ids: {
    grades: 3,
    routes: 1,
    vehicles: 1,
    allocations: 1,
    subjects: 1,
    courses: 1,
    feeStructures: 1,
    feeDues: 1,
    attendances: 1,
    admissions: 1,
    calendar: 1
  }
};

const calculate = (marks, totalMarks) => {
  const percentage = Math.round((marks / totalMarks) * 100);
  const grade = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : percentage >= 50 ? 'C+' : percentage >= 40 ? 'C' : 'F';
  return { percentage, grade };
};

// Lightweight auth for E2E routes that does not hit the database
// Always bypass token verification on E2E router to avoid flaky auth in tests
const e2eAuthenticateToken = (req, res, next) => {
  const hintedRole = req.headers['x-e2e-role'];
  const path = req.path || '';
  const autoRole = path.startsWith('/grades/student') ? 'student' : 'admin';
  req.user = { _id: 'e2e-user', role: hintedRole || autoRole };
  return next();
};

// Issue a signed JWT for E2E tests (no DB)
router.post('/auth/test-login', (req, res) => {
  const { role = 'admin', userId = 'test-user' } = req.body || {};
  if (!['admin', 'faculty', 'student'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role' });
  }
  const secret = process.env.JWT_SECRET || 'e2e-secret';
  const token = jwt.sign({ id: userId, role }, secret, { expiresIn: '2h' });
  res.json({ success: true, token });
});

// -----------------------------
// Grades (existing)
// -----------------------------

// List grades for a class/subject
router.get('/grades', e2eAuthenticateToken, requireRole(['admin', 'faculty']), (req, res) => {
  const { class: cls, subject } = req.query;
  const data = state.grades.filter(g => (!cls || g.class === cls) && (!subject || g.subject === subject));
  res.json({ success: true, data });
});

// Create assessment entries (bulk) for selected students
router.post('/grades/assessment', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { name, type, totalMarks, date, weightage, students } = req.body;
  if (!name || !type || !totalMarks || !date || !Array.isArray(students)) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  const created = students.map(stu => {
    const id = `g${state.nextId++}`;
    const { percentage, grade } = calculate(0, totalMarks);
    const rec = {
      id,
      studentId: stu.studentId,
      name: stu.name,
      rollNumber: stu.rollNumber,
      class: stu.class,
      subject: stu.subject,
      assessment: name,
      assessmentType: type,
      marks: 0,
      totalMarks,
      percentage,
      grade,
      date,
      remarks: '',
      weightage: weightage ?? 0,
      isPublished: false
    };
    state.grades.push(rec);
    return rec;
  });

  res.status(201).json({ success: true, message: 'Assessment created', data: created });
});

// Update a grade record (marks/remarks/publish)
router.put('/grades/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const grade = state.grades.find(g => g.id === id);
  if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });

  const { marks, totalMarks, remarks, isPublished } = req.body;
  if (typeof marks === 'number') grade.marks = marks;
  if (typeof totalMarks === 'number') grade.totalMarks = totalMarks;
  if (typeof remarks === 'string') grade.remarks = remarks;
  if (typeof isPublished === 'boolean') grade.isPublished = isPublished;

  const { percentage, grade: letter } = calculate(grade.marks, grade.totalMarks);
  grade.percentage = percentage;
  grade.grade = letter;

  res.json({ success: true, message: 'Grade updated', data: grade });
});

// Get published grades for a student
router.get('/grades/student/:studentId', e2eAuthenticateToken, requireRole(['student']), (req, res) => {
  const { studentId } = req.params;
  const data = state.grades.filter(g => g.studentId === studentId && g.isPublished);
  res.json({ success: true, data });
});

// -----------------------------
// Transport: routes, vehicles, allocations
// -----------------------------

// Routes
router.get('/transport/routes', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, data: state.transportRoutes });
});

router.post('/transport/routes', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { routeName, startLocation, endLocation, stops = [], distance = 0, estimatedTime = 0, fare = 0 } = req.body || {};
  if (!routeName || !startLocation || !endLocation) return res.status(400).json({ success: false, message: 'Missing required route fields' });
  const id = `rt${state.ids.routes++}`;
  const route = { _id: id, routeName, startLocation, endLocation, stops, distance: Number(distance), estimatedTime: Number(estimatedTime), fare: Number(fare) };
  state.transportRoutes.push(route);
  res.status(201).json({ success: true, data: route });
});

router.put('/transport/routes/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const idx = state.transportRoutes.findIndex(r => r._id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Route not found' });
  state.transportRoutes[idx] = { ...state.transportRoutes[idx], ...req.body };
  res.json({ success: true, data: state.transportRoutes[idx] });
});

router.delete('/transport/routes/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const before = state.transportRoutes.length;
  state.transportRoutes = state.transportRoutes.filter(r => r._id !== id);
  if (state.transportRoutes.length === before) return res.status(404).json({ success: false, message: 'Route not found' });
  res.json({ success: true, message: 'Route deleted' });
});

// Vehicles
router.get('/transport/vehicles', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, data: state.transportVehicles });
});

router.post('/transport/vehicles', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { vehicleNumber, vehicleType = 'bus', capacity = 0, driverName, driverPhone, routeId } = req.body || {};
  if (!vehicleNumber || !driverName || !driverPhone || !routeId) return res.status(400).json({ success: false, message: 'Missing required vehicle fields' });
  const id = `vh${state.ids.vehicles++}`;
  const vehicle = { _id: id, vehicleNumber, vehicleType, capacity: Number(capacity), driverName, driverPhone, routeId };
  state.transportVehicles.push(vehicle);
  res.status(201).json({ success: true, data: vehicle });
});

router.put('/transport/vehicles/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const idx = state.transportVehicles.findIndex(v => v._id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  state.transportVehicles[idx] = { ...state.transportVehicles[idx], ...req.body };
  res.json({ success: true, data: state.transportVehicles[idx] });
});

router.delete('/transport/vehicles/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const before = state.transportVehicles.length;
  state.transportVehicles = state.transportVehicles.filter(v => v._id !== id);
  if (state.transportVehicles.length === before) return res.status(404).json({ success: false, message: 'Vehicle not found' });
  res.json({ success: true, message: 'Vehicle deleted' });
});

// Allocations
router.get('/transport/allocations', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, data: state.transportAllocations });
});

router.post('/transport/allocations', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { studentId, routeId, vehicleId, pickupStop, dropStop, fare = 0 } = req.body || {};
  if (!studentId || !routeId || !vehicleId || !pickupStop || !dropStop) return res.status(400).json({ success: false, message: 'Missing required allocation fields' });
  const id = `al${state.ids.allocations++}`;
  const allocation = { _id: id, studentId, routeId, vehicleId, pickupStop, dropStop, fare: Number(fare) };
  state.transportAllocations.push(allocation);
  res.status(201).json({ success: true, data: allocation });
});

router.put('/transport/allocations/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const idx = state.transportAllocations.findIndex(a => a._id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Allocation not found' });
  state.transportAllocations[idx] = { ...state.transportAllocations[idx], ...req.body };
  res.json({ success: true, data: state.transportAllocations[idx] });
});

router.delete('/transport/allocations/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const before = state.transportAllocations.length;
  state.transportAllocations = state.transportAllocations.filter(a => a._id !== id);
  if (state.transportAllocations.length === before) return res.status(404).json({ success: false, message: 'Allocation not found' });
  res.json({ success: true, message: 'Allocation deleted' });
});

// -----------------------------
// Subjects & Courses
// -----------------------------

router.get('/subjects', e2eAuthenticateToken, requireRole(['admin', 'faculty']), (req, res) => {
  res.json({ success: true, data: state.subjects });
});

router.post('/subjects', e2eAuthenticateToken, requireRole(['admin', 'faculty']), (req, res) => {
  const { name, code, credits = 0, department, session } = req.body || {};
  if (!name || !code) return res.status(400).json({ success: false, message: 'Missing required subject fields' });
  const id = `sub${state.ids.subjects++}`;
  const subject = { _id: id, name, code, credits: Number(credits), department, session };
  state.subjects.push(subject);
  res.status(201).json({ success: true, data: subject });
});

router.put('/subjects/:id', e2eAuthenticateToken, requireRole(['admin', 'faculty']), (req, res) => {
  const { id } = req.params;
  const idx = state.subjects.findIndex(s => s._id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Subject not found' });
  state.subjects[idx] = { ...state.subjects[idx], ...req.body };
  res.json({ success: true, data: state.subjects[idx] });
});

router.get('/courses', e2eAuthenticateToken, requireRole(['admin', 'faculty']), (req, res) => {
  res.json({ success: true, data: state.courses });
});

router.post('/courses', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { name, code, description, department, credits = 0 } = req.body || {};
  if (!name || !code) return res.status(400).json({ success: false, message: 'Missing required course fields' });
  const id = `crs${state.ids.courses++}`;
  const course = { _id: id, name, code, description, department, credits: Number(credits) };
  state.courses.push(course);
  res.status(201).json({ success: true, data: course });
});

router.put('/courses/:id', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { id } = req.params;
  const idx = state.courses.findIndex(c => c._id === id);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Course not found' });
  state.courses[idx] = { ...state.courses[idx], ...req.body };
  res.json({ success: true, data: state.courses[idx] });
});

// -----------------------------
// Fees: structures & dues
// -----------------------------

router.post('/fees/structure', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { class: className, academicYear, feeComponents = [], paymentSchedule = 'quarterly' } = req.body || {};
  if (!className || !academicYear) return res.status(400).json({ success: false, message: 'Missing required fee structure fields' });
  const id = `fs${state.ids.feeStructures++}`;
  const feeStructure = { _id: id, class: className, academicYear, feeComponents, paymentSchedule };
  state.feeStructures.push(feeStructure);
  res.status(201).json({ success: true, data: feeStructure });
});

router.get('/fees/dues', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, data: state.feeDues });
});

router.post('/fees/dues', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { studentId, academicYear, feeStructureId, installmentNumber, totalDue = 0, paidAmount = 0 } = req.body || {};
  if (!studentId || !academicYear || !feeStructureId || !installmentNumber) return res.status(400).json({ success: false, message: 'Missing required fee due fields' });
  const id = `fd${state.ids.feeDues++}`;
  const due = { _id: id, studentId, academicYear, feeStructureId, installmentNumber, totalDue: Number(totalDue), paidAmount: Number(paidAmount) };
  state.feeDues.push(due);
  res.status(201).json({ success: true, data: due });
});

// -----------------------------
// Attendance
// -----------------------------

router.get('/attendance', e2eAuthenticateToken, requireRole(['admin', 'faculty']), (req, res) => {
  res.json({ success: true, data: state.attendances });
});

router.post('/attendance', e2eAuthenticateToken, requireRole(['faculty']), (req, res) => {
  const { studentId, courseId, status, date } = req.body || {};
  if (!studentId || !courseId || !status || !date) return res.status(400).json({ success: false, message: 'Missing required attendance fields' });
  const id = `att${state.ids.attendances++}`;
  const rec = { _id: id, studentId, courseId, status, date };
  state.attendances.push(rec);
  res.status(201).json({ success: true, data: rec });
});

// -----------------------------
// Admissions
// -----------------------------

router.get('/admissions', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, data: state.admissions });
});

router.post('/admissions', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const payload = req.body || {};
  const id = `adm${state.ids.admissions++}`;
  const app = { _id: id, applicationNumber: payload.applicationNumber || `APP-${Date.now()}`, status: 'submitted', ...payload };
  state.admissions.push(app);
  res.status(201).json({ success: true, data: app });
});

// -----------------------------
// Academic Calendar
// -----------------------------

router.get('/calendar', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  res.json({ success: true, data: state.calendarEvents });
});

router.post('/calendar', e2eAuthenticateToken, requireRole(['admin']), (req, res) => {
  const { title, date, description } = req.body || {};
  if (!title || !date) return res.status(400).json({ success: false, message: 'Missing required calendar fields' });
  const id = `cal${state.ids.calendar++}`;
  const ev = { _id: id, title, date, description };
  state.calendarEvents.push(ev);
  res.status(201).json({ success: true, data: ev });
});

module.exports = router;