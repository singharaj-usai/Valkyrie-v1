const express = require('express');
const path = require('path');
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');

const router = express.Router();

router.get('/navbar.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/navbar.html'));
});

router.get('/login.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/login.html'));
});

router.get('/signup.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/signup.html'));
});

router.get('/search-results.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/search-results.html'));
});

module.exports = router;