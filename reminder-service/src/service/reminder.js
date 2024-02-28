const { Validator } = require('node-input-validator');
const { HttpError, sanitizeObject } = require('reminder-service-utils/functions');
const { BAD_REQUEST_ERR_CODE } = require('reminder-service-utils/constant');
const mongoose = require('mongoose');
const { findUserById } = require('../provider/auth.service');
const { Reminders } = require('../model');

const { ObjectId } = mongoose.Schema.Types;

exports.createReminder = async (params) => {
  const v = new Validator(params, {
    user: 'required',
    schedule: 'required',
    title: 'required',
    message: 'required',
    repeat: 'required',
  });

  const matched = await v.check();
  if (!matched) {
    throw HttpError(BAD_REQUEST_ERR_CODE, v.errors[Object.keys(v?.errors)[0]]?.message);
  }

  const user = await findUserById(params?.user);
  if (!user) {
    throw HttpError(BAD_REQUEST_ERR_CODE, 'user not found');
  }
  // if schedule is not a valid date
  if (isNaN(new Date(params?.schedule)?.getTime())) {
    throw HttpError(BAD_REQUEST_ERR_CODE, `${params?.schedule} is not a valid datetime`);
  }

  const payload = {
    user: new ObjectId(params?.user),
    schedule: new Date(params?.schedule),
    title: params?.title,
    message: params?.message,
    repeat: params?.repeat,
  };

  const raw = await Reminders.create(sanitizeObject(payload));

  return raw?.toJSON();
};
