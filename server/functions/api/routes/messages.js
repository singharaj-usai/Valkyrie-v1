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

// (Optional) Get received messages
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

// (Optional) Get sent messages
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

module.exports = router;