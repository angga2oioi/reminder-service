const express = require('express');

const router = express.Router();

router.use('/reminders', require('./reminder'));

module.exports = router;
