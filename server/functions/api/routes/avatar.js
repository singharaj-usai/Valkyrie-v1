const express = require('express');
const router = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const User = require('../models/User');
const mongoose = require('mongoose');
const Asset = require('../models/Asset');

// Get current avatar
router.get('/', authenticateToken, async (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    try {
        console.log('Fetching avatar and render data for userId:', req.user.userId);
        const user = await User.findOne({ userId: req.user.userId })
            .select('avatar avatarRender')
            .populate('avatar.shirt');
        
        if (!user) {
            console.error('User not found:', { userId: req.user.userId });
            return res.status(404).json({ error: 'User not found' });
        }
        
        console.log('Avatar data fetched:', {
            userId: req.user.userId,
            hasAvatar: !!user.avatar,
            avatarDetails: user.avatar,
            hasAvatarRender: !!user.avatarRender,
            renderDetails: user.avatarRender
        });

        res.json({
            avatar: user.avatar,
            avatarRender: user.avatarRender
        });
    } catch (error) {
        console.error('Error fetching avatar data:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.userId
        });
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

router.get('/render/:userId', async (req, res) => {
    try {
        const user = await User.findOne({ userId: parseInt(req.params.userId) });
        
        if (!user) {
            console.log('User not found for avatar render:', req.params.userId);
            return res.status(404).json({ error: 'User not found' });
        }

        // Return both the shirt URL and display URL
        res.json({ 
            avatarRender: {
                ...user.avatarRender,
                displayUrl: user.avatarRender?.displayUrl || user.avatarRender?.shirt
            }
        });
    } catch (error) {
        console.error('Error fetching avatar render:', {
            error: error.message,
            stack: error.stack,
            userId: req.params.userId
        });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});



router.post('/render', authenticateToken, async (req, res) => {
    try {
        const { shirt, displayUrl } = req.body;
        const user = await User.findOne({ userId: req.user.userId });
        
        if (!user) {
            console.log('User not found:', req.user.userId);
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.avatarRender) {
            user.avatarRender = {};
        }

        // Update the render data with both the shirt URL and display URL
        user.avatarRender = {
            ...user.avatarRender,
            shirt,
            displayUrl: displayUrl || shirt, // Use displayUrl if provided, otherwise use shirt URL
            lastUpdated: new Date()
        };

        await user.save();
        console.log('Avatar render saved:', user.avatarRender);

        res.json({ 
            message: 'Avatar render saved successfully',
            avatarRender: user.avatarRender 
        });
    } catch (error) {
        console.error('Error saving avatar render:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.userId
        });
        res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
});

// Update avatar
router.put('/', authenticateToken, async (req, res) => {
    try {
        const { type, itemId } = req.body;
        console.log('Updating avatar:', { 
            userId: req.user.userId, 
            type, 
            itemId,
            timestamp: new Date().toISOString()
        });

        const user = await User.findOne({ userId: req.user.userId })
            .populate('inventory')
            .populate('avatar.shirt');
        
        if (!user) {
            console.error('User not found:', { userId: req.user.userId });
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.avatar) user.avatar = {};
        if (!user.avatarRender) user.avatarRender = {};

        switch (type) {
            case 'shirt':
                if (itemId) {
                    const shirtAsset = await Asset.findOne({
                        _id: itemId,
                        AssetType: 'Shirt',
                        $or: [
                            { _id: { $in: user.inventory } },
                            { creator: user._id }
                        ]
                    });

                    if (!shirtAsset) {
                        console.error('Shirt not accessible:', {
                            userId: req.user.userId,
                            shirtId: itemId
                        });
                        return res.status(400).json({ 
                            error: 'Shirt not in inventory or not created by user'
                        });
                    }

                    console.log('Wearing shirt:', {
                        userId: req.user.userId,
                        shirtId: itemId,
                        shirtDetails: {
                            name: shirtAsset.Name,
                            imageUrl: shirtAsset.imageUrl
                        }
                    });

                    user.avatar.shirt = shirtAsset;
                    user.avatarRender = {
                        ...user.avatarRender,
                        shirt: shirtAsset.imageUrl,
                        displayUrl: shirtAsset.imageUrl,
                        lastUpdated: new Date()
                    };
                } else {
                    console.log('Removing shirt from avatar:', {
                        userId: req.user.userId,
                        previousShirt: user.avatar.shirt
                    });
                    user.avatar.shirt = null;
                    user.avatarRender = {
                        ...user.avatarRender,
                        shirt: null,
                        displayUrl: null,
                        lastUpdated: new Date()
                    };
                }
                break;
        }

        await user.save();
        console.log('Avatar update successful:', {
            userId: req.user.userId,
            newAvatarState: user.avatar,
            newRenderState: user.avatarRender,
            timestamp: new Date().toISOString()
        });

        res.json({
            message: 'Avatar updated successfully',
            avatar: user.avatar,
            avatarRender: user.avatarRender
        });
    } catch (error) {
        console.error('Avatar update failed:', {
            error: error.message,
            stack: error.stack,
            userId: req.user.userId,
            requestBody: req.body
        });
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message
        });
    }
});

module.exports = router;
