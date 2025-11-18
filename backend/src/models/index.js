// Export all models for easy importing
const User = require('./User');
const Student = require('./Student');
const Faculty = require('./Faculty');
const Admission = require('./Admission');
const { FeeStructure, FeePayment, FeeDue } = require('./Fee');
const Course = require('./Course');
const Subject = require('./Subject');
const Attendance = require('./Attendance');
const Grade = require('./Grade');
const AcademicCalendar = require('./AcademicCalendar');
const Notice = require('./Notice');
const { Route, Vehicle, TransportAllocation } = require('./Transport');
const Schedule = require('./Schedule');
const FacultyAssignment = require('./FacultyAssignment');
const OnlineClass = require('./OnlineClass');

module.exports = {
  User,
  Student,
  Faculty,
  Admission,
  FeeStructure,
  FeePayment,
  FeeDue,
  Course,
  Subject,
  Attendance,
  Grade,
  AcademicCalendar,
  Notice,
  Route,
  Vehicle,
  TransportAllocation,
  Schedule,
  FacultyAssignment,
  OnlineClass
};