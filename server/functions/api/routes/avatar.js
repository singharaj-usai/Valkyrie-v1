const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');

// Get current avatar
router.get('/', authenticateToken, async (req, res) => {
    try {
        console.log('Fetching avatar for userId:', req.user.userId);
        const user = await User.findOne({ userId: req.user.userId }).select('avatar');
        
        if (!user) {
            console.error('User not found for userId:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('Avatar fetched successfully:', user.avatar);
        res.json(user.avatar);
    } catch (error) {
        console.error('Error fetching avatar:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Update avatar
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { shirtId } = req.body;

        const user = await User.findOne({ userId: req.user.userId });
        if (!user) {
            console.error('User not found for userId:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }

        if (shirtId) {
            if (!mongoose.Types.ObjectId.isValid(shirtId)) {
                console.error('Invalid shirt ID:', shirtId);
                return res.status(400).json({ error: 'Invalid shirt ID' });
            }

            // Check if the shirt is in  inventory
            if (!user.inventory.includes(shirtId)) {
                console.error('Shirt not in user inventory:', shirtId);
                return res.status(400).json({ error: 'Shirt not in user inventory' });
            }

            user.avatar.shirtId = shirtId;
        }

        await user.save();
        console.log('Avatar updated successfully for userId:', req.user.userId);
        res.json({ message: 'Avatar updated successfully' });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;