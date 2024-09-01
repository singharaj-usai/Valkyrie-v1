const mongoose = require('mongoose');
const moment = require('moment-timezone');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 18
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    signupDate: {
        type: Date,
        default: () => moment().tz('America/New_York').toDate()
    },
    lastLoggedIn: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model('User', userSchema);