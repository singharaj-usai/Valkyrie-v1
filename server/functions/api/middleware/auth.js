const jwt = require('jsonwebtoken');
const User = require('../models/User');

const isAuthenticated = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const isNotAuthenticated = (req, res, next) => {
    if (req.session.userId) {
        res.redirect('/');
    } else {
        next();
    }
};

const isBanned = async (req, res, next) => {
  if (req.user && req.user.isBanned) {
      return res.status(403).json({ 
          error: 'Your account has been banned', 
          banReason: req.user.banReason 
      });
  }
  next();
};

module.exports = { isBanned, isAuthenticated, isNotAuthenticated };