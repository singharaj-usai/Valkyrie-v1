const User = require('../models/User');

const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.userId; // Ensure this is a number
    const user = await User.findOne({ userId: userId }); // Use findOne with userId

    if (user && user.isAdmin && (user.adminLevel === 'admin' || user.adminLevel === 'moderator')) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    console.error('Error in isAdmin middleware:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = isAdmin;