const express = require('express');
const router = express.Router();
const Asset = require('../models/Asset');

router.get('/shirts', async (req, res) => {
    try {
        const shirts = await Asset.find({ AssetType: 'Shirt' })
            .sort({ createdAt: -1 })
            .populate('creator', 'username');
        res.json(shirts);
    } catch (error) {
        console.error('Error fetching catalog shirts:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
module.exports = router;