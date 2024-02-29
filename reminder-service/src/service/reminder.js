const { Validator } = require('node-input-validator');
const { HttpError, sanitizeObject, parseSortBy } = require('reminder-service-utils/functions');
const {
  BAD_REQUEST_ERR_CODE, PENDING_REMINDER_STATUS, NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE, SERVICE_UNAVAILABLE_ERR_CODE, NONE_REMINDER_REPEAT, SENT_REMINDER_STATUS, ANNUAL_REMINDER_REPEAT, MONTHLY_REMINDER_REPEAT, WEEKLY_REMINDER_REPEAT, QUARTERLY_REMINDER_REPEAT, DAILY_REMINDER_REPEAT,
} = require('reminder-service-utils/constant');
const mongoose = require('mongoose');
const moment = require('moment');
const { findUserById } = require('../provider/auth.service');
const { Reminders, ScheduledReminders } = require('../model');
const { submitSendReminder } = require('../provider/rabbitmq.producer');
const { sendEmail } = require('../provider/mailer');

const { ObjectId } = mongoose.Types;

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

  const testReminder = await Reminders.findOne({
    user: new ObjectId(params?.user),
    title: params?.title,
  });

  if (testReminder) {
    throw HttpError(BAD_REQUEST_ERR_CODE, `${params?.title} already exists`);
  }

  const payload = {
    user: new ObjectId(params?.user),
    title: params?.title,
    message: params?.message,
    repeat: params?.repeat,
  };

  const raw = await Reminders.create(sanitizeObject(payload));

  await ScheduledReminders.create({
    reminder: new ObjectId(raw?._id?.toString()),
    schedule: new Date(params?.schedule),
  });

  return raw?.toJSON();
};

exports.findReminderById = async (id) => {
  const raw = await Reminders.findById(id);
  if (!raw) {
    return null;
  }
  return raw?.toJSON();
};

exports.findReminderByTitle = async (title, userId) => {
  const raw = await Reminders.findOne({
    title,
    user: new ObjectId(userId),
  });
  if (!raw) {
    return null;
  }
  return raw?.toJSON();
};

exports.updateReminder = async (id, params) => {
  const reminder = await this.findReminderById(id);
  if (!reminder) {
    throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
  }

  const v = new Validator(params, {
    title: 'required',
    message: 'required',
    repeat: 'required',
    schedule: 'required',
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

  // delete all pending reminder
  await ScheduledReminders.deleteMany({
    reminder: new ObjectId(reminder?.id),
    status: PENDING_REMINDER_STATUS,
  });

  const payload = {
    user: new ObjectId(params?.user),
    title: params?.title,
    message: params?.message,
    repeat: params?.repeat,
  };

  await Reminders.findByIdAndUpdate(reminder?.id, {
    $set: sanitizeObject(payload),
  });

  await ScheduledReminders.create({
    reminder: new ObjectId(reminder?.id),
    schedule: new Date(params?.schedule),
  });

  return this.findReminderById(id);
};

exports.removeReminderByUserId = async (userId) => {
  // delete all reminder from the same user

  const list = await Reminders.find({
    user: new ObjectId(userId),
  });

  await Promise.all(list?.map((n) => ScheduledReminders.deleteMany({
    reminder: new ObjectId(n?._id?.toString()),
  })));

  await Reminders.deleteMany({
    user: new ObjectId(userId),
  });

  return null;
};

exports.removeReminder = async (id) => {
  // delete all reminder from the same user with the same title
  const raw = await Reminders.findById(id);
  if (!raw) {
    throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
  }

  await Reminders.findByIdAndDelete(id);
  await ScheduledReminders.deleteMany({
    reminder: new ObjectId(id),
  });

  return null;
};

exports.processReminder = async () => {
  const allPendingReminder = await ScheduledReminders.find({
    status: PENDING_REMINDER_STATUS,
    schedule: {
      $lte: new Date(),
    },
  });

  allPendingReminder?.map((n) => submitSendReminder({
    scheduledReminderId: n?._id?.toString(),
  }));

  return null;
};

exports.sendReminder = async (id) => {
  const raw = await ScheduledReminders.findById(id);
  if (!raw) {
    throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
  }

  if (raw?.status !== PENDING_REMINDER_STATUS) {
    throw HttpError(SERVICE_UNAVAILABLE_ERR_CODE, 'already sent');
  }

  const reminder = await this.findReminderById(raw?.reminder?.toString());

  const user = await findUserById(reminder?.user?.toString());
  if (!user) {
    throw HttpError(NOT_FOUND_ERR_CODE, 'User not found');
  }

  let message = reminder?.message;

  Object.keys(user).forEach((k) => {
    message = message.replace(new RegExp(`{${k}}`, 'g'), user[k]);
  });

  await sendEmail({
    email: user?.email,
    message,
  });

  await ScheduledReminders.findByIdAndUpdate(raw?._id?.toString(), {
    $set: {
      status: SENT_REMINDER_STATUS,
    },
  });

  if (raw?.repeat === NONE_REMINDER_REPEAT) {
    return null;
  }

  await this.repeatReminder(raw?.toJSON(), reminder);

  return null;
};

exports.repeatReminder = async (scheduledReminder, reminder) => {
  let schedule = null;
  switch (reminder?.repeat) {
    case ANNUAL_REMINDER_REPEAT:
      schedule = moment(new Date(scheduledReminder?.schedule)).add(1, 'year').toDate();
      break;
    case QUARTERLY_REMINDER_REPEAT:
      schedule = moment(new Date(scheduledReminder?.schedule)).add(1, 'quarter').toDate();
      break;
    case MONTHLY_REMINDER_REPEAT:
      schedule = moment(new Date(scheduledReminder?.schedule)).add(1, 'month').toDate();
      break;
    case WEEKLY_REMINDER_REPEAT:
      schedule = moment(new Date(scheduledReminder?.schedule)).add(1, 'week').toDate();
      break;
    case DAILY_REMINDER_REPEAT:
      schedule = moment(new Date(scheduledReminder?.schedule)).add(1, 'day').toDate();
      break;
    default:
      schedule = null;
  }

  await ScheduledReminders.create({
    reminder: new ObjectId(reminder?.id),
    schedule,
  });

  return null;
};

const buildReminderSearchQuery = (params) => {
  const query = {};
  if (params?.search) {
    query.$or = [
      {
        title: {
          $regex: params?.search,
          $options: 'i',
        },
      },
      {
        title: {
          $regex: params?.message,
          $options: 'i',
        },
      },
    ];
  }

  if (params?.user) {
    query.user = new ObjectId(params?.user);
  }

  if (params?.repeat) {
    query.repeat = params?.repeat;
  }

  return query;
};

exports.paginateReminder = async (params, sortBy = 'createdAt:desc', limit = 10, page = 1) => {
  const query = buildReminderSearchQuery(params);
  const sort = parseSortBy(sortBy);

  const aggregate = Reminders.aggregate([
    {
      $match: query,
    },
    {
      $lookup: {
        from: 'scheduledreminders',
        let: {
          reminder: '$_id',
        },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  {
                    $eq: ['$reminder', '$$reminder'],
                  },
                  {
                    $eq: ['$status', PENDING_REMINDER_STATUS],
                  },
                ],
              },
            },
          },
        ],
        as: 'schedules',
      },
    },
    {
      $sort: sort,
    },
  ]);

  const options = { page, limit };

  const results = await Reminders.aggregatePaginate(aggregate, options);

  return {
    results: results.docs.map((n) => {
      const doc = {
        ...n,
        id: n?._id,
      };
      delete doc._id;
      return doc;
    }),
    page,
    totalResults: results.total,
    totalPages: results.pages,
  };
};

const buildScheduledReminderSearchQuery = (params) => {
  const query = {};

  if (params?.reminder) {
    query.reminder = new ObjectId(params?.reminder);
  }

  if (params?.status) {
    query.status = params?.status;
  }

  return query;
};

exports.paginateScheduledReminder = async (params, sortBy = 'createdAt:desc', limit = 10, page = 1) => {
  const query = buildScheduledReminderSearchQuery(params);

  const list = await ScheduledReminders.paginate(query, { sortBy, limit, page });
  list.results = list?.results?.map((n) => n?.toJSON());
  return list;
};
