// @ts-check
const {
  SENT_REMINDER_STATUS,
  PENDING_REMINDER_STATUS,
} = require('reminder-service-utils/constant');
const mongoose = require('../provider/mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId, String, Date } = mongoose.Schema.Types;

const scheduledReminderSchema = new mongoose.Schema(
  {
    reminder: {
      type: ObjectId,
      required: true,
      index: true,
    },
    schedule: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      index: true,
      enum: {
        values: [
          SENT_REMINDER_STATUS,
          PENDING_REMINDER_STATUS,
        ],
        message: '{VALUE} is not supported',
      },
      default: PENDING_REMINDER_STATUS,
    },
  },
  {
    timestamps: true,
  },
);

scheduledReminderSchema.index({ createdAt: 1 });
scheduledReminderSchema.index({ updatedAt: 1 });

// add plugin that converts mongoose to json
scheduledReminderSchema.plugin(toJSON);
scheduledReminderSchema.plugin(paginate);

const scheduledReminder = mongoose.model('scheduledReminder', scheduledReminderSchema);

module.exports = scheduledReminder;
