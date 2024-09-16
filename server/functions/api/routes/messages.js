const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const authenticateToken = require('../middleware/authenticateToken');

// Send a message
router.post('/send', authenticateToken, [
    body('recipient').isString().trim().notEmpty(),
    body('subject').isString().trim().isLength({ max: 100 }),
    body('message').isString().trim().isLength({ max: 1000 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: 'Invalid input', details: errors.array() });
    }

    const { recipient, subject, message } = req.body;

    try {
        const sender = await User.findOne({ username: req.user.username });
        if (!sender) {
            return res.status(401).json({ error: 'Unauthorized: Sender not found' });
        }

        const recipientUser = await User.findOne({ username: recipient });
        if (!recipientUser) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        const newMessage = new Message({
            sender: sender._id,
            recipient: recipientUser._id,
            subject,
            message
        });

        await newMessage.save();

        res.status(201).json({ message: 'Message sent successfully' });
    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get received messages
router.get('/received', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        const messages = await Message.find({ recipient: user._id })
            .populate('sender', 'username')
            .sort({ sentAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching received messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get sent messages
router.get('/sent', authenticateToken, async (req, res) => {
    try {
        const user = await User.findOne({ username: req.user.username });
        const messages = await Message.find({ sender: user._id })
            .populate('recipient', 'username')
            .sort({ sentAt: -1 });

        res.json(messages);
    } catch (error) {
        console.error('Error fetching sent messages:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a specific message by ID
router.get('/:id', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        const message = await Message.findById(messageId)
            .populate('sender', 'username')
            .populate('recipient', 'username');

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Verify that the requester is either the sender or the recipient
        if (message.sender.username !== req.user.username && message.recipient.username !== req.user.username) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(message);
    } catch (error) {
        console.error('Error fetching message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// (Optional) Delete a message
router.delete('/:id', authenticateToken, async (req, res) => {
    const messageId = req.params.id;
    try {
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ error: 'Message not found' });
        }

        // Verify that the requester is either the sender or the recipient
        if (message.sender.toString() !== req.user.userId && message.recipient.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await message.remove();
        res.json({ message: 'Message deleted successfully' });
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;