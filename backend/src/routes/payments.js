const express = require('express');
const router = express.Router();
const { createPaymentIntent, capturePayment } = require('../services/paymentService');
const { FeeStructure, FeePayment } = require('../models/Fee');
const Student = require('../models/Student');

// Create payment intent for fee payment
router.post('/create', async (req, res) => {
  try {
    const { amount, currency, description, metadata } = req.body || {};
    const intent = await createPaymentIntent({ amount, currency, description, metadata });
    res.status(201).json({ success: true, intent, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// Capture payment after successful confirmation
router.post('/capture', async (req, res) => {
  try {
    const { paymentId, orderId, signature, studentId, studentName, class: className, amount } = req.body || {};
    const result = await capturePayment({ paymentId, orderId, signature });

    let record = null;
    if (studentId && className && amount) {
      const stu = await Student.findOne({ studentId: String(studentId).toUpperCase() });
      if (stu) {
        const currentYear = new Date().getFullYear();
        const yearFilter = `${currentYear}-${currentYear + 1}`;
        const mappedClass = className === 'NS' ? 'Nursery' : String(className);
        let fs = await FeeStructure.findOne({ class: mappedClass, academicYear: yearFilter, isActive: true }).sort({ createdAt: -1 });
        if (!fs) {
          fs = await FeeStructure.create({
            class: mappedClass,
            academicYear: yearFilter,
            feeComponents: { tuitionFee: Number(amount) },
            paymentSchedule: 'yearly',
            isActive: true,
            createdBy: stu.user
          });
        }
        const pay = new FeePayment({
          student: stu._id,
          feeStructure: fs._id,
          paymentDetails: {
            amount: Number(amount),
            paymentMethod: 'online',
            transactionId: paymentId,
            paymentDate: new Date()
          },
          feeBreakdown: {},
          academicYear: fs.academicYear,
          installmentNumber: 1,
          processedBy: stu.user,
          status: 'completed'
        });
        record = await pay.save();
        await record.populate([{ path: 'feeStructure', select: 'class academicYear' }]);
      }
    }

    res.status(200).json({ success: true, payment: result, record });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

module.exports = router;
