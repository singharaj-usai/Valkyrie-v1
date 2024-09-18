const mongoose = require('mongoose');

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
        require('../models/Counter');
        require('../models/User');
       require('../models/Message')
        return client;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw error;
    }
};

module.exports = connectDB;