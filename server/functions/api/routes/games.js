const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Game = require('../models/Game');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const Filter = require("bad-words");

const filter = new Filter();


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../../../../uploads'))
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname)
    }
  });
  
  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
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

  router.post('/upload', authenticateToken, upload.single('thumbnail'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'Thumbnail file is required' });
    }
  
    const { title, description } = req.body;
  
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
  
    // censor bad words
    if (filter.isProfane(title) || filter.isProfane(description)) {
        return res.status(400).json({ error: 'Your submission contains inappropriate content. Please revise and try again.' });
    }


    const thumbnailUrl = `/uploads/${req.file.filename}`;

    const game = new Game({
      title: filter.clean(title),
      description: filter.clean(description),
      thumbnailUrl,
      creator: req.user.userId
    });
  
    game.save()
      .then(() => User.findByIdAndUpdate(req.user.userId, { $push: { games: game._id } }))
      .then(() => {
        res.status(201).json({ gameId: game._id });
      })
      .catch(error => {
        console.error('Error saving game:', error);
        if (req.file.path) {
          fs.unlink(req.file.path, (unlinkError) => {
            if (unlinkError) console.error('Error deleting file:', unlinkError);
          });
        }
        res.status(500).json({ error: 'Error saving game', details: error.message });
      });
  });

router.get('/:id', async (req, res) => {
    try {
        const game = await Game.findById(req.params.id).populate('creator', 'username');
        if (!game) {
            return res.status(404).json({ error: 'Game not found' });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;