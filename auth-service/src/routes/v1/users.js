// @ts-check

const express = require('express');
const { UserCreate } = require('../../controller/v1/user');

const router = express.Router();

router.post('/', UserCreate);

module.exports = router;
