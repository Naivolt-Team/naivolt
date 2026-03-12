const BankAccount = require('../models/bankAccount.model');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const ACCOUNT_NUMBER_REGEX = /^\d{10}$/;
const MAX_BANK_ACCOUNTS = 1;

async function unsetOtherDefaults(userId, excludeId = null) {
  const query = { userId, isDefault: true };
  if (excludeId) query._id = { $ne: excludeId };
  await BankAccount.updateMany(query, { $set: { isDefault: false } });
}

exports.getBankAccounts = async (req, res) => {
  try {
    const accounts = await BankAccount.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    return successResponse(res, 200, 'Success', { data: accounts });
  } catch (err) {
    console.error('getBankAccounts error:', err);
    return errorResponse(res, 500, err.message || 'Failed to get bank accounts');
  }
};

exports.addBankAccount = async (req, res) => {
  try {
    const { bankName, accountNumber, accountName, bankCode } = req.body;

    if (!bankName || !accountNumber || !accountName) {
      return errorResponse(res, 400, 'bankName, accountNumber and accountName are required');
    }

    const trimmedNumber = String(accountNumber).trim();
    if (!ACCOUNT_NUMBER_REGEX.test(trimmedNumber)) {
      return errorResponse(res, 400, 'accountNumber must be exactly 10 digits');
    }

    const count = await BankAccount.countDocuments({ userId: req.user._id });
    if (count >= MAX_BANK_ACCOUNTS) {
      return errorResponse(res, 400, 'You can only add one bank account.');
    }

    const isFirst = count === 0;
    const isDefault = isFirst || (req.body.isDefault === true);

    if (isDefault) {
      await unsetOtherDefaults(req.user._id);
    }

    const account = await BankAccount.create({
      userId: req.user._id,
      bankName: String(bankName).trim(),
      accountNumber: trimmedNumber,
      accountName: String(accountName).trim(),
      bankCode: bankCode != null ? String(bankCode).trim() : undefined,
      isDefault,
    });

    return successResponse(res, 201, 'Bank account added', { data: account });
  } catch (err) {
    console.error('addBankAccount error:', err);
    if (err.name === 'ValidationError') {
      return errorResponse(res, 400, err.message || 'Validation failed');
    }
    return errorResponse(res, 500, err.message || 'Failed to add bank account');
  }
};

exports.updateBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await BankAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return errorResponse(res, 404, 'Bank account not found');
    }

    const { bankName, accountNumber, accountName, bankCode, isDefault } = req.body;
    if (bankName !== undefined) account.bankName = String(bankName).trim();
    if (accountNumber !== undefined) {
      const trimmed = String(accountNumber).trim();
      if (!ACCOUNT_NUMBER_REGEX.test(trimmed)) {
        return errorResponse(res, 400, 'accountNumber must be exactly 10 digits');
      }
      account.accountNumber = trimmed;
    }
    if (accountName !== undefined) account.accountName = String(accountName).trim();
    if (bankCode !== undefined) account.bankCode = String(bankCode).trim();

    if (isDefault === true) {
      await unsetOtherDefaults(req.user._id, account._id);
      account.isDefault = true;
    }

    await account.save();

    return successResponse(res, 200, 'Bank account updated', { data: account });
  } catch (err) {
    console.error('updateBankAccount error:', err);
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return errorResponse(res, 404, 'Bank account not found');
    }
    if (err.name === 'ValidationError') {
      return errorResponse(res, 400, err.message || 'Validation failed');
    }
    return errorResponse(res, 500, err.message || 'Failed to update bank account');
  }
};

exports.deleteBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await BankAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return errorResponse(res, 404, 'Bank account not found');
    }

    const wasDefault = account.isDefault;
    await BankAccount.findByIdAndDelete(accountId);

    if (wasDefault) {
      const next = await BankAccount.findOne({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .limit(1);
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return successResponse(res, 200, 'Bank account removed');
  } catch (err) {
    console.error('deleteBankAccount error:', err);
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return errorResponse(res, 404, 'Bank account not found');
    }
    return errorResponse(res, 500, err.message || 'Failed to remove bank account');
  }
};

exports.setDefaultBankAccount = async (req, res) => {
  try {
    const { accountId } = req.params;
    const account = await BankAccount.findOne({ _id: accountId, userId: req.user._id });
    if (!account) {
      return errorResponse(res, 404, 'Bank account not found');
    }

    await unsetOtherDefaults(req.user._id, account._id);
    account.isDefault = true;
    await account.save();

    return successResponse(res, 200, 'Default bank account updated', { data: account });
  } catch (err) {
    console.error('setDefaultBankAccount error:', err);
    if (err.name === 'CastError' && err.kind === 'ObjectId') {
      return errorResponse(res, 404, 'Bank account not found');
    }
    return errorResponse(res, 500, err.message || 'Failed to set default bank account');
  }
};
