// @ts-check

const express = require('express');
const {
  UserCreate, UserUpdate, UserRemove, UserPaginateReminder, UserCreateReminder,
} = require('../../controller/v1/user');

const router = express.Router();

router.post('/', UserCreate);
router.put('/:id', UserUpdate);
router.delete('/:id', UserRemove);
router.get('/:id/reminders', UserPaginateReminder);
router.post('/:id/reminders', UserCreateReminder);

module.exports = router;
