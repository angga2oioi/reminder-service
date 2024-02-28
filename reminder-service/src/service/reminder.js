const { Validator } = require('node-input-validator');
const { HttpError, sanitizeObject } = require('reminder-service-utils/functions');
const {
  BAD_REQUEST_ERR_CODE, PENDING_REMINDER_STATUS, NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE, SERVICE_UNAVAILABLE_ERR_CODE, NONE_REMINDER_REPEAT, SENT_REMINDER_STATUS, ANNUAL_REMINDER_REPEAT, MONTHLY_REMINDER_REPEAT, WEEKLY_REMINDER_REPEAT, QUARTERLY_REMINDER_REPEAT, DAILY_REMINDER_REPEAT,
} = require('reminder-service-utils/constant');
const mongoose = require('mongoose');
const { findUserById } = require('../provider/auth.service');
const { Reminders } = require('../model');
const { submitSendReminder } = require('../provider/rabbitmq.producer');
const { sendEmail } = require('../provider/mailer');

const { ObjectId } = mongoose.Schema.Types;
const moment = require('moment');

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

exports.updateReminder = async (params) => {
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

  // delete all pending reminder with the same title from the same user
  await Reminders.deleteMany({
    user: new ObjectId(params?.user),
    title: params?.title,
    status: PENDING_REMINDER_STATUS,
  });

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

exports.removeReminder = async (userId) => {
  // delete all reminder from the same user
  await Reminders.deleteMany({
    user: new ObjectId(userId),
  });

  return null;
};

exports.processReminder = async () => {
  const allPendingReminder = await Reminders.find({
    status: PENDING_REMINDER_STATUS,
    schedule: {
      $lte: new Date(),
    },
  });

  allPendingReminder?.map((n) => submitSendReminder({
    reminderId: n?._id?.toString(),
  }));

  return null;
};

exports.sendReminder = async (id) => {
  const raw = await Reminders.findById(id);
  if (!raw) {
    throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
  }

  if (raw?.status !== PENDING_REMINDER_STATUS) {
    throw HttpError(SERVICE_UNAVAILABLE_ERR_CODE, 'already sent');
  }

  const user = await findUserById(raw?.user?.toString());
  if (!user) {
    throw HttpError(NOT_FOUND_ERR_CODE, 'User not found');
  }

  let message = raw?.message;

  Object.keys(user).forEach((k) => {
    message = message.replace(new RegExp(`{${k}}`, 'g'), user[k]);
  });

  await sendEmail({
    email: user?.email,
    message,
  });

  await Reminders.findByIdAndUpdate(raw?._id?.toString(), {
    $set: {
      status: SENT_REMINDER_STATUS,
    },
  });

  if (raw?.repeat === NONE_REMINDER_REPEAT) {
    return null;
  }

  await this.repeatReminder(raw?.toJSON());

  return null;
};

exports.repeatReminder = async (reminder) => {
  let schedule = null;
  switch (reminder?.repeat) {
    case ANNUAL_REMINDER_REPEAT:
      schedule = moment(new Date()).add(1, 'year').toDate();
      break;
    case QUARTERLY_REMINDER_REPEAT:
      schedule = moment(new Date()).add(1, 'quarter').toDate();
      break;
    case MONTHLY_REMINDER_REPEAT:
      schedule = moment(new Date()).add(1, 'month').toDate();
      break;
    case WEEKLY_REMINDER_REPEAT:
      schedule = moment(new Date()).add(1, 'week').toDate();
      break;
    case DAILY_REMINDER_REPEAT:
      schedule = moment(new Date()).add(1, 'day').toDate();
      break;
    default:
      schedule = null;
  }

  const payload = {
    user: reminder?.user?.toString(),
    schedule,
    title: reminder?.title,
    message: reminder?.message,
    repeat: reminder?.repeat,
  };
  await this.createReminder(payload);

  return null;
};
