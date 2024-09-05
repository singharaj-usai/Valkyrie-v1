const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const user = await User.findById(req.session.userId);
    if (user && user.isAdmin) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Admin authentication error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = isAdmin;