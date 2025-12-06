const Razorpay = require('razorpay');
const crypto = require('crypto');

function ensureKeys() {
  const hasKeys = !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET;
  const isDevLike = process.env.NODE_ENV !== 'production' || process.env.E2E_MODE === 'true';
  if (!hasKeys && !isDevLike) {
    const error = new Error('Missing Razorpay configuration');
    error.statusCode = 500;
    throw error;
  }
  return hasKeys;
}

function getInstance() {
  const hasKeys = ensureKeys();
  if (!hasKeys) return null;
  return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
}

async function createPaymentIntent({ amount, currency = 'INR', description, metadata = {} }) {
  if (!amount || amount <= 0) {
    const error = new Error('Invalid amount');
    error.statusCode = 400;
    throw error;
  }
  const inst = getInstance();
  if (!inst) {
    const mockId = 'order_mock_' + Math.random().toString(36).slice(2);
    return {
      id: mockId,
      amount: Math.round(Number(amount) * 100),
      currency,
      status: 'created',
      description: description || 'Fee Payment',
      metadata,
      order: { id: mockId, amount: Math.round(Number(amount) * 100), currency, status: 'created' }
    };
  }
  const order = await inst.orders.create({
    amount: Math.round(Number(amount) * 100),
    currency,
    receipt: metadata.receipt || `receipt_${Date.now()}`,
    notes: metadata,
    payment_capture: 1
  });
  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    status: order.status,
    description: description || 'Fee Payment',
    metadata,
    order
  };
}

async function capturePayment({ paymentId, orderId, signature }) {
  if (!paymentId || !orderId || !signature) {
    const error = new Error('paymentId, orderId and signature are required');
    error.statusCode = 400;
    throw error;
  }
  const hasKeys = ensureKeys();
  if (!hasKeys) {
    return { id: paymentId || 'mock_payment', status: 'succeeded' };
  }
  const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
  hmac.update(`${orderId}|${paymentId}`);
  const digest = hmac.digest('hex');
  if (digest !== signature) {
    const error = new Error('Signature verification failed');
    error.statusCode = 400;
    throw error;
  }
  return { id: paymentId, status: 'succeeded' };
}

module.exports = { createPaymentIntent, capturePayment };
