// @ts-check
const mongoose = require('../provider/mongoose');
const { toJSON, paginate } = require('./plugins');

const { ObjectId, String, Mixed } = mongoose.Schema.Types;

const Location = new mongoose.Schema({
  country: {
    type: String,
    required: true,
    uppercase: true,
    index: true,
  },
  city: {
    type: String,
    required: true,
    uppercase: true,
    index: true,
  },
  timezone: {
    type: String,
    required: true,
    index: true,
  },
});

const userProfileSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      index: true,
    },
    lastName: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },
    dob: {
      type: Date,
      required: true,
      index: true,
    },
    location: {
      type: Location,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

userProfileSchema.index({ createdAt: 1 });
userProfileSchema.index({ updatedAt: 1 });

// add plugin that converts mongoose to json
userProfileSchema.plugin(toJSON);
userProfileSchema.plugin(paginate);

const userProfile = mongoose.model('userProfile', userProfileSchema);

module.exports = userProfile;
