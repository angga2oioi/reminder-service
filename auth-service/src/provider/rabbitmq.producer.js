#!/usr/bin/env node
// @ts-check

let channel;
const amqp = require('amqplib/callback_api');
const {
  CREATE_REMINDER_MQ_QUEUE,
  UPDATE_REMINDER_MQ_QUEUE,
  REMOVE_REMINDER_MQ_QUEUE,
  SERVICE_UNAVAILABLE_ERR_CODE,
  MQ_NOT_READY_ERR_MESSAGE,
} = require('reminder-service-utils/constant');
const { HttpError } = require('reminder-service-utils/functions');

amqp.connect(process.env.AMQP_HOST, (err, conn) => {
  if (err) {
    throw err;
  }
  conn.createChannel((error1, ch) => {
    if (error1) {
      throw error1;
    }

    channel = ch;
    channel.assertQueue(CREATE_REMINDER_MQ_QUEUE, {
      durable: false,
    });
    channel.assertQueue(UPDATE_REMINDER_MQ_QUEUE, {
      durable: false,
    });
    channel.assertQueue(REMOVE_REMINDER_MQ_QUEUE, {
      durable: false,
    });
  });
});

exports.submitCreateReminder = (payload = {}) => {
  const msg = JSON.stringify({ ...payload, ts: new Date().getTime() });
  if (!channel) {
    throw HttpError(SERVICE_UNAVAILABLE_ERR_CODE, MQ_NOT_READY_ERR_MESSAGE);
  }
  channel.sendToQueue(CREATE_REMINDER_MQ_QUEUE, Buffer.from(msg));
  console.log(' [x] Sent %s', CREATE_REMINDER_MQ_QUEUE);
  return null;
};

exports.submitUpdateReminder = (payload = {}) => {
  const msg = JSON.stringify({ ...payload, ts: new Date().getTime() });
  if (!channel) {
    throw HttpError(SERVICE_UNAVAILABLE_ERR_CODE, MQ_NOT_READY_ERR_MESSAGE);
  }
  channel.sendToQueue(UPDATE_REMINDER_MQ_QUEUE, Buffer.from(msg));
  console.log(' [x] Sent %s', UPDATE_REMINDER_MQ_QUEUE);
  return null;
};

exports.submitRemoveReminder = (payload = {}) => {
  const msg = JSON.stringify({ ...payload, ts: new Date().getTime() });
  if (!channel) {
    throw HttpError(SERVICE_UNAVAILABLE_ERR_CODE, MQ_NOT_READY_ERR_MESSAGE);
  }
  channel.sendToQueue(REMOVE_REMINDER_MQ_QUEUE, Buffer.from(msg));
  console.log(' [x] Sent %s', REMOVE_REMINDER_MQ_QUEUE);
  return null;
};
