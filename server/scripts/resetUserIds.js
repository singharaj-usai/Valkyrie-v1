require('dotenv').config();
const mongoose = require('mongoose');
require('../functions/api/models/Counter'); // Add this line
const User = require('../functions/api/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function resetUserIds() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const userCount = await User.countDocuments();

    if (userCount === 0) {
      await User.resetCounter();
      console.log('User ID counter has been reset.');
    } else {
      console.log('Users exist in the database. Counter not reset.');
    }
  } catch (error) {
    console.error('Error resetting user IDs:', error);
  } finally {
    mongoose.disconnect();
  }
}

resetUserIds();
