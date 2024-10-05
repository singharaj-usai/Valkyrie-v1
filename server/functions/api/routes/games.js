const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Game = require('../models/Game');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Filter = require("bad-words");
const crypto = require('crypto'); // Add this line to import the crypto module



const filter = new Filter();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      const uploadPath = process.env.NODE_ENV === 'production' ? '/tmp/uploads' : path.join(__dirname, '../../../../uploads');
      cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname);
    }
});

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
        const games = await Game.find().populate('creator', 'username');
        res.json(games);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
    {name: 'rbxlFile', maxCount: 1}

  ]), (req, res) => {
    if (!req.files['thumbnail'] || !req.files['rbxlFile']) {
      return res.status(400).json({ error: 'Both thumbnail and .rbxl file are required' });
  }
  
    const { title, description, genre, maxPlayers, year } = req.body;
  
    if (!title || !description || !genre || !maxPlayers || !year) {
      return res.status(400).json({ error: 'Title, description, genre, max players, and year are required' });
    }
  
    // censor bad words
    if (filter.isProfane(title) || filter.isProfane(description)) {
        return res.status(400).json({ error: 'Your submission contains inappropriate content. Please revise and try again.' });
    }
  
    const thumbnailUrl = `/uploads/${req.files['thumbnail'][0].filename}`;
    console.log('Saved thumbnailUrl:', thumbnailUrl);

    const rbxlFileUrl = `/uploads/${req.files['rbxlFile'][0].filename}`;
    console.log('Saved rbxlFileUrl:', rbxlFileUrl);
  
    const assetId = generateAssetId();


    const game = new Game({
      title: filter.clean(title),
      description: filter.clean(description),
      thumbnailUrl,
      rbxlFile: rbxlFileUrl,
      assetId,
      creator: req.user.userId,
      genre,
      maxPlayers: parseInt(maxPlayers, 10),
      year: parseInt(year, 10)
    });
  
    game.save()
      .then(() => User.findByIdAndUpdate(req.user.userId, { $push: { games: game._id } }))
      .then(() => {
        res.status(201).json({ gameId: game._id });
      })
      .catch(error => {
        console.error('Error saving game:', error);
        if (req.files['thumbnail'] && req.files['thumbnail'][0].path) {
          fs.unlink(req.files['thumbnail'][0].path, (unlinkError) => {
              if (unlinkError) console.error('Error deleting thumbnail:', unlinkError);
          });
      }
      if (req.files['rbxlFile'] && req.files['rbxlFile'][0].path) {
          fs.unlink(req.files['rbxlFile'][0].path, (unlinkError) => {
              if (unlinkError) console.error('Error deleting .rbxl file:', unlinkError);
          });
      }
        res.status(500).json({ error: 'Error saving game', details: error.message });
      });
  });

  // DELETE /api/games/:id
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id);
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        if (game.creator.toString() !== req.user.userId) {
            return res.status(403).json({ error: 'You are not authorized to delete this game' });
        }
        await Game.findByIdAndDelete(req.params.id);
        res.json({ message: 'Game deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
  
  router.get('/user', authenticateToken, async (req, res) => {
    try {
      const games = await Game.find({ creator: req.user.userId }).sort({ updatedAt: -1 });
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // New route to update a game
  router.put('/:id', authenticateToken, upload.single('thumbnail'), async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description, genre, maxPlayers, year } = req.body;
  
      // Check if the game exists and belongs to the current user
      const game = await Game.findOne({ _id: id, creator: req.user.userId });
      if (!game) {
        return res.status(404).json({ error: 'Game not found or you do not have permission to edit it' });
      }
  
      // Update game details
      game.title = filter.clean(title);
      game.description = filter.clean(description);
      game.genre = genre || game.genre;
      game.maxPlayers = maxPlayers ? parseInt(maxPlayers, 10) : game.maxPlayers;
      game.year = year ? parseInt(year, 10) : null;
      game.updatedAt = new Date(); // Explicitly set the updatedAt field
  
      // If a new thumbnail is uploaded, update it
      if (req.file) {
        // Delete the old thumbnail file
        if (game.thumbnailUrl) {
          const oldThumbnailPath = path.join(__dirname, '../../../../uploads', path.basename(game.thumbnailUrl));
          fs.unlink(oldThumbnailPath, (err) => {
            if (err) console.error('Error deleting old thumbnail:', err);
          });
        }
  
        // Set the new thumbnail URL
        game.thumbnailUrl = `/uploads/${req.file.filename}`;
      }
  
      // Save the updated game
      await game.save();
  
      res.json(game);
    } catch (error) {
      console.error('Error updating game:', error);
      res.status(500).json({ error: 'Error updating game', details: error.message, stack: error.stack });
    }
  });

router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('creator', 'username');
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        console.error('Error fetching game:', error);
        res.status(500).json({ error: 'Error fetching game', details: error.message });
    }
});

router.get('/user/:username', authenticateToken, async (req, res) => {
    try {
      const username = req.params.username;
      const user = await User.findOne({ username: username });
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const games = await Game.find({ creator: user._id }).sort({ createdAt: -1 });
      res.json(games);
    } catch (error) {
      console.error('Error fetching user games:', error);
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