const User = require('../models/User');

const updateUserStatus = async (req, res, next) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      isOnline: true,
      lastActiveAt: new Date()
    });
  }
  next();
};

module.exports = updateUserStatus;