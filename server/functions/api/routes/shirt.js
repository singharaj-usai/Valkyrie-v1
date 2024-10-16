const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Shirt = require('../models/Shirt');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Counter = require('../models/Counter');
const thumbnailQueue = require('../queues/thumbnailQueue');
const jwt = require('jsonwebtoken');
const Filter = require('bad-words');
const crypto = require('crypto'); // Add this line to import the crypto module

const AWS = require('aws-sdk');

const filter = new Filter();

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
});

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }
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


router.get('/user', authenticateToken, async (req, res) => {
  try {
      console.log('Fetching shirts for userId:', req.user.userId);
      const user = await User.findOne({ userId: req.user.userId }).populate('inventory');

      if (!user) {
          console.error('User not found for userId:', req.user.userId);
          return res.status(404).json({ error: 'User not found' });
      }

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 4;
      const skip = (page - 1) * limit;

      // Fetch shirts created by user
      const createdShirts = await Asset.find({
          creator: user._id, 
          AssetType: 'Shirt',
      }).populate('creator', 'username');

      console.log('Created shirts found:', createdShirts.length);

      // Fetch shirts owned by user
      const ownedShirts = await Asset.find({
          _id: { $in: user.inventory },
          AssetType: 'Shirt',
      }).populate('creator', 'username');

      console.log('Owned shirts found:', ownedShirts.length);

      // combine and remove duplicates
      const allShirts = [...createdShirts, ...ownedShirts];
      const uniqueShirts = Array.from(
          new Set(allShirts.map((s) => s._id.toString()))
      ).map((_id) => allShirts.find((s) => s._id.toString() === _id));

      const totalShirts = uniqueShirts.length;
      const totalPages = Math.ceil(totalShirts / limit);
      const paginatedShirts = uniqueShirts.slice(skip, skip + limit);


      console.log('Total  shirts:', uniqueShirts.length);
      console.log('Paginated shirts:', paginatedShirts.length);
      
    res.json({
      shirts: paginatedShirts,
      currentPage: page,
      totalPages: totalPages,
      totalShirts: totalShirts
    });
  
  } catch (error) {
      console.error('Error fetching user shirts:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const shirt = await Asset.findOne({ _id: id, AssetType: 'Shirt' }).populate(
      'creator',
      'username'
    );
    if (!shirt) {
      return res.status(404).json({ error: 'Shirt not found' });
    }
    res.json(shirt);
  } catch (error) {
    console.error('Error fetching shirt:', error);
    res
      .status(500)
      .json({ error: 'Error fetching shirt', details: error.message });
  }
});


router.post(
  '/upload',
  authenticateToken,
  (req, res, next) => {
    const accessToken = req.headers['x-access-token'];
    if (!accessToken) {
      return res
        .status(403)
        .json({ error: 'Access denied. No access token provided.' });
    }
    if (accessToken !== process.env.UPLOAD_ACCESS_KEY) {
      return res
        .status(403)
        .json({ error: 'Access denied. Invalid access token.' });
    }
    next();
  },
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  async (req, res) => {
    if (!req.files.thumbnail) {
      return res.status(400).json({ error: 'Thumbnail file is required' });
    }

    const { title, description, price } = req.body;

    if (!title || !description || !price) {
      return res
        .status(400)
        .json({ error: 'Title, description, and price are required' });
    }

    if (filter.isProfane(title) || filter.isProfane(description)) {
      return res.status(400).json({
        error:
          'Your submission contains inappropriate content. Please revise and try again.',
      });
    }

    const assetHash = generateAssetId();
    const assetId = await getNextAssetId();

    try {
      const thumbnailUrl = `/uploads/${Date.now()}-${
        req.files.thumbnail[0].originalname
      }`;
      fs.writeFileSync(
        path.join(
          __dirname,
          '../../../../uploads',
          path.basename(thumbnailUrl)
        ),
        req.files.thumbnail[0].buffer
      );

      // upload image first
      const s3Key = `shirts/${assetHash}`;
      const assetLocation = `https://c2.rblx18.com/${s3Key}`;
      await s3
        .upload({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: s3Key,
          Body: req.files.thumbnail[0].buffer,
          ContentType: 'image/png',
          ACL: 'public-read',
        })
        .promise();

      // make a new asset for the image
      const asset = new Asset({
        assetId: assetId,
        FileLocation: assetLocation,
        creator: req.user.userId,
        AssetType: 'Image',
        Name: filter.clean(title),
        Description: filter.clean(description),
        ThumbnailLocation: thumbnailUrl,
        IsForSale: 0,
        Price: 0,
        Sales: 0,
        IsPublicDomain: 0,
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

      await s3
        .upload({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: shirts3Key,
          Body: shirtAssetXml,
          ContentType: 'application/octet-stream',
          ACL: 'public-read',
        })
        .promise();

        const isForSale = parseInt(price) > 0 ? 1 : 0;

      const shirt = new Asset({
        assetId: shirtassetId,
        FileLocation: shirtassetLocation,
        creator: req.user.userId,
        AssetType: 'Shirt',
        Name: filter.clean(title),
        Description: filter.clean(description),
        ThumbnailLocation: thumbnailUrl,
        Price: parseInt(price),
        IsForSale: isForSale, //why is there 2 isforsale?
        Sales: 0,
        IsPublicDomain: 0,
      });

      await shirt.save();

      await thumbnailQueue.addToQueue(shirtassetId, 'Shirt');

      await User.findByIdAndUpdate(req.user._id, {
        $push: { shirts: shirt._id },
      });

      res.status(201).json({ shirtId: shirt.assetId, assetId: shirt.assetId });
    } catch (error) {
      console.error('Error saving shirt:', error);
      res
        .status(500)
        .json({ error: 'Error saving shirt', details: error.message });
    }
  }
);

// DELETE /api/shirt/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const shirt = await Asset.findById(req.params.id);
    if (!shirt) {
      return res.status(404).json({ error: 'Shirt not found' });
    }
    if (shirt.creator.toString() !== req.user.userId) {
      return res
        .status(403)
        .json({ error: 'You are not authorized to delete this shirt' });
    }
    await Shirt.findByIdAndDelete(req.params.id);
    res.json({ message: 'Shirt deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/catalog', async (req, res) => {
  try {
    const shirts = await Asset.find({ AssetType: 'Shirt', IsForSale: 1 }).sort({
      createdAt: -1,
    });
    res.json(shirts);
  } catch (error) {
    console.error('Error fetching catalog shirts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/purchase/:id', authenticateToken, async (req, res) => {
  try {
    const shirt = await Asset.findOne({
      _id: req.params.id,
      AssetType: 'Shirt',
      IsForSale: 1,
    });
    if (!shirt) {
      return res.status(404).json({ error: 'Shirt not found or not for sale' });
    }

    const buyer = await User.findById(req.user.userId);
    if (!buyer) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (buyer.inventory && buyer.inventory.includes(shirt._id)) {
      return res.status(400).json({ error: 'You already own this shirt' });
    }

    if (buyer.currency < shirt.Price) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    const seller = await User.findById(shirt.creator);
    if (!seller) {
      return res.status(404).json({ error: 'Shirt creator not found' });
    }

    // Transfer currency from buyer to seller
    buyer.currency -= shirt.Price;
    seller.currency += shirt.Price;

    if (!buyer.inventory) {
      buyer.inventory = [];
    }

    buyer.inventory.push(shirt._id);
    await buyer.save();
    await seller.save();

    shirt.Sales += 1;
    await shirt.save();

    res.json({ success: true, newBalance: buyer.currency });
  } catch (error) {
    console.error('Error purchasing shirt:', error);
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
});
router.get('/check-ownership/:id', authenticateToken, async (req, res) => {
  try {
    const shirt = await Asset.findOne({
      _id: req.params.id,
      AssetType: 'Shirt',
    });
    if (!shirt) {
      return res.status(404).json({ error: 'Shirt not found' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const owned = user.inventory && user.inventory.includes(shirt._id);
    const isCreator = shirt.creator.toString() === user._id.toString();

    // Include the shirt's price in the response
    res.json({ owned, isCreator, price: shirt.Price });
  } catch (error) {
    console.error('Error checking shirt ownership:', error);
    res
      .status(500)
      .json({ error: 'Internal server error', details: error.message });
  }
});

router.get('/user/id/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const createdShirts = await Asset.find({
      creator: userId,
      AssetType: 'Shirt',
    }).sort({ createdAt: -1 });
    const ownedShirts = await Asset.find({
      _id: { $in: user.inventory },
      AssetType: 'Shirt',
    }).sort({ createdAt: -1 });
    const allShirts = [...createdShirts, ...ownedShirts];
    const uniqueShirts = Array.from(
      new Set(allShirts.map((s) => s._id.toString()))
    ).map((_id) => allShirts.find((s) => s._id.toString() === _id));

    res.json(uniqueShirts);
  } catch (error) {
    console.error('Error fetching user shirts by ID:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



router.get('/user', authenticateToken, async (req, res) => {
  try {
      console.log('Fetching shirts for userId:', req.user.userId);
      const user = await User.findOne({ userId: req.user.userId }).populate('inventory');

      if (!user) {
          console.error('User not found for userId:', req.user.userId);
          return res.status(404).json({ error: 'User not found' });
      }

      // Fetch shirts created by user
      const createdShirts = await Asset.find({
          creator: user._id, // Using ObjectId from User model
          AssetType: 'Shirt',
      }).populate('creator', 'username');

      console.log('Created shirts found:', createdShirts.length);

      // Fetch shirts owned by user
      const ownedShirts = await Asset.find({
          _id: { $in: user.inventory },
          AssetType: 'Shirt',
      }).populate('creator', 'username');

      console.log('Owned shirts found:', ownedShirts.length);

      // combine and remove duplicates
      const allShirts = [...createdShirts, ...ownedShirts];
      const uniqueShirts = Array.from(
          new Set(allShirts.map((s) => s._id.toString()))
      ).map((_id) => allShirts.find((s) => s._id.toString() === _id));

      console.log('Total  shirts:', uniqueShirts.length);
      res.json(uniqueShirts);
  } catch (error) {
      console.error('Error fetching user shirts:', error);
      res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

router.put('/:shirtId', authenticateToken, async (req, res) => {
  try {
    const { shirtId } = req.params;
    const { title, description, price } = req.body;

    if (!title || !description || price === undefined) {
      return res
        .status(400)
        .json({ error: 'Title, description, and price are required' });
    }

    if (filter.isProfane(title) || filter.isProfane(description)) {
      return res.status(400).json({
        error:
          'Your submission contains inappropriate content. Please revise and try again.',
      });
    }

    const updatedShirt = await Asset.findOneAndUpdate(
      { _id: shirtId, creator: req.user.userId, AssetType: 'Shirt' },
      {
        Name: filter.clean(title),
        Description: filter.clean(description),
        Price: parseInt(price),
        IsForSale: parseInt(price) > 0 ? 1 : 0,
      },
      { new: true }
    );

    if (!updatedShirt) {
      return res.status(404).json({
        error: 'Shirt not found or you do not have permission to edit it',
      });
    }

    res.json(updatedShirt);
  } catch (error) {
    console.error('Error updating shirt:', error);
    res
      .status(500)
      .json({ error: 'An error occurred while updating the shirt' });
  }
});

// New route to update a game
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // Check if the shirt exists and belongs to the current user
    const shirt = await Asset.findOne({
      _id: id,
      AssetType: 'Shirt',
      creator: req.user.userId,
    });
    if (!shirt) {
      return res.status(404).json({
        error: 'Shirt not found or you do not have permission to edit it',
      });
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
    res
      .status(500)
      .json({ error: 'Error updating shirt', details: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const shirt = await Asset.findOne({ _id: id, AssetType: 'Shirt' }).populate(
      'creator',
      'username'
    );
    if (!shirt) {
      return res.status(404).json({ error: 'Shirt not found' });
    }
    res.json(shirt);
  } catch (error) {
    console.error('Error fetching shirt:', error);
    res
      .status(500)
      .json({ error: 'Error fetching shirt', details: error.message });
  }
});

router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const username = req.params.username;
    const user = await User.findOne({ username: username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const createdShirts = await Asset.find({
      creator: user.userId, // Use userId (Number)
      AssetType: 'Shirt',
    }).sort({ createdAt: -1 });
    const ownedShirts = await Asset.find({
      _id: { $in: user.inventory },
      AssetType: 'Shirt',
    }).sort({ createdAt: -1 });
    const allShirts = [...createdShirts, ...ownedShirts];
    const uniqueShirts = Array.from(
      new Set(allShirts.map((s) => s._id.toString()))
    ).map((_id) => allShirts.find((s) => s._id.toString() === _id));

    // Fetch all unique creators
    const creatorIds = uniqueShirts.map(shirt => shirt.creator);
    const creators = await User.find({ userId: { $in: creatorIds } });
    const creatorMap = {};
    creators.forEach(user => {
      creatorMap[user.userId] = user.username;
    });

    // Append username to each shirt
    const shirtsWithUsernames = uniqueShirts.map(shirt => ({
      ...shirt.toObject(),
      creatorUsername: creatorMap[shirt.creator] || 'Unknown',
    }));

    res.json(shirtsWithUsernames);
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
