const { Validator } = require('node-input-validator');
const { BAD_REQUEST_ERR_CODE } = require('reminder-service-utils/constant');
const { HttpError } = require('reminder-service-utils/functions');
const axios = require('axios');

exports.sendEmail = async (params) => {
  const v = new Validator(params, {
    email: 'required',
    message: 'required',
  });

  const matched = await v.check();
  if (!matched) {
    throw HttpError(BAD_REQUEST_ERR_CODE, v.errors[Object.keys(v?.errors)[0]]?.message);
  }

  const payload = {
    email: params?.email,
    message: params?.message,
  };
  const { data } = await axios.post('https://email-service.digitalenvision.com.au/send-email', payload);
  return data;
};
