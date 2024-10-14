const mongoose = require('mongoose');

const forumPostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 10000,
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  section: {
    type: String,
    required: true,
    enum: [
      'announcements',
      'change-log',
      'suggestions-and-ideas',
      'media',
      'asset-sharing',
      'tutorials',
      'general',
      'game-dev',
      'support',
      'off-topic',
      'rate-my-character',
      'memes',
    ],
  },
  subSection: {
    type: String,
    required: false,
  },

  isPinned: {
    type: Boolean,
    default: false,
  },
  upvotes: {
    type: Number,
    default: 0,
  },
  downvotes: {
    type: Number,
    default: 0,
  },
  userVotes: {
    type: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        vote: {
          type: String,
          enum: ['up', 'down'],
        },
        username: String,
        userId: Number,
      },
    ],
    default: [],
  },

  replies: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reply',
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  replyCount: {
    type: Number,
    default: 0,
  },
  lastReplyDate: {
    type: Date,
    default: null
  },
});

forumPostSchema.statics.countUserPosts = function (userId) {
  return this.countDocuments({ author: userId });
};

const ForumPost = mongoose.model('ForumPost', forumPostSchema);

module.exports = ForumPost;
