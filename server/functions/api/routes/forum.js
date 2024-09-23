const express = require('express');
const router = express.Router();
const ForumPost = require('../models/ForumPost');
const Comment = require('../models/Comment');
const { isAuthenticated } = require('../middleware/auth');

router.get('/sections', (req, res) => {
    const sections = [
        { id: 'all', name: 'All Posts' },
        { id: 'announcements', name: 'Announcements' },
        { id: 'general', name: 'General Discussion' },
        { id: 'game-dev', name: 'Game Development' },
        { id: 'support', name: 'Support' },
        { id: 'off-topic', name: 'Off-Topic' }
    ];
    res.json(sections);
});

// Get posts for a specific section with pagination
router.get('/sections/:section?', async (req, res) => {
    try {
        const { section } = req.params;
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
            totalPages
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

        const posts = await ForumPost.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username')
            .select('title content createdAt section author replyCount');

        const totalPosts = await ForumPost.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

        console.log('Found posts:', posts.length);

        res.json({
            posts,
            currentPage: page,
            totalPages
        });
    } catch (error) {
        console.error('Error fetching forum posts:', error);
        res.status(500).json({ message: 'Error fetching forum posts' });
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
            author: req.user._id
        });

        await newPost.save();
        res.status(201).json({ message: 'Post created successfully', post: newPost });
    } catch (error) {
        console.error('Error creating forum post:', error);
        res.status(500).json({ message: 'Error creating forum post' });
    }
});

// Get a single post by ID
router.get('/posts/:id', async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id)
            .populate('author', 'username')
            .populate({
                path: 'comments',
                populate: { path: 'author', select: 'username' },
                options: { sort: { createdAt: -1 } }
            });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const responsePost = post.toObject();
        responsePost.upvoteCount = post.upvotes.length;
        responsePost.downvoteCount = post.downvotes.length;

        res.json(responsePost);
    } catch (error) {
        console.error('Error fetching forum post:', error);
        res.status(500).json({ message: 'Error fetching forum post' });
    }
});

router.get('/posts/id/:id', async (req, res) => {
    try {
        const post = await ForumPost.findById(req.params.id).populate('author', 'username');
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

        const post = await ForumPost.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const hasUpvoted = post.upvotes.includes(userId);
        const hasDownvoted = post.downvotes.includes(userId);

        if (voteType === 'up') {
            if (hasUpvoted) {
                post.upvotes.pull(userId);
            } else {
                post.upvotes.addToSet(userId);
                if (hasDownvoted) {
                    post.downvotes.pull(userId);
                }
            }
        } else if (voteType === 'down') {
            if (hasDownvoted) {
                post.downvotes.pull(userId);
            } else {
                post.downvotes.addToSet(userId);
                if (hasUpvoted) {
                    post.upvotes.pull(userId);
                }
            }
        } else {
            return res.status(400).json({ message: 'Invalid vote type' });
        }

        await post.save();

        res.json({
            upvotes: post.upvotes.length,
            downvotes: post.downvotes.length
        });
    } catch (error) {
        console.error('Error voting on post:', error);
        res.status(500).json({ message: 'Error voting on post' });
    }
});

// Get comments for a post
router.get('/posts/:id/comments', async (req, res) => {
    try {
        const { id } = req.params;
        const post = await ForumPost.findById(id).populate({
            path: 'comments',
            populate: { path: 'author', select: 'username' },
            options: { sort: { createdAt: -1 } }
        });

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        res.json(post.comments);
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Error fetching comments' });
    }
});

// Add a comment to a post
router.post('/posts/:postId/comments', isAuthenticated, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content, parentCommentId } = req.body;
        const userId = req.user._id;

        const post = await ForumPost.findById(postId);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = new Comment({
            content,
            author: userId,
            post: postId,
            parentComment: parentCommentId || null
        });

        await newComment.save();
        await ForumPost.findByIdAndUpdate(postId, { 
            $push: { comments: newComment._id },
            $inc: { replyCount: 1 }
        });

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ message: 'Error creating comment' });
    }
});

router.get('/posts/:postId/comments', async (req, res) => {
    try {
        const { postId } = req.params;
        const comments = await Comment.find({ post: postId })
            .populate('author', 'username')
            .populate({
                path: 'parentComment',
                populate: { path: 'author', select: 'username' }
            })
            .sort({ createdAt: 1 });

        res.json(comments);
    } catch (error) {
        console.error('Error creating comment:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ message: 'Error creating comment', error: error.message });
    }
});

module.exports = router;