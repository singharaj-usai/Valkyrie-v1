const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// User profile endpoint
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    console.log('Fetching profile for username:', username);
    
    const currentUser = await User.findOne({ userId: req.user.userId });
    if (!currentUser) {
      console.error('Current user not found:', req.user.userId);
      return res.status(404).json({ error: 'Current user not found' });
    }

    const user = await User.findOne({ username })
      .select('username userId signupDate lastLoggedIn blurb friendRequests friends sentFriendRequests avatarRender')
      .lean();

    if (!user) {
      console.error('Target user not found:', username);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('User found:', {
      userId: user.userId,
      hasAvatarRender: !!user.avatarRender,
      avatarRenderDetails: user.avatarRender
    });

    const isFriend = currentUser.friends.includes(user.userId);
    const friendRequestSent = user.friendRequests.includes(currentUser.userId);
    const friendRequestReceived = currentUser.friendRequests.includes(user.userId);

    delete user.friendRequests;
    delete user.friends;
    delete user.sentFriendRequests;

    const responseData = {
      ...user,
      isFriend,
      friendRequestSent,
      friendRequestReceived,
    };

    console.log('Sending profile response:', {
      userId: responseData.userId,
      hasAvatarRender: !!responseData.avatarRender,
      avatarRenderDetails: responseData.avatarRender
    });

    res.json(responseData);
  } catch (error) {
    console.error('User profile error:', {
      error: error.message,
      stack: error.stack,
      username: req.params.username,
      userId: req.user.userId
    });
    res.status(500).json({ 
      error: 'Error fetching user profile',
      details: error.message
    });
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

    const user = await User.findOneAndUpdate(
      { userId: userId },
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

    const user = await User.findOne({ userId: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      username: user.username,
      currency: user.currency,
      lastCurrencyClaimDate: user.lastCurrencyClaimDate,
      isAdmin: user.isAdmin,
    });
  } catch (error) {
    console.error('Error fetching user info:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/:userId/avatar', async (req, res) => {
  try {
    console.log('Fetching avatar for userId:', req.params.userId);
    
    const user = await User.findOne({ userId: req.params.userId });
    if (!user) {
      console.error('User not found for avatar request:', req.params.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    console.log('Avatar data found:', {
      userId: user.userId,
      hasAvatarRender: !!user.avatarRender,
      avatarRenderDetails: user.avatarRender
    });

    res.json({ 
      avatarRender: user.avatarRender 
    });
  } catch (error) {
    console.error('Error fetching user avatar render:', {
      error: error.message,
      stack: error.stack,
      userId: req.params.userId
    });
    res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

module.exports = router;
