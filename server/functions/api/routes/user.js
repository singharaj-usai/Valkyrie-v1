const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// User profile endpoint
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = await User.findById(req.user.userId);
    const user = await User.findOne({ username }).select(
      'username userId signupDate lastLoggedIn blurb friendRequests friends sentFriendRequests'
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFriend = currentUser.friends.includes(user._id);
    const friendRequestSent = user.friendRequests.includes(currentUser._id);
    const friendRequestReceived = currentUser.friendRequests.includes(user._id);

    const userObject = user.toObject();
    delete userObject.friendRequests;
    delete userObject.friends;
    delete userObject.sentFriendRequests;

    res.json({
      ...userObject,
      isFriend,
      friendRequestSent,
      friendRequestReceived,
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});

// Get number of registered users
router.get('/user-count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error('Error fetching user count:', error);
    res.status(500).send('Error fetching user count');
  }
});

router.put('/user/blurb', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let { blurb } = req.body;
    if (typeof blurb !== 'string' || blurb.length > 500) {
      return res.status(400).json({ error: 'Invalid blurb' });
    }
    blurb = blurb
      .trim()
      .replace(/\n+/g, '\n')
      .replace(/^\n|\n$/g, '')
      .split('\n')
      .map((line) => line.trim())
      .join('\n');

    const user = await User.findByIdAndUpdate(
      userId,
      { blurb: blurb },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ blurb: user.blurb });
  } catch (error) {
    console.error('Error updating user blurb:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/user-info', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      currency: user.currency,
      lastCurrencyClaimDate: user.lastCurrencyClaimDate,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
