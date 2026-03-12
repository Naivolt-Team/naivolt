const mongoose = require('mongoose');

const bankAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    accountName: {
      type: String,
      required: true,
      trim: true,
    },
    bankCode: {
      type: String,
      trim: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, versionKey: false }
);

bankAccountSchema.index({ userId: 1 });

const BankAccount = mongoose.model('BankAccount', bankAccountSchema);
module.exports = BankAccount;
