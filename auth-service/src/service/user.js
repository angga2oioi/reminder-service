// @ts-check
const { Validator } = require('node-input-validator');
const { HttpError, sanitizeObject, sanitizeEmail } = require('reminder-service-utils/functions');
const {
  BAD_REQUEST_ERR_CODE, NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE, ANNUAL_REMINDER_REPEAT,
} = require('reminder-service-utils/constant');
const momentTz = require('moment-timezone');
const { UserProfiles } = require('../model');
const { submitCreateReminder, submitUpdateReminder, submitRemoveReminder } = require('../provider/rabbitmq.producer');

const createBirthdayReminderPayload = async (profile) => {
  const local9AM = momentTz(new Date(profile?.dob)).format('YYYY-MM-DDT00:09:00');

  const localDate = momentTz.tz(local9AM, profile?.location?.timezone);
  // Convert the date to UTC
  let utcDate = localDate.clone().tz('UTC').toDate();

  // if date has passed
  if (utcDate.getTime() < new Date().getTime()) {
    utcDate = localDate.clone().tz('UTC').add(1, 'year').toDate();
  }

  const payload = {
    user: profile?.id,
    schedule: utcDate.toISOString(),
    title: 'Birthday Message',
    message: `Hey, ${profile?.firstName} ${profile?.lastName} it's your birthday`,
    repeat: ANNUAL_REMINDER_REPEAT,
  };

  return sanitizeObject(payload);
};

exports.createUser = async (params) => {
  const v = new Validator(params, {
    firstName: 'required',
    lastName: 'required',
    email: 'required',
    dob: 'required|date',
    location: 'required',
    'location.country': 'required',
    'location.city': 'required',
    'location.timezone': 'required',
  });

  const matched = await v.check();
  if (!matched) {
    throw HttpError(BAD_REQUEST_ERR_CODE, v.errors[Object.keys(v?.errors)[0]]?.message);
  }

  // check if timezone is valid
  if (!momentTz.tz.zone(params?.location?.timezone)) {
    throw HttpError(BAD_REQUEST_ERR_CODE, `Invalid timezone ${params?.location?.timezone}`);
  }

  const payload = {
    firstName: params?.firstName,
    lastName: params?.lastName,
    dob: new Date(params?.dob),
    email: sanitizeEmail(params?.email),
    location: {
      country: params?.location?.country,
      city: params?.location?.city,
      timezone: params?.location?.timezone,
    },
  };

  let session = null;

  try {
    session = await UserProfiles.startSession();
    session.startTransaction();

    const raw = await UserProfiles.create(sanitizeObject(payload));
    const profile = raw?.toJSON();

    const reminder = createBirthdayReminderPayload(profile);
    await session.commitTransaction();

    submitCreateReminder(reminder);

    return profile;
  } catch (e) {
    if (session) {
      session.abortTransaction();
    }
    throw e;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

exports.findUserById = async (id) => {
  const raw = await UserProfiles.findById(id);
  if (!raw) {
    return null;
  }

  return raw?.toJSON();
};

exports.updateUser = async (id, params) => {
  const profile = await this.findUserById(id);
  if (!profile) {
    throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
  }

  const v = new Validator(params, {
    firstName: 'required',
    lastName: 'required',
    email: 'required',
    dob: 'required|date',
    location: 'required',
    'location.country': 'required',
    'location.city': 'required',
    'location.timezone': 'required',
  });

  const matched = await v.check();
  if (!matched) {
    throw HttpError(BAD_REQUEST_ERR_CODE, v.errors[Object.keys(v?.errors)[0]]?.message);
  }

  const payload = {
    firstName: params?.firstName,
    lastName: params?.lastName,
    dob: new Date(params?.dob),
    email: sanitizeEmail(params?.email),
    location: {
      country: params?.location?.country,
      city: params?.location?.city,
      timezone: params?.location?.timezone,
    },
  };

  let session = null;

  try {
    session = await UserProfiles.startSession();
    session.startTransaction();

    await UserProfiles.findByIdAndUpdate(profile?.id, {
      $set: sanitizeObject(payload),
    });

    const updatedProfile = await this.findUserById(id);
    if (!updatedProfile) {
      throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
    }

    const reminder = createBirthdayReminderPayload(updatedProfile);
    await session.commitTransaction();

    submitUpdateReminder(reminder);

    return updatedProfile;
  } catch (e) {
    if (session) {
      session.abortTransaction();
    }
    throw e;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
};

exports.removeUser = async (id) => {
  const profile = await this.findUserById(id);
  if (!profile) {
    throw HttpError(NOT_FOUND_ERR_CODE, NOT_FOUND_ERR_MESSAGE);
  }

  await UserProfiles.findByIdAndDelete(profile?.id);

  submitRemoveReminder({
    userId: profile?.id,
  });

  return null;
};
