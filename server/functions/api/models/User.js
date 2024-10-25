const mongoose = require('mongoose');
const moment = require('moment-timezone');
require('./Counter'); // Add this line to ensure Counter model is registered

const userSchema = new mongoose.Schema({
  isAdmin: {
    type: Boolean,
    default: false,
  },
  adminLevel: {
    type: String,
    enum: ['user', 'moderator', 'admin'],
    default: 'user'
  },
  userId: {
    type: Number,
    unique: true,
    required: true,
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
  verificationToken: {
    type: String,
  },
  avatar: {
        shirt: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
        pants: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
        hat: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
        gear: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
        heads: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
        face: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null },
        tshirts: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', default: null }
  },
  signupDate: {
    type: Date,
    default: () => moment().tz('America/New_York').toDate(),
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

  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },

  lockUntil: {
    type: Date,
  },

  currency: {
    type: Number,
    default: 10,
  },
  lastCurrencyClaimDate: {
    type: Date,
    default: null,
  },
  blurb: {
    type: String,
    default: '',
    maxlength: 500,
  },
  isOnline: {
    type: Boolean,
    default: false,
  },

  isBanned: {
    type: Boolean,
    default: false,
  },

  banReason: {
    type: String,
    default: null,
  },

  lastActiveAt: {
    type: Date,
    default: Date.now,
  },

  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  friendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  sentFriendRequests: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  games: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Game',
    },
  ],

  postCount: {
    type: Number,
    default: 0,
  },

  forumPostCount: {
    type: Number,
    default: 0,
  },

  inventory: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
    },
  ],

  avatarRender: {
    shirt: {
      type: String,
      default: null
    },
    pants: {
      type: String,
      default: null
    },
    displayUrl: {
      type: String,
      default: null
  },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  }
  
});

userSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await mongoose
      .model('Counter')
      .findOneAndUpdate(
        { _id: 'userId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
    this.userId = counter.seq;
  }
  next();
});

userSchema.statics.resetCounter = async function () {
  const Counter = mongoose.model('Counter');
  await Counter.findOneAndUpdate(
    { _id: 'userId' },
    { $set: { seq: 0 } },
    { upsert: true, new: true }
  );
};

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

module.exports = mongoose.model('User', userSchema);
