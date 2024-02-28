// @ts-check

require('dotenv').config();

const cron = require('node-cron');
const { submitProcessReminder } = require('./provider/rabbitmq.producer');

cron.schedule('*/15 * * * *', async () => {
  try {
    submitProcessReminder();
  } catch (e) {
    console.log(e);
  }
});
