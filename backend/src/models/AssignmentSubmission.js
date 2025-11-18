const mongoose = require('mongoose');

const assignmentSubmissionSchema = new mongoose.Schema({
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  content: { type: String, trim: true },
  attachments: [{ url: String, name: String }],
  submittedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

assignmentSubmissionSchema.index({ assignment: 1, student: 1 }, { unique: true });

assignmentSubmissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AssignmentSubmission', assignmentSubmissionSchema);