const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

let cachedDb = null;

const connectDB = async (uri) => {
  if (cachedDb) {
    return cachedDb;
  }

  try {
    const client = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    cachedDb = client;
    console.log('MongoDB connected');

    // require all models
    const modelsPath = path.join(__dirname, '../models');
    fs.readdirSync(modelsPath).forEach((file) => {
      if (file.endsWith('.js')) {
        require(path.join(modelsPath, file));
      }
    });

    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

module.exports = connectDB;
