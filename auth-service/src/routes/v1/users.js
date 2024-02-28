// @ts-check

const express = require('express');
const { UserCreate, UserUpdate, UserRemove } = require('../../controller/v1/user');

const router = express.Router();

router.post('/', UserCreate);
router.put('/:id', UserUpdate);
router.delete('/:id', UserRemove);

module.exports = router;
