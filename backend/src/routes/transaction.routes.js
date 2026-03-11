const express = require('express');
const { submitTransaction } = require('../controllers/transaction.controller');
const { protect } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');

const router = express.Router();

router.post('/', protect, upload.single('proofImage'), submitTransaction);

module.exports = router;
