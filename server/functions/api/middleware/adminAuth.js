const User = require('../models/User');

module.exports = async function isAdmin(req, res, next) {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res
        .status(403)
        .json({ error: 'Access denied. Admin privileges required.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
