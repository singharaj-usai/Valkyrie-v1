const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');
const ForumPost = require('../models/ForumPost');

const isAdmin = require('../middleware/adminAuth');
const { isAuthenticated } = require('../middleware/auth');

// Apply isAuthenticated middleware to all admin routes
router.use(isAuthenticated);
router.use(isAdmin);

// Check admin authentication
router.get('/check-auth', (req, res) => {
  res.json({ isAdmin: true });
});

// Promote user to admin
router.post('/promote-admin/:id', async (req, res) => {
  try {
    const userToPromote = await User.findById(req.params.id);
    if (!userToPromote) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToPromote.isAdmin) {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    userToPromote.isAdmin = true;
    await userToPromote.save();

    res.json({ message: 'User promoted to admin successfully' });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ error: 'Error promoting user to admin' });
  }
});

router.post('/demote-admin/:id', async (req, res) => {
  try {
      const userToDemote = await User.findById(req.params.id);
      if (!userToDemote) {
          return res.status(404).json({ error: 'User not found' });
      }

      if (!userToDemote.isAdmin) {
          return res.status(400).json({ error: 'User is not an admin' });
      }

      if (userToDemote._id.toString() === req.user.id) {
          return res.status(400).json({ error: 'You cannot demote yourself' });
      }

      userToDemote.isAdmin = false;
      await userToDemote.save();

      res.json({ message: 'User demoted from admin successfully' });
  } catch (error) {
      console.error('Error demoting user from admin:', error);
      res.status(500).json({ error: 'Error demoting user from admin' });
  }
});

// Get all forum posts
// Get all forum posts
router.get('/forum-posts', async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('author', 'username')
      .populate('section', 'name')
      .populate({
        path: 'comments',
        populate: { path: 'author', select: 'username' }
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching forum posts' });
  }
});

// Delete a forum reply
router.delete('/forum-replies/:id', async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ error: 'Reply not found' });
    }

    const postId = comment.post;

    // Delete the comment
    await Comment.findByIdAndDelete(req.params.id);

    // Update the post to remove the comment reference and decrease the reply count
    await ForumPost.findByIdAndUpdate(postId, {
      $pull: { comments: comment._id },
      $inc: { replyCount: -1 }
    });

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum reply:', error);
    res.status(500).json({ error: 'Error deleting forum reply' });
  }
});

// Delete a forum post
router.delete('/forum-posts/:id', async (req, res) => {
  try {
    const post = await ForumPost.findByIdAndDelete(req.params.id);
    if (post) {
      await ForumPost.findByIdAndDelete(req.params.id);
      res.json({ message: 'Post deleted successfully' });
    } else {
      const comment = await Comment.findById(req.params.id);
      if (comment) {
        await Comment.findByIdAndDelete(req.params.id);
        await ForumPost.findByIdAndUpdate(comment.post, { $pull: { comments: comment._id }, $inc: { replyCount: -1 } });
        res.json({ message: 'Reply deleted successfully' });
      } else {
        return res.status(404).json({ error: 'Post or reply not found' });
      }
    }
  } catch (error) {
    res.status(500).json({ error: 'Error deleting forum post' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find({}, '-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching users' });
  }
});

router.post('/users/:userId/ban', async (req, res) => {
  try {
      const user = await User.findById(req.params.userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      user.isBanned = req.body.ban;
      if (req.body.ban) {
          user.banReason = req.body.banReason;
      } else {
          user.banReason = null;
      }

      await user.save();

      res.json({ message: req.body.ban ? 'User banned successfully' : 'User unbanned successfully' });
  } catch (error) {
      res.status(500).json({ error: 'Error updating user ban status' });
  }
});

// Get all games
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find().populate('creator', 'username').sort({ createdAt: -1 });
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching games' });
  }
});

// Delete a game
router.delete('/games/:id', async (req, res) => {
  try {
    const game = await Game.findByIdAndDelete(req.params.id);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting game' });
  }
});

// Delete a user
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Error deleting user' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments();
    const totalForumPosts = await ForumPost.countDocuments();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({ lastActiveAt: { $gte: oneDayAgo } });

    res.json({
      totalUsers,
      totalGames,
      totalForumPosts,
      activeUsers
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});


module.exports = router;