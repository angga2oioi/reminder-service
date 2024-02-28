// @ts-check

const express = require('express');
const { DeleteReminder } = require('../../controller/v1/reminder');

const router = express.Router();

router.delete('/:id', DeleteReminder);

module.exports = router;
