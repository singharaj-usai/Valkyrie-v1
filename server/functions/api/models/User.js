const mongoose = require("mongoose");
const moment = require("moment-timezone");
require('./Counter'); // Add this line to ensure Counter model is registered

const userSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: false,
  },
  userId: {
    type: Number,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 3,
    maxlength: 18,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  signupDate: {
    type: Date,
    default: () => moment().tz("America/New_York").toDate(),
  },
  signupIp: {
    type: String,
    required: true,
  },
  lastLoggedIn: {
    type: Date,
    default: null,
  },
  lastLoginIp: {
    type: String,
    default: null,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: String,
});

userSchema.pre('save', async function(next) {
  if (this.isNew) {
    const counter = await mongoose.model('Counter').findOneAndUpdate(
      { _id: 'userId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.userId = counter.seq;
  }
  next();
});

userSchema.statics.resetCounter = async function() {
  const Counter = mongoose.model('Counter');
  await Counter.findOneAndUpdate(
    { _id: 'userId' },
    { $set: { seq: 0 } },
    { upsert: true, new: true }
  );
};

module.exports = mongoose.model("User", userSchema);
