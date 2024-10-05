const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    assetId: {
        type: Number, // Sequential numeric assetId
        required: true,
        unique: true
    },
    FileLocation: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
