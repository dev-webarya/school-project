const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  courseName: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  // Unique code for the course, required due to existing unique index in DB
  courseCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  class: { type: String, required: true, enum: ['NS','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'] },
  section: { type: String, trim: true, maxlength: 2, uppercase: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  schedule: {
    days: [{ type: String }],
    startTime: { type: String },
    endTime: { type: String }
  },
  description: { type: String, trim: true },
  maxStudents: { type: Number, default: 0 },
  enrolledStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Ensure unique index on courseCode
// Removed explicit index to avoid duplication with unique: true on field
courseSchema.index({ faculty: 1, class: 1, subject: 1 });
courseSchema.index({ class: 1, section: 1 });

// Generate a courseCode if not provided to avoid duplicate-key on nulls
courseSchema.pre('validate', function(next) {
  if (!this.courseCode) {
    const subj = (this.subject || 'GEN').toString().replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const cls = (this.class || 'X').toString().toUpperCase();
    const sec = (this.section || '').toString().toUpperCase();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.courseCode = `${subj}-${cls}${sec ? sec : ''}-${rand}`;
  }
  next();
});

courseSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Course', courseSchema);