const express = require('express');
const router = express.Router();
const User = require('../models/User');
const isAdmin = require('../middleware/adminAuth');
const { isAuthenticated } = require('../middleware/auth');

// Apply isAuthenticated middleware to all admin routes
router.use(isAuthenticated);

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