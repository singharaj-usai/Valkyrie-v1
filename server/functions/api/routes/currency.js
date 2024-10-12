const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const moment = require('moment');

router.post('/claim-daily-currency', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const now = moment().utc(); // Use UTC
    const lastClaim = moment(user.lastCurrencyClaimDate).utc();

    if (!user.lastCurrencyClaimDate || now.diff(lastClaim, 'hours') >= 24) {
      user.currency += 10;
      user.lastCurrencyClaimDate = now.toISOString(); // Store in ISO format
      await user.save();
      res.json({
        success: true,
        newBalance: user.currency,
        lastClaimDate: user.lastCurrencyClaimDate,
      });
    } else {
      const nextClaimTime = lastClaim.clone().add(24, 'hours');
      const timeUntilNextClaim = nextClaimTime.diff(now);
      res.status(400).json({
        error: 'Currency can only be claimed once per day',
        lastClaimDate: user.lastCurrencyClaimDate,
      });
    }
  } catch (error) {
    console.error('Error claiming daily currency:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
