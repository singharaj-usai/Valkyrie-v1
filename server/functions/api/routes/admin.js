const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');

const isAdmin = require('../middleware/adminAuth');
const { isAuthenticated } = require('../middleware/auth');

// Apply isAuthenticated middleware to all admin routes
router.use(isAuthenticated);

// Get all pending game uploads
router.get('/pending-games', isAdmin, async (req, res) => {
  try {
    const pendingGames = await Game.find({ status: 'pending' }).populate('creator', 'username');
    res.json(pendingGames);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve or reject a game
router.put('/game/:id', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const game = await Game.findByIdAndUpdate(id, { status }, { new: true });
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Ban user
router.post('/ban/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: true }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error banning user:', error);
    res.status(500).json({ error: 'Error banning user' });
  }
});

// Unban user
router.post('/unban/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: false }, { new: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error unbanning user:', error);
    res.status(500).json({ error: 'Error unbanning user' });
  }
});

module.exports = router;