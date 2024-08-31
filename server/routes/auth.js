const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const moment = require('moment-timezone');

const router = express.Router();

// Validation middleware
const validateUser = [
    body('username')
        .isLength({ min: 3, max: 18 }).withMessage('Username must be between 3 and 18 characters')
        .custom(async (value) => {
            const user = await User.findOne({ username: value });
            if (user) {
                throw new Error('Username is already in use');
            }
        }),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Signup endpoint
router.post('/signup', validateUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({
            username,
            password: hashedPassword,
            signupDate: moment().tz('America/New_York').toDate()
        });
        await user.save();
        res.status(201).send('User created successfully');
    } catch (error) {
        res.status(500).send('Error creating user');
    }
});

// Login endpoint
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).send('Invalid username or password');
        }
        
        user.lastLoggedIn = moment().tz('America/New_York').toDate();
        await user.save();

        req.session.userId = user._id;
        res.json({ 
            username: user.username,
            signupDate: user.signupDate,
            lastLoggedIn: user.lastLoggedIn
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('Error logging in');
    }
});

// Logout endpoint
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

// Search users endpoint
router.get('/search', async (req, res) => {
    try {
        const { username } = req.query;
        const regex = new RegExp(username, 'i'); // 'i' flag for case-insensitive search
        const users = await User.find({ username: regex }, 'username');
        res.json(users);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).send('Error searching users');
    }
});

module.exports = router;