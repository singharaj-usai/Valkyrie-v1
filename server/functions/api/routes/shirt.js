const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Shirt = require('../models/Shirt');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Counter = require('../models/Counter');
const jwt = require('jsonwebtoken');
const Filter = require("bad-words");
const crypto = require('crypto'); // Add this line to import the crypto module

const AWS = require('aws-sdk');


const filter = new Filter();


// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();




const storage = multer.memoryStorage();


const upload = multer({ 
    storage: storage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
  
    if (token == null) return res.sendStatus(401);
  
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  router.get('/', async (req, res) => {
    try {
        const shirts = await Shirt.find().populate('creator', 'username');
        res.json(shirts);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

async function getNextAssetId() {
    const counter = await Counter.findOneAndUpdate(
        { _id: 'assetId' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
    );
    return counter.seq;
}

router.post('/upload', authenticateToken, (req, res, next) => {
    const accessToken = req.headers['x-access-token'];
    if (!accessToken) {
      return res.status(403).json({ error: 'Access denied. No access token provided.' });
    }
    if (accessToken !== process.env.UPLOAD_ACCESS_KEY) {
        return res.status(403).json({ error: 'Access denied. Invalid access token.' });
    }
    next();
  }, upload.fields([
    {name: 'thumbnail', maxCount: 1},

  ]), async (req, res) => {
    if (!req.files['thumbnail']) {
      return res.status(400).json({ error: 'thumbnail file are required' });
  }
  
    const { title, description } = req.body;
  
    if (!title || !description) {
      return res.status(400).json({ error: 'Title, description are required' });
    }
  
    // censor bad words
    if (filter.isProfane(title) || filter.isProfane(description)) {
        return res.status(400).json({ error: 'Your submission contains inappropriate content. Please revise and try again.' });
    }
  
       const assetHash = generateAssetId(); // rename this to generateAssetHash
       const assetId = await getNextAssetId();

    try {
        // Upload thumbnail to local storage
        const thumbnailUrl = `/uploads/${Date.now()}-${req.files['thumbnail'][0].originalname}`;
        fs.writeFileSync(path.join(__dirname, '../../../../uploads', path.basename(thumbnailUrl)), req.files['thumbnail'][0].buffer);

        // Upload .rbxl file to S3
        const rbxlKey = `${assetHash}`; // more hidden
        const AssetLocation = `https://c2.rblx18.com/${assetHash}`;
        await s3.upload({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: rbxlKey,
            Body: req.files['thumbnail'][0].buffer,
            ContentType: 'image/png',
            ACL: 'public-read'
        }).promise();

      const asset = new Asset({
            assetId: assetId,
            FileLocation: AssetLocation,
            creator: req.user.userId
        });

        await asset.save();

        const game = new Game({
            title: filter.clean(title),
            description: filter.clean(description),
            thumbnailUrl,
        });

        await game.save();
        await User.findByIdAndUpdate(req.user.userId, { $push: { games: game._id } });

        res.status(201).json({ gameId: game._id, assetId: game.assetId });
    } catch (error) {
        console.error('Error saving game:', error);
        res.status(500).json({ error: 'Error saving game', details: error.message });
    }
});

  // DELETE /api/shirt/:id
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const shirt = await Shirt.findById(req.params.id);
        if (!shirt) {
            return res.status(404).json({ error: 'Shirt not found' });
        }
        if (shirt.creator.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this shirt' });
        }
        await Shirt.findByIdAndDelete(req.params.id);
        res.json({ message: 'Shirt deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
  router.get('/user', authenticateToken, async (req, res) => {
    try {
      const shirts = await Shirt.find({ creator: req.user.userId }).sort({ updatedAt: -1 });
      res.json(shirts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // New route to update a game
  router.put('/:id', authenticateToken, upload.single('thumbnail'), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
  
      // Check if the game exists and belongs to the current user
      const shirt = await Shirt.findOne({ _id: id, creator: req.user.userId });
      if (!shirt) {
        return res.status(404).json({ error: 'Shirt not found or you do not have permission to edit it' });
      }
  
      // Update shirt details
      shirt.title = filter.clean(title);
      shirt.description = filter.clean(description);
      shirt.updatedAt = new Date(); // Explicitly set the updatedAt field
  
      // If a new thumbnail is uploaded, update it
      if (req.file) {
        // Delete the old thumbnail file
        if (shirt.thumbnailUrl) {
          const oldThumbnailPath = path.join(__dirname, '../../../../uploads', path.basename(shirt.thumbnailUrl));
          fs.unlink(oldThumbnailPath, (err) => {
            if (err) console.error('Error deleting old thumbnail:', err);
          });
        }
  
        // Set the new thumbnail URL
        shirt.thumbnailUrl = `/uploads/${req.file.filename}`;
      }
  
      // Save the updated game
      await game.save();
  
      res.json(shirt);
    } catch (error) {
      console.error('Error updating shirt:', error);
      res.status(500).json({ error: 'Error updating shirt', details: error.message, stack: error.stack });
    }
  });

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const shirt = await Shirt.findById(req.params.id).populate('creator', 'username');
        if (!shirt) {
            return res.status(404).json({ error: 'Shirt not found' });
        }
        res.json(shirt);
    } catch (error) {
        console.error('Error fetching shirt:', error);
        res.status(500).json({ error: 'Error fetching shirt', details: error.message });
    }
});

router.get('/user/:username', authenticateToken, async (req, res) => {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username: username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const shirts = await Shirt.find({ creator: user._id }).sort({ createdAt: -1 });
      res.json(shirts);
    } catch (error) {
      console.error('Error fetching user shirts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Function to generate a unique asset ID
function generateAssetId() {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(5).toString('hex');
  return `${timestamp}-${randomStr}`;
}

module.exports = router;
