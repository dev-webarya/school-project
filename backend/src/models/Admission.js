const mongoose = require('mongoose');

const admissionSchema = new mongoose.Schema({
  // Application Information
  applicationNumber: {
    type: String,
    required: [true, 'Application number is required'],
    unique: true,
    trim: true,
    uppercase: true
  },
  
  // Student Information
  studentInfo: {
    fullName: {
      type: String,
      required: [true, 'Student full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters']
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required']
    },
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: ['male', 'female', 'other']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    nationality: {
      type: String,
      default: 'Indian',
      trim: true
    },
    religion: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['General', 'OBC', 'SC', 'ST', 'Other'],
      default: 'General'
    }
  },
  
  // Academic Information
  academicInfo: {
    applyingForClass: {
      type: String,
      required: [true, 'Applying class is required'],
      enum: ['Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    },
    preferredSection: {
      type: String,
      trim: true,
      uppercase: true
    },
    academicYear: {
      type: String,
      required: [true, 'Academic year is required'],
      match: [/^\d{4}-\d{4}$/, 'Academic year must be in format YYYY-YYYY']
    },
    previousSchool: {
      name: { type: String, trim: true },
      address: { type: String, trim: true },
      lastClassAttended: { type: String, trim: true },
      reasonForLeaving: { type: String, trim: true },
      tcNumber: { type: String, trim: true },
      tcDate: { type: Date }
    },
    previousAcademicRecord: {
      lastExamPercentage: { type: Number, min: 0, max: 100 },
      subjects: [{ type: String, trim: true }],
      achievements: [{ type: String, trim: true }]
    }
  },
  
  // Contact Information
  contactInfo: {
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    alternatePhone: {
      type: String,
      trim: true,
      match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },
    address: {
      street: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { 
        type: String, 
        required: true,
        trim: true,
        match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit pincode']
      },
      country: { type: String, trim: true, default: 'India' }
    }
  },
  
  // Parent/Guardian Information
  parentInfo: {
    father: {
      name: { type: String, required: true, trim: true },
      occupation: { type: String, trim: true },
      designation: { type: String, trim: true },
      organization: { type: String, trim: true },
      phone: { 
        type: String, 
        required: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
      },
      email: { 
        type: String, 
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      annualIncome: { type: Number, min: 0 },
      qualification: { type: String, trim: true }
    },
    mother: {
      name: { type: String, required: true, trim: true },
      occupation: { type: String, trim: true },
      designation: { type: String, trim: true },
      organization: { type: String, trim: true },
      phone: { 
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
      },
      email: { 
        type: String, 
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      qualification: { type: String, trim: true }
    },
    guardian: {
      name: { type: String, trim: true },
      relationship: { type: String, trim: true },
      phone: { 
        type: String,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
      },
      email: { 
        type: String, 
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      occupation: { type: String, trim: true }
    }
  },
  
  // Fee and Payment Information
  feeInfo: {
    admissionFee: {
      type: Number,
      required: [true, 'Admission fee is required'],
      min: 0,
      default: 5000
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: ['online', 'bank_transfer', 'demand_draft', 'cash']
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending'
    },
    paymentDetails: {
      transactionId: { type: String, trim: true },
      paymentDate: { type: Date },
      bankName: { type: String, trim: true },
      ddNumber: { type: String, trim: true },
      ddDate: { type: Date },
      receiptNumber: { type: String, trim: true }
    }
  },
  
  // Documents Submitted
  documents: {
    birthCertificate: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    },
    transferCertificate: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    },
    marksheet: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    },
    photograph: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    },
    aadharCard: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    },
    casteCertificate: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    },
    incomeCertificate: { 
      uploaded: { type: Boolean, default: false },
      fileName: { type: String, trim: true },
      filePath: { type: String, trim: true }
    }
  },
  
  // Application Status and Processing
  status: {
    type: String,
    enum: ['submitted', 'under_review', 'approved', 'rejected', 'waitlisted', 'admitted'],
    default: 'submitted'
  },
  priority: {
    type: String,
    enum: ['high', 'medium', 'low'],
    default: 'medium'
  },
  
  // Interview and Assessment
  interview: {
    scheduled: { type: Boolean, default: false },
    date: { type: Date },
    time: { type: String },
    interviewer: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    feedback: { type: String, trim: true },
    rating: { type: Number, min: 1, max: 10 }
  },
  
  // Entrance Test (if applicable)
  entranceTest: {
    required: { type: Boolean, default: false },
    scheduled: { type: Boolean, default: false },
    date: { type: Date },
    time: { type: String },
    venue: { type: String, trim: true },
    score: { type: Number, min: 0, max: 100 },
    passed: { type: Boolean, default: false }
  },
  
  // Processing Information
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  processedDate: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  },
  
  // Communication Log
  communications: [{
    date: { type: Date, default: Date.now },
    type: { 
      type: String, 
      enum: ['email', 'sms', 'call', 'letter', 'meeting'],
      required: true 
    },
    subject: { type: String, trim: true },
    message: { type: String, trim: true },
    sentBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    status: { 
      type: String, 
      enum: ['sent', 'delivered', 'read', 'replied'],
      default: 'sent' 
    }
  }],
  
  // Additional Information
  specialRequirements: {
    type: String,
    trim: true
  },
  medicalConditions: [{
    condition: { type: String, trim: true },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    medication: { type: String, trim: true }
  }],
  
  // Sibling Information
  siblings: [{
    name: { type: String, trim: true },
    class: { type: String, trim: true },
    rollNumber: { type: String, trim: true },
    relationship: { type: String, trim: true }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for student age
admissionSchema.virtual('studentAge').get(function() {
  if (!this.studentInfo.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.studentInfo.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for documents completion percentage
admissionSchema.virtual('documentsCompletionPercentage').get(function() {
  const docs = this.documents;
  const totalDocs = Object.keys(docs).length;
  const uploadedDocs = Object.values(docs).filter(doc => doc.uploaded).length;
  return Math.round((uploadedDocs / totalDocs) * 100);
});

// Indexes for better query performance
// Removed explicit applicationNumber index to avoid duplication with unique: true on field
admissionSchema.index({ status: 1 });
admissionSchema.index({ 'academicInfo.academicYear': 1 });
admissionSchema.index({ 'academicInfo.applyingForClass': 1 });
admissionSchema.index({ 'contactInfo.email': 1 });
admissionSchema.index({ 'contactInfo.phone': 1 });
admissionSchema.index({ createdAt: -1 });
admissionSchema.index({ priority: 1, status: 1 });

// Pre-save middleware to generate application number
admissionSchema.pre('save', async function(next) {
  if (this.isNew && !this.applicationNumber) {
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      const count = await this.constructor.countDocuments({
        createdAt: {
          $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
        }
      });
      this.applicationNumber = `ADM${year}${month}${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      return next(error);
    }
  }
  next();
});

// Static method to find applications by status
admissionSchema.statics.findByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

// Static method to find applications by class
admissionSchema.statics.findByClass = function(className) {
  return this.find({ 
    'academicInfo.applyingForClass': className 
  }).sort({ createdAt: -1 });
};

// Static method to find applications by academic year
admissionSchema.statics.findByAcademicYear = function(year) {
  return this.find({ 
    'academicInfo.academicYear': year 
  }).sort({ createdAt: -1 });
};

// Instance method to update status
admissionSchema.methods.updateStatus = function(newStatus, processedBy, remarks) {
  this.status = newStatus;
  this.processedBy = processedBy;
  this.processedDate = new Date();
  if (remarks) this.remarks = remarks;
  return this.save();
};

// Instance method to add communication log
admissionSchema.methods.addCommunication = function(type, subject, message, sentBy) {
  this.communications.push({
    type,
    subject,
    message,
    sentBy
  });
  return this.save();
};

// Instance method to check if all required documents are uploaded
admissionSchema.methods.areRequiredDocumentsUploaded = function() {
  const requiredDocs = ['birthCertificate', 'photograph'];
  if (this.academicInfo.applyingForClass !== 'Nursery' && 
      this.academicInfo.applyingForClass !== 'LKG' && 
      this.academicInfo.applyingForClass !== 'UKG') {
    requiredDocs.push('marksheet');
  }
  
  return requiredDocs.every(doc => this.documents[doc] && this.documents[doc].uploaded);
};

module.exports = mongoose.model('Admission', admissionSchema);