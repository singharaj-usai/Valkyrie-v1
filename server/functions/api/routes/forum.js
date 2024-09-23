const express = require('express');
const router = express.Router();
const ForumPost = require('../models/ForumPost');
const { isAuthenticated } = require('../middleware/auth');

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
router.post('/posts/:id/comments', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.user._id;

        const post = await ForumPost.findById(id);
        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        const newComment = new Comment({
            content,
            author: userId,
            post: id
        });

        await newComment.save();

        post.comments.push(newComment._id);
        await post.save();

        const populatedComment = await Comment.findById(newComment._id).populate('author', 'username');

        res.status(201).json(populatedComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Error adding comment' });
    }
});

module.exports = router;