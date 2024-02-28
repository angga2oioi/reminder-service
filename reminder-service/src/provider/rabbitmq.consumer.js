#!/usr/bin/env node
// @ts-check

const amqp = require('amqplib/callback_api');
const {
  CREATE_REMINDER_MQ_QUEUE,
  PROCESS_REMINDER_MQ_QUEUE,
  SEND_REMINDER_MQ_QUEUE,
} = require('reminder-service-utils/constant');
const { createReminder } = require('../service/reminder');

amqp.connect(process.env.AMQP_HOST, (err, connection) => {
  if (err) {
    throw err;
  }

  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    channel.prefetch(3);
    channel.assertQueue(
      CREATE_REMINDER_MQ_QUEUE,
      {
        durable: false,
      },
    );

    console.log(
      ' [*] Waiting for messages in %s',
      CREATE_REMINDER_MQ_QUEUE,
    );
    channel.consume(
      CREATE_REMINDER_MQ_QUEUE,
      async (msg) => {
        try {
          console.log(
            'new messages in %s',
            CREATE_REMINDER_MQ_QUEUE,
          );

          const params = JSON.parse(msg.content.toString());
          await createReminder(params);
        } catch (e) {
          console.log(e);
        } finally {
          channel.ack(msg);
        }
      },
      {
        noAck: false,
      },
    );
  });
});
