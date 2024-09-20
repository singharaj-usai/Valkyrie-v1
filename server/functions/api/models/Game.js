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
        enum: ['Action', 'Adventure', 'Puzzle', 'RPG', 'Simulation', 'Strategy'],
        required: true
    },
    maxPlayers: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
});


const Game = mongoose.model('Game', gameSchema);

module.exports = Game;