const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Search users endpoint
router.get("/search", async (req, res) => {
    try {
      const { username, page = 1, limit = 10 } = req.query;
      const skip = (page - 1) * limit;
      
      const query = { username: new RegExp(username, 'i') };
      const total = await User.countDocuments(query);
      const users = await User.find(query)
        .select('username userId signupDate lastLoggedIn blurb isOnline lastActiveAt')
        .sort({ isOnline: -1, username: 1 }) // Sort by isOnline (descending) and then by username ascending
        .skip(skip)
        .limit(parseInt(limit));
  
      //res.status(500).send("Error searching users");
      res.json({
        users: users.map(user => ({
          username: user.username,
          userId: user.userId,
          signupDate: user.signupDate,
          lastLoggedIn: user.lastLoggedIn,
          blurb: user.blurb,
          isOnline: user.isOnline,
          lastActiveAt: user.lastActiveAt,
        })),
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      });
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  module.exports = router;