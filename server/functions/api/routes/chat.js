const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');
const { isAuthenticated } = require('../middleware/auth');

router.get('/friends', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends', 'username isOnline');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const friends = user.friends.map(friend => ({
            username: friend.username,
            isOnline: friend.isOnline
        }));
        res.json(friends);
    } catch (error) {
        console.error('Error fetching friends list:', error);
        res.status(500).json({ error: 'Error fetching friends list' });
    }
});

router.get('/messages/:friendUsername', async (req, res) => {
    try {
        const { friendUsername } = req.params;
        const friend = await User.findOne({ username: friendUsername });
        if (!friend) {
            return res.status(404).json({ error: 'Friend not found' });
        }

        const chat = await Chat.findOne({
            participants: { $all: [req.user.id, friend._id] }
        }).sort({ 'messages.timestamp': -1 }).limit(50);

        if (!chat) {
            return res.json([]);
        }

        const messages = chat.messages.map(message => ({
            sender: message.sender.toString() === req.user.id.toString() ? req.user.username : friendUsername,
            content: message.message,
            timestamp: message.timestamp
        }));

        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: 'Error fetching messages' });
    }
});

router.post('/messages/send', isAuthenticated, async (req, res) => {
    try {
        const { recipient, content } = req.body;
        const recipientUser = await User.findOne({ username: recipient });
        if (!recipientUser) {
            return res.status(404).json({ error: 'Recipient not found' });
        }

        let chat = await Chat.findOne({
            participants: { $all: [req.user.id, recipientUser._id] }
        });

        if (!chat) {
            chat = new Chat({
                participants: [req.user.id, recipientUser._id],
                messages: []
            });
        }

        chat.messages.push({
            sender: req.user.id,
            message: content
        });

        await chat.save();

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error sending message' });
    }
});

module.exports = router;