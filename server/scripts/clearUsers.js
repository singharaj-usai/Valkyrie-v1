require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../functions/api/models/User');

const MONGODB_URI = process.env.MONGODB_URI;

async function clearUsers() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const result = await User.deleteMany({});
    console.log(`Deleted ${result.deletedCount} users`);

    // Reset the user ID counter
    const Counter = mongoose.model('Counter');
    await Counter.findOneAndUpdate(
      { _id: 'userId' },
      { $set: { seq: 0 } },
      { upsert: true }
    );
    console.log('Reset user ID counter');

  } catch (error) {
    console.error('Error clearing users:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

clearUsers();