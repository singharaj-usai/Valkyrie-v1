const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// Update user status
router.post("/update-status", authenticateToken, async (req, res) => {
    try {
      const user = await User.findByIdAndUpdate(req.user.userId, 
        { isOnline: true, lastActiveAt: new Date() },
        { new: true }
      );
      res.json({ message: "Status updated successfully", isOnline: user.isOnline });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({ error: "Error updating user status" });
    }
  });
  
  // Get user status
  router.get("/:username", async (req, res) => {
    try {
      const user = await User.findOne({ username: req.params.username });
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isOnline = user.isOnline && (new Date() - user.lastActiveAt) < 5 * 60 * 1000; // 5 minutes
      if (!isOnline && user.isOnline) {
        // Update user status to offline if they haven't been active for 5 minutes
        await User.findByIdAndUpdate(user._id, { isOnline: false });
      }
      res.json({ isOnline });
    } catch (error) {
      console.error("Error fetching user status:", error);
      res.status(500).json({ error: "Error fetching user status" });
    }
  });

  module.exports = router;