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
    return res.status(400).json({ error: 'Thumbnail file is required' });
  }

  const { title, description, price } = req.body;

  if (!title || !description || !price) {
    return res.status(400).json({ error: 'Title, description, and price are required' });
  }

  if (filter.isProfane(title) || filter.isProfane(description)) {
      return res.status(400).json({ error: 'Your submission contains inappropriate content. Please revise and try again.' });
  }

  const assetHash = generateAssetId();
  const assetId = await getNextAssetId();

  try {
      const thumbnailUrl = `/uploads/${Date.now()}-${req.files['thumbnail'][0].originalname}`;
      fs.writeFileSync(path.join(__dirname, '../../../../uploads', path.basename(thumbnailUrl)), req.files['thumbnail'][0].buffer);

      // upload image first
      const s3Key = `shirts/${assetHash}`;
      const assetLocation = `https://c2.rblx18.com/${s3Key}`;
      await s3.upload({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
          Body: req.files['thumbnail'][0].buffer,
          ContentType: 'image/png',
          ACL: 'public-read'
      }).promise();

      // make a new asset for the image
      const asset = new Asset({
            assetId: assetId,
            FileLocation: assetLocation,
            creator: req.user.userId,
            AssetType: "Image",
            Name: filter.clean(title),
            Description: filter.clean(description),
            ThumbnailLocation: thumbnailUrl,
            IsForSale: 0,
            Price: 0,
            Sales: 0,
            IsPublicDomain: 0
        });
    
      await asset.save();

      // get the next asset id for the shirt
      const shirtassetId = await getNextAssetId();
      const shirtassetHash = generateAssetId();

      // generate xml for shirttemplate
      const shirtAssetUrl = `http://www.rblx18.com/asset/?id=${assetId}`;
      const shirtAssetXml = generateXml(shirtAssetUrl);

      // upload the xml
      const shirts3Key = `${shirtassetHash}`;
      const shirtassetLocation = `https://c2.rblx18.com/${shirtassetHash}`;
    
      await s3.upload({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: shirts3Key,
          Body: shirtAssetXml,
          ContentType: 'application/octet-stream',
          ACL: 'public-read'
      }).promise();

      const shirt = new Asset({
            assetId: shirtassetId,
            FileLocation: shirtassetLocation,
            creator: req.user.userId,
            AssetType: "Shirt",
            Name: filter.clean(title),
            Description: filter.clean(description),
            ThumbnailLocation: thumbnailUrl,
            IsForSale: 0,
            Price: parseInt(price),
            IsForSale: 1,
            Sales: 0,
            IsPublicDomain: 0
        });
    
      await shirt.save();
    
      /*const shirt = new Shirt({
          title: filter.clean(title),
          description: filter.clean(description),
          thumbnailUrl,
          creator: req.user.userId,
          assetId: assetId
      });

      await shirt.save();*/
      await User.findByIdAndUpdate(req.user.userId, { $push: { shirts: shirt._id } });

      res.status(201).json({ shirtId: shirt._id, assetId: shirt.assetId });
  } catch (error) {
      console.error('Error saving shirt:', error);
      res.status(500).json({ error: 'Error saving shirt', details: error.message });
  }
});

  // DELETE /api/shirt/:id
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const shirt = await Asset.findById(req.params.id);
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

router.get('/catalog', async (req, res) => {
  try {
      const shirts = await Asset.find({ AssetType: 'Shirt', IsForSale: 1 }).sort({ createdAt: -1 });
      res.json(shirts);
  } catch (error) {
      console.error('Error fetching catalog shirts:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/purchase/:id', authenticateToken, async (req, res) => {
  try {
      const shirt = await Asset.findOne({ _id: req.params.id, AssetType: 'Shirt', IsForSale: 1 });
      if (!shirt) {
          return res.status(404).json({ error: 'Shirt not found or not for sale' });
      }

      const user = await User.findById(req.user.userId);
      if (user.currency < shirt.Price) {
          return res.status(400).json({ error: 'Insufficient funds' });
      }

      if (shirt.creator.toString() === user._id.toString()) {
          return res.status(400).json({ error: 'You already own this shirt' });
      }

      user.currency -= shirt.Price;
      user.inventory.push(shirt._id);
      await user.save();

      shirt.Sales += 1;
      await shirt.save();

      res.json({ success: true, newBalance: user.currency });
  } catch (error) {
      console.error('Error purchasing shirt:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});
  
  router.get('/user', authenticateToken, async (req, res) => {
    try {
      const shirts = await Asset.find({ creator: req.user.userId, AssetType: 'Shirt' }).sort({ updatedAt: -1 });
      res.json(shirts);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.put('/:shirtId', authenticateToken, async (req, res) => {
    try {
      const { shirtId } = req.params;
      const { title, description, price } = req.body;
  
      if (!title || !description || price === undefined) {
        return res.status(400).json({ error: 'Title, description, and price are required' });
      }
  
      if (filter.isProfane(title) || filter.isProfane(description)) {
        return res.status(400).json({ error: 'Your submission contains inappropriate content. Please revise and try again.' });
      }
  
      const updatedShirt = await Asset.findOneAndUpdate(
        { _id: shirtId, creator: req.user.userId, AssetType: "Shirt" },
        {
          Name: filter.clean(title),
          Description: filter.clean(description),
          Price: parseInt(price),
          IsForSale: parseInt(price) > 0 ? 1 : 0
        },
        { new: true }
      );
  
      if (!updatedShirt) {
        return res.status(404).json({ error: 'Shirt not found or you do not have permission to edit it' });
      }
  
      res.json(updatedShirt);
    } catch (error) {
      console.error('Error updating shirt:', error);
      res.status(500).json({ error: 'An error occurred while updating the shirt' });
    }
  });
  
  // New route to update a game
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const { id } = req.params;
      const { title, description } = req.body;
  
      // Check if the shirt exists and belongs to the current user
      const shirt = await Asset.findOne({ _id: id, AssetType: 'Shirt', creator: req.user.userId });
      if (!shirt) {
        return res.status(404).json({ error: 'Shirt not found or you do not have permission to edit it' });
      }
  
      // Update shirt details
      shirt.title = filter.clean(title);
      shirt.description = filter.clean(description);
      shirt.updatedAt = new Date();
  
      // Save the updated shirt
      await shirt.save();
  
      res.json(shirt);
    } catch (error) {
      console.error('Error updating shirt:', error);
      res.status(500).json({ error: 'Error updating shirt', details: error.message });
    }
  });

  router.get('/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const shirt = await Asset.findOne({ _id: id, AssetType: 'Shirt' }).populate('creator', 'username');
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
        const createdShirts = await Asset.find({ creator: user._id, AssetType: 'Shirt' }).sort({ createdAt: -1 });
        const ownedShirts = await Asset.find({ _id: { $in: user.inventory }, AssetType: 'Shirt' }).sort({ createdAt: -1 });
        const allShirts = [...createdShirts, ...ownedShirts];
        const uniqueShirts = Array.from(new Set(allShirts.map(s => s._id.toString())))
            .map(_id => allShirts.find(s => s._id.toString() === _id));
        res.json(uniqueShirts);
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

// create a universal func for this later
function generateXml(assetUrl) {
  return `
<roblox xmlns:xmime="http://www.w3.org/2005/05/xmlmime" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:noNamespaceSchemaLocation="http://www.roblox.com/roblox.xsd" version="4">
  <External>null</External>
  <External>nil</External>
  <Item class="Shirt" referent="RBX0">
    <Properties>
      <Content name="ShirtTemplate">
        <url>${assetUrl}</url>
      </Content>
      <string name="Name">Shirt</string>
      <bool name="archivable">true</bool>
    </Properties>
  </Item>
</roblox>`;
}

module.exports = router;
