const express = require('express');
const { getBanks, resolveAccount } = require('../controllers/banks.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', getBanks);
router.get('/resolve', protect, resolveAccount);

module.exports = router;
