const mongoose = require('mongoose');

const pantSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  thumbnailUrl: {
    type: String,
    required: true,
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  assetId: {
    type: Number,
    required: true,
    unique: true,
  },
  price: {
    type: Number,
    required: true,
    default: 0,
  },
});

const Pant = mongoose.model('Pant', pantSchema);

module.exports = Pant;