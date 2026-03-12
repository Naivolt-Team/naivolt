const express = require('express');
const { protect } = require('../middleware/auth.middleware');
const {
  getBankAccounts,
  addBankAccount,
  updateBankAccount,
  deleteBankAccount,
  setDefaultBankAccount,
} = require('../controllers/bankAccount.controller');

const router = express.Router();

router.get('/', protect, getBankAccounts);
router.post('/', protect, addBankAccount);
router.patch('/:accountId/set-default', protect, setDefaultBankAccount);
router.patch('/:accountId', protect, updateBankAccount);
router.delete('/:accountId', protect, deleteBankAccount);

module.exports = router;
