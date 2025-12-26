import axios from 'axios';
import dotenv from 'dotenv';
import ActivityLog from '../models/ActivityLog.js';

// Ensure environment variables are loaded before reading Steadfast config
dotenv.config();

// Central Steadfast API client
// All courier calls must go through here

const STEADFAST_BASE_URL = process.env.STEADFAST_BASE_URL || 'https://portal.packzy.com/api/v1';
const STEADFAST_API_KEY = process.env.STEADFAST_API_KEY;
const STEADFAST_SECRET_KEY = process.env.STEADFAST_SECRET_KEY;

if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
  console.warn('[Steadfast] API keys are not configured. Courier features will be disabled.');
}

const instance = axios.create({
  baseURL: STEADFAST_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach auth headers for every request
instance.interceptors.request.use((config) => {
  if (STEADFAST_API_KEY && STEADFAST_SECRET_KEY) {
    config.headers['Api-Key'] = STEADFAST_API_KEY;
    config.headers['Secret-Key'] = STEADFAST_SECRET_KEY;
  }

  // Log request (minimal PII)
  ActivityLog.create({
    actorId: null,
    action: 'steadfast_request',
    entity: config.url,
    meta: {
      method: config.method,
      url: config.url,
      courier: 'steadfast',
      payloadPreview: config.data ? JSON.stringify(config.data).slice(0, 500) : null,
    },
  }).catch(() => { });

  return config;
});

// Centralized error handling
const handleError = async (error, context = {}) => {
  let message = 'Steadfast API error';
  let status = 500;
  let responseData = null;

  if (error.response) {
    status = error.response.status;
    responseData = error.response.data;
    message = error.response.data?.message || error.response.data?.error || message;
  } else if (error.request) {
    message = 'No response from Steadfast API';
  } else if (error.message) {
    message = error.message;
  }

  await ActivityLog.create({
    actorId: null,
    action: 'steadfast_error',
    entity: context.entity || 'steadfast',
    meta: {
      courier: 'steadfast',
      message,
      status,
      context,
      response: responseData,
    },
  }).catch(() => { });

  const err = new Error(message);
  err.statusCode = status;
  err.courierResponse = responseData;
  throw err;
};

// Utility: map Steadfast raw status to friendly internal status
// Based on Steadfast docs: https://docs.google.com/document/d/e/2PACX-1vTi0sTyR353xu1AK0nR8E_WKe5onCkUXGEf8ch8uoJy9qxGfgGnboSIkNosjQ0OOdXkJhgGuAsWxnIh/pub
export const mapSteadfastStatus = (raw) => {
  if (!raw) return 'pending';
  const status = String(raw).toLowerCase();

  if (['pending', 'in_review', 'unknown', 'hold'].includes(status)) return 'Pending';
  if (['delivered_approval_pending', 'partial_delivered_approval_pending'].includes(status)) return 'In Transit';
  if (['partial_delivered'].includes(status)) return 'Picked';
  if (['delivered'].includes(status)) return 'Delivered';
  if (['cancelled', 'cancelled_approval_pending'].includes(status)) return 'Cancelled';

  return 'Pending';
};

// Create order (single)
export const createSteadfastOrder = async (payload) => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    const err = new Error('Courier service not configured');
    err.statusCode = 503;
    throw err;
  }

  // Supporting new fields from latest docs
  const cleanedPayload = {
    invoice: payload.invoice,
    recipient_name: payload.recipient_name,
    recipient_phone: payload.recipient_phone,
    recipient_address: payload.recipient_address,
    cod_amount: payload.cod_amount,
    alternative_phone: payload.alternative_phone || null,
    recipient_email: payload.recipient_email || null,
    note: payload.note || null,
    item_description: payload.item_description || null,
    total_lot: payload.total_lot || 1,
    delivery_type: payload.delivery_type || 0,
  };

  try {
    const res = await instance.post('/create_order', cleanedPayload);
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_create_order' });
  }
};

// Bulk order create
export const bulkCreateSteadfastOrders = async (data) => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    const err = new Error('Courier service not configured');
    err.statusCode = 503;
    throw err;
  }

  try {
    const res = await instance.post('/create_order/bulk-order', { data });
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_bulk_create' });
  }
};

// Return Requests
export const createSteadfastReturnRequest = async (payload) => {
  try {
    const res = await instance.post('/create_return_request', payload);
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_create_return' });
  }
};

export const getSteadfastReturnRequests = async () => {
  try {
    const res = await instance.get('/get_return_requests');
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_get_returns' });
  }
};

export const getSteadfastReturnRequestDetails = async (id) => {
  try {
    const res = await instance.get(`/get_return_request/${id}`);
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_get_return_details', id });
  }
};

// Payments
export const getSteadfastPayments = async () => {
  try {
    const res = await instance.get('/payments');
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_get_payments' });
  }
};

export const getSteadfastPaymentDetails = async (payment_id) => {
  try {
    const res = await instance.get(`/payments/${payment_id}`);
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_get_payment_details', payment_id });
  }
};

// Get status by tracking code
export const getSteadfastStatusByTrackingCode = async (trackingCode) => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    const err = new Error('Courier service not configured');
    err.statusCode = 503;
    throw err;
  }

  try {
    const res = await instance.get(`/status_by_trackingcode/${encodeURIComponent(trackingCode)}`);
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_status_by_tracking', trackingCode });
  }
};

// Check current balance
export const getSteadfastBalance = async () => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    const err = new Error('Courier service not configured');
    err.statusCode = 503;
    throw err;
  }

  try {
    const res = await instance.get('/get_balance');
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_get_balance' });
  }
};

// Get Policestations (Destinations)
export const getSteadfastDestinations = async () => {
  if (!STEADFAST_API_KEY || !STEADFAST_SECRET_KEY) {
    const err = new Error('Courier service not configured');
    err.statusCode = 503;
    throw err;
  }

  try {
    const res = await instance.get('/police_stations');
    return res.data;
  } catch (error) {
    await handleError(error, { entity: 'steadfast_police_stations' });
  }
};

export default instance;


