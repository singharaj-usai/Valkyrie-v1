const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// User profile endpoint
router.get('/user/:username', authenticateToken, async (req, res) => {
    try {
      const { username } = req.params;
      const currentUser = await User.findById(req.user.userId);
      const user = await User.findOne({ username }).select('username userId signupDate lastLoggedIn blurb friendRequests friends sentFriendRequests');
      
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
        friendRequestReceived
      });
    } catch (error) {
      console.error('User profile error:', error);
      res.status(500).json({ error: 'Error fetching user profile' });
    }
  });

  // Get number of registered users
router.get("/user-count", async (req, res) => {
    try {
      const count = await User.countDocuments();
      res.json({ count });
    } catch (error) {
      console.error("Error fetching user count:", error);
      res.status(500).send("Error fetching user count");
    }
  });

  

  module.exports = router;