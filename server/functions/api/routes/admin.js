const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Game = require('../models/Game');
const ForumPost = require('../models/ForumPost');
const Reply = require('../models/Reply');
const isAdmin = require('../middleware/adminAuth');
const { isAuthenticated } = require('../middleware/auth');
const authenticateToken = require('../middleware/authenticateToken');

// Apply isAuthenticated middleware to all admin routes
router.use(isAuthenticated);
router.use(isAdmin);

// Check admin authentication
router.get('/check-auth', (req, res) => {
  res.json({ isAdmin: true });
});

// Promote user to admin
router.post('/promote-admin/:id', authenticateToken, async (req, res) => {
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

router.post('/demote-admin/:id', authenticateToken, async (req, res) => {
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
router.get('/forum-posts', authenticateToken, async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('author', 'username')
      .populate('section', 'name')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username' }
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching forum posts' });
  }
});

router.post('/forum-posts/:id/toggle-pin', authenticateToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    post.isPinned = !post.isPinned;
    post.updatedAt = new Date(); // Update the updatedAt field
    await post.save();
    
    res.json({ message: `Post ${post.isPinned ? 'pinned' : 'unpinned'} successfully`, isPinned: post.isPinned });
  } catch (error) {
    console.error('Error toggling post pin status:', error);
    res.status(500).json({ error: 'Error toggling post pin status' });
  }
});

// Delete a forum post
router.delete('/forum-posts/:id', authenticateToken, async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate('author');
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    // Delete all replies associated with the post, if any
    if (post.replies && post.replies.length > 0) {
      await Reply.deleteMany({ _id: { $in: post.replies } });
      // Decrease the post count for each reply author
      const replyAuthors = await Reply.find({ _id: { $in: post.replies } }).distinct('author');
      await User.updateMany(
        { _id: { $in: replyAuthors } },
        { $inc: { forumPostCount: -1 } }
      );
    }
    
    // Decrease the post count for the post author
    await User.findByIdAndUpdate(post.author._id, { $inc: { forumPostCount: -1 } });
    
    // Delete the post
    await ForumPost.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Post and associated replies deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    res.status(500).json({ error: 'Error deleting forum post', details: error.message });
  }
});
// Delete a forum reply
router.delete('/forum-replies/:id', authenticateToken, async (req, res) => {
  try {
    const reply = await Reply.findById(req.params.id).populate('author');
    if (!reply) {
      return res.status(404).json({ error: 'Reply not found' });
    }
    
    // Update the post to remove the reply reference and decrease reply count
    await ForumPost.findByIdAndUpdate(reply.post, {
      $pull: { replies: reply._id },
      $inc: { replyCount: -1 }
    });
    
    // Decrease the post count for the reply author
    await User.findByIdAndUpdate(reply.author._id, { $inc: { forumPostCount: -1 } });
    
    // Delete the reply
    await Reply.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum reply:', error);
    res.status(500).json({ error: 'Error deleting forum reply' });
  }
});

// Reset forum post count
router.post('/reset-forum-post-count', authenticateToken, async (req, res) => {
  try {
    const users = await User.find();
    for (const user of users) {
      const postCount = await ForumPost.countDocuments({ author: user._id });
      const replyCount = await Reply.countDocuments({ author: user._id });
      const totalCount = postCount + replyCount;
      user.forumPostCount = totalCount;
      await user.save();
    }
    res.json({ message: 'Forum post counts reset successfully' });
  } catch (error) {
    console.error('Error resetting forum post counts:', error);
    res.status(500).json({ error: 'Error resetting forum post counts' });
  }
});

// Get all users 
router.get('/users', authenticateToken, async (req, res) => {
  try {
      const users = await User.find({}, '-password');
      res.json(users);
  } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users/:userId/ban', authenticateToken, async (req, res) => {
  try {
      const { userId } = req.params;
      const { ban, banReason } = req.body;

      const user = await User.findById(userId);
      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      user.isBanned = ban;
      user.banReason = ban ? banReason : null;
      await user.save();

      res.json({ message: ban ? 'User banned successfully' : 'User unbanned successfully' });
  } catch (error) {
      console.error('Error banning/unbanning user:', error);
      res.status(500).json({ error: 'Internal server error' });
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