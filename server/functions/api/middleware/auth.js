const User = require('../models/User');

const isAuthenticated = (req, res, next) => {
  if (req.session.userId) {
    next();
  } else {
    res.status(401).json({ error: 'Unauthorized. Please log in.' });
  }
};

const isNotAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    next();
  } else {
    res.redirect('/');
  }
};

module.exports = { isAuthenticated, isNotAuthenticated };