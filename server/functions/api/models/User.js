const mongoose = require("mongoose");
const moment = require("moment-timezone");

const userSchema = new mongoose.Schema({
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
});

module.exports = mongoose.model("User", userSchema);
