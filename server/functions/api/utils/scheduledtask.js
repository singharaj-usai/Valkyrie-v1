const cron = require('node-cron');
const User = require('../models/User');

cron.schedule('0 * * * *', async () => {
  try {
    const now = new Date();
    const unbannedUsers = await User.updateMany(
      { isBanned: true, unbanDate: { $lte: now } },
      { $set: { isBanned: false, banReason: null, banDate: null, unbanDate: null, banNote: null } }
    );
    console.log(`Automatically unbanned ${unbannedUsers.nModified} users`);
  } catch (error) {
    console.error('Error in automatic unban task:', error);
  }
});