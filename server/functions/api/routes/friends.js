const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// Send friend request
router.post('/send-friend-request/:userId', authenticateToken, async (req, res) => {
  try {
    const sender = await User.findOne({ userId: req.user.userId });
    const receiver = await User.findById(req.params.userId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (sender.friends.some(id => id.equals(receiver._id))) {
      return res.status(400).json({ error: 'You are already friends with this user' });
    }

    if (
      receiver.friendRequests.some(id => id.equals(sender._id)) ||
      sender.sentFriendRequests.some(id => id.equals(receiver._id))
    ) {
      return res.status(400).json({
        error: 'A friend request already exists between you and this user',
      });
    }

    receiver.friendRequests.push(sender._id);
    sender.sentFriendRequests.push(receiver._id);

    await receiver.save();
    await sender.save();

    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error('Error sending friend request:', error);
    res.status(500).json({ error: 'Error sending friend request' });
  }
});

// Accept friend request
router.post(
  '/accept-friend-request/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const receiver = await User.findOne({ userId: req.user.userId });
      const sender = await User.findById(req.params.userId);

      if (!sender || !receiver) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (!receiver.friendRequests.includes(sender._id)) {
        return res
          .status(400)
          .json({ error: 'No friend request from this user' });
      }

      receiver.friendRequests = receiver.friendRequests.filter(
        (id) => !id.equals(sender._id)
      );
      sender.sentFriendRequests = sender.sentFriendRequests.filter(
        (id) => !id.equals(receiver._id)
      );
      receiver.friends.push(sender._id);
      sender.friends.push(receiver._id);

      await receiver.save();
      await sender.save();

      res.json({ message: 'Friend request accepted' });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      res.status(500).json({ error: 'Error accepting friend request' });
    }
  }
);

// Add this new route after the existing friend-related routes
router.get(
  '/friendship-status/:username',
  authenticateToken,
  async (req, res) => {
    try {
      const currentUser = await User.findOne({ userId: req.user.userId });
      const targetUser = await User.findOne({ username: req.params.username });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      const isFriend = currentUser.friends.some(id => id.equals(targetUser._id));
      const friendRequestSent = targetUser.friendRequests.some(id => id.equals(currentUser._id));
      const friendRequestReceived = currentUser.friendRequests.some(id => id.equals(targetUser._id));

      res.json({
        isFriend,
        friendRequestSent,
        friendRequestReceived,
      });
    } catch (error) {
      console.error('Error checking friendship status:', error);
      res.status(500).json({ error: 'Error checking friendship status' });
    }
  }
);

// Unfriend
router.post('/unfriend/:userId', authenticateToken, async (req, res) => {
  try {
    
    const user = await User.findOne({ userId: req.user.userId });
    const friend = await User.findById(req.params.userId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.friends = user.friends.filter((id) => !id.equals(friend._id));
    friend.friends = friend.friends.filter((id) => !id.equals(user._id));

    await user.save();
    await friend.save();

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error('Error unfriending:', error);
    res.status(500).json({ error: 'Error unfriending' });
  }
});

// Decline friend request
router.post(
  '/decline-friend-request/:userId',
  authenticateToken,
  async (req, res) => {
    try {
      const receiver = await User.findOne({ userId: req.user.userId });
      const sender = await User.findById(req.params.userId);

      if (!receiver || !sender) {
        return res.status(404).json({ error: 'User not found' });
      }

      receiver.friendRequests = receiver.friendRequests.filter(
        (id) => !id.equals(sender._id)
      );
      sender.sentFriendRequests = sender.sentFriendRequests.filter(
        (id) => !id.equals(receiver._id)
      );

      await receiver.save();
      await sender.save();

      res.json({ message: 'Friend request declined' });
    } catch (error) {
      console.error('Error declining friend request:', error);
      res.status(500).json({ error: 'Error declining friend request' });
    }
  }
);

// Get friend requests
router.get('/friend-requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).populate(
      'friendRequests',
      'username'
    );
    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching friend requests' });
  }
});

// Get friends list
router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ userId: req.user.userId }).populate(
      'friends',
      'username'
    );
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching friends list' });
  }
});
// Get friends list for a specific user
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const friends = await User.find(
      { _id: { $in: user.friends } },
      'username isOnline lastActiveAt'
    );
    res.json(friends);
  } catch (error) {
    console.error('Error fetching friends list:', error);
    res.status(500).json({ error: 'Error fetching friends list' });
  }
});

module.exports = router;
