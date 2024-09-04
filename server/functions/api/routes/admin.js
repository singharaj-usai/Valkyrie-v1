const express = require('express');
const router = express.Router();
const User = require('../models/User');
const isAdmin = require('../middleware/adminAuth');

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

// Ban user
router.post('/ban/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: true }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error banning user' });
  }
});

// Unban user
router.post('/unban/:userId', isAdmin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.userId, { isBanned: false }, { new: true });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error unbanning user' });
  }
});

module.exports = router;