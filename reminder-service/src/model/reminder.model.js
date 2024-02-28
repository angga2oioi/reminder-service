// @ts-check
const {
  ANNUAL_REMINDER_REPEAT, QUARTERLY_REMINDER_REPEAT, MONTHLY_REMINDER_REPEAT, WEEKLY_REMINDER_REPEAT, DAILY_REMINDER_REPEAT,
  NONE_REMINDER_REPEAT,
  SENT_REMINDER_STATUS, PENDING_REMINDER_STATUS,
} = require('reminder-service-utils/constant');
const mongoose = require('../provider/mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId, String } = mongoose.Schema.Types;

const reminderSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      index: true,
    },
    repeat: {
      type: String,
      required: true,
      index: true,
      enum: {
        values: [
          ANNUAL_REMINDER_REPEAT, QUARTERLY_REMINDER_REPEAT, MONTHLY_REMINDER_REPEAT, WEEKLY_REMINDER_REPEAT, DAILY_REMINDER_REPEAT, NONE_REMINDER_REPEAT,
        ],
        message: '{VALUE} is not supported',
      },
    },
  },
  {
    timestamps: true,
  },
);

reminderSchema.index({ createdAt: 1 });
reminderSchema.index({ updatedAt: 1 });

// add plugin that converts mongoose to json
reminderSchema.plugin(toJSON);
reminderSchema.plugin(paginate);

const reminder = mongoose.model('reminder', reminderSchema);

module.exports = reminder;
