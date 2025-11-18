const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  category: { type: String, default: 'General', trim: true },
  effectiveDate: { type: Date, default: () => new Date() },
  priority: { type: String, enum: ['low', 'normal', 'high', 'critical'], default: 'normal' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

noticeSchema.index({ effectiveDate: 1 });
noticeSchema.index({ category: 1 });
noticeSchema.index({ isActive: 1 });

module.exports = mongoose.model('Notice', noticeSchema);