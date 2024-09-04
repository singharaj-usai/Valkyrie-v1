const mongoose = require('mongoose');

let cachedDb = null;

const connectDB = async (uri) => {
    if (cachedDb) {
        return cachedDb;
    }

    try {
        const db = await mongoose.connect(uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000
        });
        cachedDb = db;
        console.log('MongoDB connected');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

module.exports = connectDB;