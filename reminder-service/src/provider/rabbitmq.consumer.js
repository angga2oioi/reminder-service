#!/usr/bin/env node
// @ts-check

const amqp = require('amqplib/callback_api');
const {
  CREATE_REMINDER_MQ_QUEUE,
  UPDATE_REMINDER_MQ_QUEUE,
  REMOVE_REMINDER_MQ_QUEUE,
  PROCESS_REMINDER_MQ_QUEUE,
  SEND_REMINDER_MQ_QUEUE,
} = require('reminder-service-utils/constant');
const {
  createReminder, updateReminder, removeReminder, sendReminder,
} = require('../service/reminder');

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

  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    channel.prefetch(3);
    channel.assertQueue(
      UPDATE_REMINDER_MQ_QUEUE,
      {
        durable: false,
      },
    );

    console.log(
      ' [*] Waiting for messages in %s',
      UPDATE_REMINDER_MQ_QUEUE,
    );
    channel.consume(
      UPDATE_REMINDER_MQ_QUEUE,
      async (msg) => {
        try {
          console.log(
            'new messages in %s',
            UPDATE_REMINDER_MQ_QUEUE,
          );

          const params = JSON.parse(msg.content.toString());
          await updateReminder(params);
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

  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    channel.prefetch(3);
    channel.assertQueue(
      REMOVE_REMINDER_MQ_QUEUE,
      {
        durable: false,
      },
    );

    console.log(
      ' [*] Waiting for messages in %s',
      REMOVE_REMINDER_MQ_QUEUE,
    );
    channel.consume(
      REMOVE_REMINDER_MQ_QUEUE,
      async (msg) => {
        try {
          console.log(
            'new messages in %s',
            REMOVE_REMINDER_MQ_QUEUE,
          );

          const { userId } = JSON.parse(msg.content.toString());
          await removeReminder(userId);
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

  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    channel.prefetch(3);
    channel.assertQueue(
      PROCESS_REMINDER_MQ_QUEUE,
      {
        durable: false,
      },
    );

    console.log(
      ' [*] Waiting for messages in %s',
      PROCESS_REMINDER_MQ_QUEUE,
    );
    channel.consume(
      PROCESS_REMINDER_MQ_QUEUE,
      async (msg) => {
        try {
          console.log(
            'new messages in %s',
            PROCESS_REMINDER_MQ_QUEUE,
          );
          await removeReminder();
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
  connection.createChannel((err, channel) => {
    if (err) {
      throw err;
    }

    channel.prefetch(3);
    channel.assertQueue(
      SEND_REMINDER_MQ_QUEUE,
      {
        durable: false,
      },
    );

    console.log(
      ' [*] Waiting for messages in %s',
      SEND_REMINDER_MQ_QUEUE,
    );
    channel.consume(
      SEND_REMINDER_MQ_QUEUE,
      async (msg) => {
        try {
          console.log(
            'new messages in %s',
            SEND_REMINDER_MQ_QUEUE,
          );
          const { reminderId } = JSON.parse(msg.content.toString());
          await sendReminder(reminderId);
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
