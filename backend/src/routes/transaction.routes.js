const express = require('express');
const { getMyTransactions, getTransactionById, submitTransaction } = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.get('/', protect, getMyTransactions);
router.get('/:id', protect, getTransactionById);
router.post('/', protect, upload.single('proofImage'), submitTransaction);

module.exports = router;
