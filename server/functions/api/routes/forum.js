const express = require('express');
const router = express.Router();
const ForumPost = require('../models/ForumPost');
const Reply = require('../models/Reply');
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

router.get('/sections', (req, res) => {
  const sections = [
    { id: 'all', name: 'All Posts' },
    { id: 'announcements', name: 'Announcements' },
    { id: 'change-log', name: 'Change Log' },
    { id: 'suggestions-and-ideas', name: 'Suggestions and Ideas' },
    { id: 'media', name: 'Media' },
    { id: 'asset-sharing', name: 'Asset Sharing' },
    { id: 'tutorials', name: 'Tutorials' },
    { id: 'general', name: 'General Discussion' },
    { id: 'game-dev', name: 'Game Development' },
    { id: 'support', name: 'Support' },
    { id: 'off-topic', name: 'Off-Topic' },
    { id: 'rate-my-character', name: 'Rate My Character' },
    { id: 'memes', name: 'Memes' },
  ];
  res.json(sections);
});

// Get posts for a specific section with pagination
router.get('/sections/:section', async (req, res) => {
  try {
    let { section } = req.params;

    // Alias mapping: singular to plural
    const sectionAliases = {
      announcement: 'announcements',
      changelog: 'change-log',
    };

    if (sectionAliases[section.toLowerCase()]) {
      section = sectionAliases[section.toLowerCase()];
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    let query = {};
    if (section && section !== 'all') {
      query.section = section;
    }

    console.log('Query:', query);

    const posts = await ForumPost.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username');

    const totalPosts = await ForumPost.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    console.log('Found posts:', posts.length);

    res.json({
      posts,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ message: 'Error fetching forum posts' });
  }
});

router.get('/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await ForumPost.countDocuments();
    const posts = await ForumPost.find()
      .sort({ isPinned: -1, updatedAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'username signupDate')
      .populate({
        path: 'replies',
        options: { sort: { createdAt: -1 }, limit: 1 },
        populate: { path: 'author', select: 'username signupDate' },
      });

    res.json({
      posts,
      total: totalPosts,
      page,
      totalPages: Math.ceil(totalPosts / limit),
    });
  } catch (error) {
    console.error('Error fetching forum posts:', error);
    res.status(500).json({ error: 'Error fetching forum posts' });
  }
});

// Create a new post
router.post('/posts', isAuthenticated, async (req, res) => {
  try {
    const { title, content, section } = req.body;
    const newPost = new ForumPost({
      title,
      content,
      section,
      author: req.user._id,
    });

    await newPost.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { forumPostCount: 1 } });
    res
      .status(201)
      .json({ message: 'Post created successfully', post: newPost });
  } catch (error) {
    console.error('Error creating forum post:', error);
    res.status(500).json({ message: 'Error creating forum post' });
  }
});

// Get a single post by ID
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findById(id)
      .populate('author', 'username signupDate')
      .populate({
        path: 'replies',
        populate: {
          path: 'author',
          select: 'username signupDate',
        },
      });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ message: 'Error fetching post' });
  }
});

router.get('/posts/id/:id', async (req, res) => {
  try {
    const post = await ForumPost.findById(req.params.id).populate(
      'author',
      'username'
    );
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (error) {
    console.error('Error fetching forum post:', error);
    res.status(500).json({ message: 'Error fetching forum post' });
  }
});

// Vote on a post
router.post('/posts/:id/vote', isAuthenticated, async (req, res) => {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.user._id;
    const username = req.user.username;
    const userIdNumber = req.user.userId;

    if (!['up', 'down'].includes(voteType)) {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    const post = await ForumPost.findById(id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Ensure upvotes and downvotes are numbers
    if (typeof post.upvotes !== 'number') {
      post.upvotes = 0;
    }
    if (typeof post.downvotes !== 'number') {
      post.downvotes = 0;
    }

    const existingVote = post.userVotes.find(
      (vote) => vote.user.toString() === userId.toString()
    );

    let message = '';
    let changed = false;

    if (voteType === 'up') {
      if (!existingVote) {
        post.upvotes += 1;
        post.userVotes.push({
          user: userId,
          vote: 'up',
          username,
          userId: userIdNumber,
        });
        message = 'Upvote added successfully';
        changed = true;
      } else if (existingVote.vote === 'down') {
        post.upvotes += 1;
        post.downvotes = Math.max(post.downvotes - 1, 0);
        existingVote.vote = 'up';
        existingVote.username = username;
        existingVote.userId = userIdNumber;
        message = 'Vote changed from downvote to upvote';
        changed = true;
      } else {
        message = 'You have already upvoted this post';
      }
    } else if (voteType === 'down') {
      if (!existingVote) {
        post.downvotes += 1;
        post.userVotes.push({
          user: userId,
          vote: 'down',
          username,
          userId: userIdNumber,
        });
        message = 'Downvote added successfully';
        changed = true;
      } else if (existingVote.vote === 'up') {
        post.downvotes += 1;
        post.upvotes = Math.max(post.upvotes - 1, 0);
        existingVote.vote = 'down';
        existingVote.username = username;
        existingVote.userId = userIdNumber;
        message = 'Vote changed from upvote to downvote';
        changed = true;
      } else {
        message = 'You have already downvoted this post';
      }
    }

    if (changed) {
      await post.save();
    }

    const updatedVote = post.userVotes.find(
      (vote) => vote.user.toString() === userId.toString()
    );

    res.json({
      upvotes: post.upvotes,
      downvotes: post.downvotes,
      userVote: updatedVote ? updatedVote.vote : 'none',
      message: message,
      changed: changed,
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    res
      .status(500)
      .json({ message: 'Error voting on post', error: error.message });
  }
});

// Get replies for a post
router.get('/posts/:id/replies', async (req, res) => {
  try {
    const { id } = req.params;
    const post = await ForumPost.findById(id).populate({
      path: 'replies',
      populate: {
        path: 'author',
        select: 'username',
        populate: { path: 'signupDate' },
      },
      options: { sort: { createdAt: 1 } },
    });

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    res.json(post.replies);
  } catch (error) {
    console.error('Error fetching replies:', error);
    res.status(500).json({ message: 'Error fetching replies' });
  }
});

// Add a reply to a post
router.post('/posts/:postId/replies', isAuthenticated, async (req, res) => {
  try {
    const { postId } = req.params;
    const { content, parentReplyId } = req.body;
    const userId = req.user._id;

    const post = await ForumPost.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const newReply = new Reply({
      content,
      author: userId,
      post: postId,
      parentReply: parentReplyId || null,
    });

    await newReply.save();
    await ForumPost.findByIdAndUpdate(postId, {
      $push: { replies: newReply._id },
      $inc: { replyCount: 1 },
      updatedAt: new Date(), // Update the updatedAt field
    });

    res.status(201).json(newReply);
  } catch (error) {
    console.error('Error creating reply:', error);
    res.status(500).json({ message: 'Error creating comment' });
  }
});

router.get('/posts/:postId/replies', async (req, res) => {
  try {
    const { postId } = req.params;
    const replies = await Reply.find({ post: postId })
      .populate('author', 'username')
      .populate({
        path: 'parentReply',
        populate: { path: 'author', select: 'username' },
      })
      .sort({ createdAt: 1 });

    // Fetch post counts for all authors
    const authorIds = [...new Set(replies.map((reply) => reply.author._id))];
    const postCounts = await Promise.all(
      authorIds.map((authorId) =>
        ForumPost.countDocuments({ author: authorId })
      )
    );
    const postCountMap = Object.fromEntries(
      authorIds.map((id, index) => [id.toString(), postCounts[index]])
    );

    // Add post count to each reply
    const repliesWithPostCount = replies.map((reply) => {
      const replyObj = reply.toObject();
      replyObj.author.postCount = postCountMap[reply.author._id.toString()];
      return replyObj;
    });

    res.json(repliesWithPostCount);
  } catch (error) {
    console.error('Error fetching replies:', error);
    res
      .status(500)
      .json({ message: 'Error fetching replies', error: error.message });
  }
});

router.get('/user-post-count/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const postCount = await ForumPost.countDocuments({ author: userId });
    const replyCount = await Reply.countDocuments({ author: userId });
    const totalCount = postCount + replyCount;
    res.json({ count: totalCount });
  } catch (error) {
    console.error('Error fetching user post count:', error);
    res.status(500).json({
      message: 'Error fetching user post count',
      error: error.message,
    });
  }
});

router.get('/top-15-posters', async (req, res) => {
  try {
    const topPosters = await ForumPost.aggregate([
      {
        $group: {
          _id: '$author',
          totalPosts: { $sum: 1 },
        },
      },
      { $sort: { totalPosts: -1 } },
      { $limit: 15 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'userDetails',
        },
      },
      {
        $project: {
          _id: 1,
          username: { $arrayElemAt: ['$userDetails.username', 0] },
          totalPosts: 1,
        },
      },
    ]);
    res.json(topPosters);
  } catch (error) {
    console.error('Error fetching top 15 posters:', error);
    res
      .status(500)
      .json({ message: 'Error fetching top 15 posters', error: error.message });
  }
});

module.exports = router;
