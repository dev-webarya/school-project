const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  subject: { type: String, required: true, trim: true },
  class: { type: String, required: true, enum: ['NS','LKG','UKG','1','2','3','4','5','6','7','8','9','10','11','12'] },
  section: { type: String, trim: true, maxlength: 2, uppercase: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  dueDate: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Faculty', required: true },
  attachments: [{ url: String, name: String }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assignmentSchema.index({ class: 1, subject: 1, dueDate: 1 });
assignmentSchema.index({ createdBy: 1, dueDate: -1 });

assignmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Assignment', assignmentSchema);