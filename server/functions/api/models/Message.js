const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        maxlength: 100
    },
    message: {
        type: String,
        required: true,
        maxlength: 1000
    },
    sentAt: {
        type: Date,
        default: Date.now
    },
    isArchived: {
        type: Boolean,
        default: false
    },
    archivedBy: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model('Message', messageSchema);