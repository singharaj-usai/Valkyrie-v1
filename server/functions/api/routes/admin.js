const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Asset = require('../models/Asset');
const mongoose = require('mongoose');
const thumbnailQueue = require('../queues/thumbnailQueue');
const Game = require('../models/Game');
const Message = require('../models/Message');
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

// get all recent assets sorted by order of creation, were gonna include shirts and pants and stuff in here  separately later on
router.get('/assets/recent', authenticateToken, async (req, res) => {
  try {
    const recentAssets = await Asset.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 });
    res.json(recentAssets);
  } catch (error) {
    console.error('Error fetching recent assets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// redraw the specific asset
router.post('/assets/:id/redraw', authenticateToken, async (req, res) => {
  const assetId = req.params.id;

  try {
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    if (asset.AssetType === 'Image') {
      return res.status(400).json({ error: 'Image assets cannot be redrawn' });
    }

    try {
      await thumbnailQueue.addToQueue(asset.assetId, asset.AssetType);
      res.json({ message: 'Asset redraw queued successfully' });
    } catch (queueError) {
      console.error('Error adding to thumbnail queue:', queueError);
      res.status(500).json({ error: 'Error queuing asset redraw' });
    }
  } catch (error) {
    console.error('Error processing asset redraw:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// get the asset by id
router.get('/assets/:id', authenticateToken, async (req, res) => {
  const assetId = req.params.id;

  try {
    let asset;



    if (mongoose.Types.ObjectId.isValid(assetId)) {
      asset = await Asset.findById(assetId).populate('creator', 'username');
    } else {
      const numericId = Number(assetId);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid asset ID' });
      }

      asset = await Asset.findOne({ assetId: numericId }).populate(
        'creator',
        'username'
      );
    }

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    // only non image assets redrawn
    asset = asset.toObject();
    asset.canRedraw = asset.AssetType !== 'Image';

    res.json(asset);
  } catch (error) {
    console.error('Error fetching asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// update asset
router.put('/assets/:id', authenticateToken, async (req, res) => {
  const assetId = req.params.id;
  const { Name, Description, Price } = req.body;

  if (!Name || !Description || typeof Price !== 'number') {
    return res.status(400).json({
      error: 'Invalid input. Name, Description, and Price are required.',
    });
  }

  try {
    let asset;
    if (mongoose.Types.ObjectId.isValid(assetId)) {
      asset = await Asset.findById(assetId);
    } else {
      const numericId = Number(assetId);
      if (isNaN(numericId)) {
        return res.status(400).json({ error: 'Invalid asset ID' });
      }
      asset = await Asset.findOne({ assetId: numericId });
    }

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    asset.Name = Name;
    asset.Description = Description;
    asset.Price = Price;
    await asset.save();

    res.json(asset);
  } catch (error) {
    console.error('Error updating asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete asset
router.delete('/assets/:id', authenticateToken, async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  } catch (error) {
    console.error('Error deleting asset:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all forum posts
router.get('/forum-posts', authenticateToken, async (req, res) => {
  try {
    const posts = await ForumPost.find()
      .populate('author', 'username')
      .populate('section', 'name')
      .populate({
        path: 'replies',
        populate: { path: 'author', select: 'username' },
      })
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching forum posts' });
  }
});

// pin the forum post
router.post(
  '/forum-posts/:id/toggle-pin',
  authenticateToken,
  async (req, res) => {
    try {
      const post = await ForumPost.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }

      post.isPinned = !post.isPinned;
      post.updatedAt = new Date(); // Update the updatedAt field
      await post.save();

      res.json({
        message: `Post ${post.isPinned ? 'pinned' : 'unpinned'} successfully`,
        isPinned: post.isPinned,
      });
    } catch (error) {
      console.error('Error toggling post pin status:', error);
      res.status(500).json({ error: 'Error toggling post pin status' });
    }
  }
);

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
      const replyAuthors = await Reply.find({
        _id: { $in: post.replies },
      }).distinct('author');
      await User.updateMany(
        { _id: { $in: replyAuthors } },
        { $inc: { forumPostCount: -1 } }
      );
    }

    // Decrease the post count for the post author
    await User.findByIdAndUpdate(post.author._id, {
      $inc: { forumPostCount: -1 },
    });

    // Delete the post
    await ForumPost.findByIdAndDelete(req.params.id);

    res.json({ message: 'Post and associated replies deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum post:', error);
    res
      .status(500)
      .json({ error: 'Error deleting forum post', details: error.message });
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
      $inc: { replyCount: -1 },
    });

    // Decrease the post count for the reply author
    await User.findByIdAndUpdate(reply.author._id, {
      $inc: { forumPostCount: -1 },
    });

    // Delete the reply
    await Reply.findByIdAndDelete(req.params.id);

    res.json({ message: 'Reply deleted successfully' });
  } catch (error) {
    console.error('Error deleting forum reply:', error);
    res.status(500).json({ error: 'Error deleting forum reply' });
  }
});

// (ONLY USE THIS IF ALL FORUM POSTS IS DELETED AS THIS IS DESTRUCTIVE)
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
    const users = await User.find({}, '-password').select('username email signupDate isBanned isAdmin currency');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ban the user (does not work yet, needs to be worked on more on the server side)
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

    res.json({
      message: ban ? 'User banned successfully' : 'User unbanned successfully',
    });
  } catch (error) {
    console.error('Error banning/unbanning user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all games
router.get('/games', async (req, res) => {
  try {
    const games = await Game.find()
      .populate('creator', 'username')
      .sort({ createdAt: -1 });
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

// ban users
router.post('/users/:id/ban', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { ban, banReason } = req.body;

    if (ban && (!banReason || banReason.trim() === '')) {
      return res.status(400).json({ error: 'Ban reason is required when banning a user.' });
    }

    const updateFields = {
      isBanned: ban,
      banReason: ban ? banReason.trim() : null,
    };

    const user = await User.findByIdAndUpdate(req.params.id, updateFields, { new: true });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.json({ message: ban ? 'User banned successfully.' : 'User unbanned successfully.' });
  } catch (error) {
    console.error('Error updating user ban status:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Delete a user (ONLY USE AS LAST RESORT, THIS IS DESTRUCTIVE)
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

// Get user messages
router.get('/users/:userId/messages', authenticateToken, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.params.userId }, { recipient: req.params.userId }]
    })
    .populate('sender', 'username profilePicture')
    .populate('recipient', 'username profilePicture')
    .sort({ sentAt: -1 })

    res.json(messages);
  } catch (error) {
    console.error('Error fetching user messages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get statistics
router.get('/statistics', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments();
    const totalForumPosts = await ForumPost.countDocuments();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const activeUsers = await User.countDocuments({
      lastActiveAt: { $gte: oneDayAgo },
    });

    res.json({
      totalUsers,
      totalGames,
      totalForumPosts,
      activeUsers,
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching statistics' });
  }
});

module.exports = router;
