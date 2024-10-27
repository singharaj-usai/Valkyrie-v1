const User = require('../models/User');

const updateUserStatus = async (req, res, next) => {
  if (req.user) {
    await User.findOneAndUpdate(req.user.userId, {
      isOnline: true,
      lastActiveAt: new Date(),
    });
  }
  next();
};

module.exports = updateUserStatus;
