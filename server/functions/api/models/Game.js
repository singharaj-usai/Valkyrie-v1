const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    thumbnailUrl: {
        type: String,
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
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      genre: {
        type: String,
        enum: ['Action', 'Adventure', 'Building', 'Comedy', 'Fighting', 'FPS', 'Horror', 'Puzzle', 'RPG', 'Medieval', 'Military', 'Naval', 'Roleplaying', 'Sci-Fi', 'Simulation', 'Sports', 'Strategy', 'Town and City', 'Western'],
        required: true
    },
    maxPlayers: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true,
        min: 2010,
        max: 2018
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    assetId: {
        type: Number,
        required: true,
        unique: true
    },
});


const Game = mongoose.model('Game', gameSchema);

module.exports = Game;
