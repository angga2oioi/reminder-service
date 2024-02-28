// @ts-check
const { Validator } = require('node-input-validator');
const { HttpError, sanitizeObject } = require('reminder-service-utils/functions');
const { BAD_REQUEST_ERR_CODE } = require('reminder-service-utils/constant');
const { UserProfiles } = require('../model');

exports.createUser = async (params) => {
  const v = new Validator(params, {
    firstName: 'required',
    lastName: 'required',
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
    location: {
      country: params?.location?.country,
      city: params?.location?.city,
      timezone: params?.location?.timezone,
    },
  };
  const raw = await UserProfiles.create(sanitizeObject(payload));
  // submit create birthday reminder here
  return raw?.toJSON();
};
