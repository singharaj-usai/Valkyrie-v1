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
    AssetType: {
        type: String,
        required: true
    },
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    ThumbnailLocation: {
        type: String,
        required: true
    },
    IsForSale: {
        type: Number,
        required: true
    },
    Price: {
        type: Number,
        required: true
    },
    Sales: {
        type: Number,
        required: true
    },
    IsPublicDomain: {
        type: Number,
        required: true
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
