const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { isAuthenticated } = require('../middleware/auth');

router.get('/', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (user.isBanned) {
            res.render('banned', { banReason: user.banReason });
        } else {
            res.redirect('/');
        }
    } catch (error) {
        res.status(500).send('Error loading ban page');
    }
});

module.exports = router;