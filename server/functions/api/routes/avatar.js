const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');

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
        const { type, itemId } = req.body;
        console.log('Updating avatar:', { userId: req.user.userId, type, itemId });

        if (!type || !['shirt', 'pants', 'hat'].includes(type)) {
            console.error('Invalid or missing item type:', type);
            return res.status(400).json({ error: 'Invalid or missing item type' });
        }

        const user = await User.findOne({ userId: req.user.userId }).populate('inventory');
        
        if (!user) {
            console.error('User not found for userId:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.avatar) {
            user.avatar = {};
        }

        console.log('User inventory:', user.inventory.map(item => ({ id: item._id.toString(), type: item.AssetType })));


        switch (type) {
            case 'shirt':
                if (itemId) {
                    if (!mongoose.Types.ObjectId.isValid(itemId)) {
                        console.error('Invalid shirt ID:', itemId);
                        return res.status(400).json({ error: 'Invalid shirt ID' });
                    }

                    console.log('Checking inventory for shirt:', itemId);

                    const inventoryItem = user.inventory.find(item => 
                        item._id.toString() === itemId && item.AssetType === 'Shirt'
                    );

                    const createdShirt = await Asset.findOne({
                        _id: itemId,
                        creator: user._id,
                        AssetType: 'Shirt'
                    }).populate('creator', 'username');

                    if (!inventoryItem && !createdShirt) {
                        console.error('Shirt not in user inventory or not created by user:', itemId);
                        return res.status(400).json({ error: 'Shirt not in user inventory or not created by u' });
                    }

                    console.log('Setting shirt:', itemId);
                    user.avatar.shirt = createdShirt || inventoryItem;
                } else {
                    console.log('Unwearing shirt');
                    user.avatar.shirt = null;
                }
                break;
            //  cases for pants and hats can be added here later
            default:
                console.error('Unsupported item type:', type);
                return res.status(400).json({ error: 'Unsupported item type' });
        }

        await user.save();
        console.log('Avatar updated successfully for userId:', req.user.userId, 'New avatar:', user.avatar);
        res.json({ message: 'Avatar updated successfully', avatar: user.avatar });
    } catch (error) {
        console.error('Error updating avatar:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message, stack: error.stack });
    }
});

module.exports = router;