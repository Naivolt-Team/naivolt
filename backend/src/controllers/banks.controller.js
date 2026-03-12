const https = require('https');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const PAYSTACK_LIST_URL = 'https://api.paystack.co/bank?country=nigeria';
const PAYSTACK_RESOLVE_URL = 'https://api.paystack.co/bank/resolve';

function fetchJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data || '{}'));
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Request timeout')); });
  });
}

exports.getBanks = async (req, res) => {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    const headers = {};
    if (secretKey) headers.Authorization = `Bearer ${secretKey}`;

    const result = await fetchJson(PAYSTACK_LIST_URL, headers);

    if (result.status && Array.isArray(result.data)) {
      const banks = result.data
        .filter((b) => b.name && b.code)
        .map((b) => ({ name: b.name, code: String(b.code) }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return successResponse(res, 200, 'Success', { data: banks });
    }

    const fallbackUrl = 'https://raw.githubusercontent.com/ichtrojan/nigerian-banks/master/banks.json';
    const fallback = await fetchJson(fallbackUrl).catch(() => null);
    if (Array.isArray(fallback)) {
      const banks = fallback
        .filter((b) => b.name && b.code)
        .map((b) => ({ name: b.name, code: String(b.code) }))
        .sort((a, b) => a.name.localeCompare(b.name));
      return successResponse(res, 200, 'Success', { data: banks });
    }

    return successResponse(res, 200, 'Success', { data: [] });
  } catch (err) {
    console.error('getBanks error:', err);
    return errorResponse(res, 500, err.message || 'Failed to load banks');
  }
};

exports.resolveAccount = async (req, res) => {
  try {
    const { account_number, bank_code } = req.query;
    if (!account_number || !bank_code) {
      return errorResponse(res, 400, 'account_number and bank_code are required');
    }
    const trimmed = String(account_number).trim();
    if (!/^\d{10}$/.test(trimmed)) {
      return errorResponse(res, 400, 'account_number must be exactly 10 digits');
    }

    const secretKey = process.env.PAYSTACK_SECRET_KEY;
    if (!secretKey) {
      return errorResponse(res, 503, 'Account resolution is not configured');
    }

    const url = `${PAYSTACK_RESOLVE_URL}?account_number=${encodeURIComponent(trimmed)}&bank_code=${encodeURIComponent(String(bank_code).trim())}`;
    const result = await fetchJson(url, { Authorization: `Bearer ${secretKey}` });

    if (result.status && result.data && result.data.account_name) {
      return successResponse(res, 200, 'Success', {
        data: { account_name: result.data.account_name },
      });
    }

    const message = result.message || 'Could not resolve account number';
    return errorResponse(res, 400, message);
  } catch (err) {
    console.error('resolveAccount error:', err);
    return errorResponse(res, 500, err.message || 'Failed to resolve account');
  }
};
