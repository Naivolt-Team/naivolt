const express = require('express');
const { getRate } = require('../controllers/rate.controller');

const router = express.Router();

router.get('/', getRate);

module.exports = router;
