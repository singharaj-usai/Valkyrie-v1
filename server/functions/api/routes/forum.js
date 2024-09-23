const express = require('express');
const router = express.Router();
const ForumPost = require('../../../models/ForumPost');
const { isAuthenticated } = require('../middleware/auth');

// Get recent posts with pagination
router.get('/posts', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const posts = await ForumPost.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('author', 'username');

        const totalPosts = await ForumPost.countDocuments();
        const totalPages = Math.ceil(totalPosts / limit);

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

module.exports = router;