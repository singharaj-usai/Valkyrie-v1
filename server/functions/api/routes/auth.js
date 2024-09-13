const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const moment = require("moment-timezone");
//const csrf = require("csurf");
const requestIp = require('request-ip');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { sendVerificationEmail } = require('../utils/emailService');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth header:', authHeader);
  console.log('Token:', token);

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_development', (err, user) => {
    if (err) {
      console.error('Token verification error:', err);
      return res.sendStatus(403);
    }
    console.log('Decoded user:', user);
    req.user = user;
    next();
  });
}

const router = express.Router();

// Setup CSRF protection
//const csrfProtection = csrf({ cookie: true });



// Helper function to get IP address
function getClientIp(req) {
  // For testing purposes, check for a custom header first
  const testIp = req.header('X-Test-IP');
  if (testIp) {
    return testIp;
  }
  return requestIp.getClientIp(req);
}


// Validation middleware
const validateUser = [
  body("username")
    .isLength({ min: 3, max: 18 })
    .withMessage("Username must be between 3 and 18 characters")
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage("Username must contain only letters and numbers")
    .custom((value) => {
      const lowercaseValue = value.toLowerCase();
      if (inappropriateWords.some(word => lowercaseValue.includes(word))) {
        throw new Error("Username contains inappropriate language");
      }
      return true;
    })
    .custom((value) => {
      const inappropriateWords = ['nlgga', 'nigga', 'sex', 'raping', 'tits', 'wtf', 'vag', 'diemauer', 'brickopolis', '.com', '.cf', 'dicc', 'nude', 'kesner', 'nobe', 'idiot', 'dildo', 'cheeks', 'anal', 'boob', 'horny', 'tit', 'fucking', 'gay', 'rape', 'rapist', 'incest', 'beastiality', 'cum', 'maggot', 'bloxcity', 'bullshit', 'fuck', 'penis', 'dick', 'vagina', 'faggot', 'fag', 'nigger', 'asshole', 'shit', 'bitch', 'anal', 'stfu', 'cunt', 'pussy', 'hump', 'meatspin', 'redtube', 'porn', 'kys', 'xvideos', 'hentai', 'gangbang', 'milf', 'whore', 'cock', 'masturbate']; // Add more inappropriate words as needed
      const lowercaseValue = value.toLowerCase();
      if (inappropriateWords.some(word => lowercaseValue.includes(word))) {
        throw new Error("Username contains inappropriate language");
      }
      return true;
    }),
  body("email")
    .isEmail()
    .withMessage("Invalid email address")
    .normalizeEmail()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("Email is already in use");
      }
      
      // Check for valid email domains
      const validDomains = ['outlook.com', 'protonmail.com', 'xdiscuss.net', 'roblox.com', 'icloud.com', 'protonmail.ch', 'google.com',
        "yahoo.com.br", "hotmail.com.br", "outlook.com.br", "uol.com.br", "bol.com.br", "terra.com.br", "ig.com.br", "itelefonica.com.br", "r7.com", "zipmail.com.br", "globo.com", "globomail.com", "oi.com.br",
        "yahoo.com.mx", "live.com.mx", "hotmail.es", "hotmail.com.mx", "prodigy.net.mx",
        "hotmail.com.ar", "live.com.ar", "yahoo.com.ar", "fibertel.com.ar", "speedy.com.ar", "arnet.com.ar",
        "hotmail.be", "live.be", "skynet.be", "voo.be", "tvcablenet.be", "telenet.be",
        "mail.ru", "rambler.ru", "yandex.ru", "ya.ru", "list.ru",
        "gmx.de", "hotmail.de", "live.de", "online.de", "t-online.de", "web.de", "yahoo.de",
        "hotmail.fr", "live.fr", "laposte.net", "yahoo.fr", "wanadoo.fr", "orange.fr", "gmx.fr", "sfr.fr", "neuf.fr", "free.fr",
        "sina.com", "qq.com", "naver.com", "hanmail.net", "daum.net", "nate.com", "yahoo.co.jp", "yahoo.co.kr", "yahoo.co.id", "yahoo.co.in", "yahoo.com.sg", "yahoo.com.ph",
        "btinternet.com", "virginmedia.com", "blueyonder.co.uk", "freeserve.co.uk", "live.co.uk",
        "ntlworld.com", "o2.co.uk", "orange.net", "sky.com", "talktalk.co.uk", "tiscali.co.uk",
        "virgin.net", "wanadoo.co.uk", "bt.com", "bellsouth.net", "charter.net", "cox.net", "earthlink.net", "juno.com",
        "email.com", "games.com", "gmx.net", "hush.com", "hushmail.com", "icloud.com", "inbox.com",
        "lavabit.com", "love.com", "outlook.com", "pobox.com", "rocketmail.com",
        "safe-mail.net", "wow.com", "ygm.com", "ymail.com", "zoho.com", "fastmail.fm",
        "yandex.com", "iname.com", "aol.com", "att.net", "comcast.net", "facebook.com", "gmail.com", "gmx.com", "googlemail.com",
        "google.com", "hotmail.com", "hotmail.co.uk", "mac.com", "me.com", "mail.com", "msn.com",
        "live.com", "sbcglobal.net", "verizon.net", "yahoo.com", "yahoo.co.uk"
      ];
      const domain = value.split('@')[1];
      if (!validDomains.includes(domain)) {
        throw new Error("Invalid email domain");
      }
    }),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
  // .matches(/\d/).withMessage('Password must contain at least one number')
  // .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  // .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  // .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body("confirmPassword").custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error("Password confirmation does not match password");
    }
    return true;
  }),
];

router.post("/register", validateUser, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const clientIp = requestIp.getClientIp(req);
    const verificationToken = crypto.randomBytes(20).toString('hex');


    const user = new User({
      username,
      email,
      password: hashedPassword,
      signupDate: moment().tz("America/New_York").toDate(),
      signupIp: clientIp,
      verificationToken
    });

    await user.save();
    await sendVerificationEmail(email, verificationToken, req);
    res.status(201).json({ message: "User created successfully. Please check your email to verify your account." });
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Error creating user", details: error.message || "Unknown error" });
    }
  }
});

// Step 1: Validate user input
router.post("/register-validate", validateUser, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  res.status(200).json({ message: "Validation successful" });
});

// Step 2: Create user
router.post("/register-create", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const clientIp = getClientIp(req);
   // const verificationToken = crypto.randomBytes(20).toString('hex');

   const existingUsername = await User.findOne({ username });
   if (existingUsername) {
     return res.status(409).json({ message: "Username already exists" });
   }

    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ message: "Email already exists" });
    }

    const user = new User({
      username,
      email,
      password: hashedPassword,
      signupDate: moment().tz("America/New_York").toDate(),
      signupIp: clientIp,
      isVerified: true // Set the user as verified by default
    //  verificationToken
    });

    //const baseUrl = `${req.protocol}://${req.get('host')}`;
    //try {
     // await sendVerificationEmail(email, verificationToken, baseUrl);
      //res.status(201).json({ 
       // message: "User created successfully. Please check your email to verify your account."
     // });
  //  } catch (emailError) {
  //    console.error("Error sending verification email:", emailError);
  //    // Instead of sending a 201 status, send a 500 status with more detailed error information
  //    res.status(500).json({ 
  //      message: "User created successfully, but there was an issue sending the verification email.",
  //      error: emailError.message
  //    });
  //  }
  await user.save();
  res.status(201).json({ message: "User registered successfully" });
} catch (error) {
  console.error("Registration error:", error);
  res.status(500).json({ message: "An error occurred during registration" });
}
});

router.get("/verify-email/:token", async (req, res) => {
  try {
    const user = await User.findOne({ verificationToken: req.params.token });
    if (!user) {
      return res.status(400).send("Invalid or expired verification token");
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.redirect('/login.html?verified=true');
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).send("Error verifying email");
  }
});

router.get("/validate-session", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_development');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    res.status(200).json({ message: "Session is valid", username: user.username });
  } catch (error) {
    console.error("Session validation error:", error);
    res.status(401).json({ error: "Invalid session" });
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: { $regex: new RegExp(`^${username}$`, 'i') } });
    if (!user) {
      return res.status(400).json({ message: "Invalid username" });
    }

    
    //if (!user.isVerified) {
    //  return res.status(403).send("Please verify your email before logging in");
   // }

    const isValidPassword = await bcrypt.compare(password, user.password); //password === user.password; //await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ message: "Invalid password" });
    }


    const clientIp = requestIp.getClientIp(req);
    user.lastLoggedIn = moment().tz("America/New_York").toDate();
    user.lastLoginIp = clientIp;
    await user.save();

   
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      username: user.username,
      signupDate: user.signupDate,
      lastLoggedIn: user.lastLoggedIn
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Error logging in");
  }
});

// Logout endpoint
router.post("/logout", async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.json({ message: 'Logged out successfully' });
  });
});


//router.get("/csrf-token", (req, res) => {
//  const csrfToken = req.csrfToken();
//  res.json({ csrfToken });
//});


// Search users endpoint
router.get("/search", async (req, res) => {
  try {
    const { username } = req.query;
    const users = await User.find({ 
      username: new RegExp(username, 'i') 
    }).select('username signupDate lastLoggedIn blurb');
    //res.status(500).send("Error searching users");
    res.json(users.map(user => ({
      username: user.username,
      signupDate: user.signupDate,
      lastLoggedIn: user.lastLoggedIn,
      blurb: user.blurb,
      isOnline: user.isOnline,
      lastActiveAt: user.lastActiveAt,
    })));
  } catch (error) {
    console.error("Error searching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// User profile endpoint
router.get('/user/:username', authenticateToken, async (req, res) => {
  try {
    const { username } = req.params;
    const currentUser = await User.findById(req.user.userId);
    const user = await User.findOne({ username }).select('username signupDate lastLoggedIn blurb friendRequests friends sentFriendRequests');
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFriend = currentUser.friends.includes(user._id);
    const friendRequestSent = user.friendRequests.includes(currentUser._id);
    const friendRequestReceived = currentUser.friendRequests.includes(user._id);

    const userObject = user.toObject();
    delete userObject.friendRequests;
    delete userObject.friends;
    delete userObject.sentFriendRequests;

    res.json({
      ...userObject,
      isFriend,
      friendRequestSent,
      friendRequestReceived
    });
  } catch (error) {
    console.error('User profile error:', error);
    res.status(500).json({ error: 'Error fetching user profile' });
  }
});


/* router.get('/user/:username', async (req, res) => {
  try {
      const { username } = req.params;
      const user = await User.findOne({ username }, 'username signupDate lastLoggedIn blurb');
      if (!user) {
          return res.status(404).send('User not found');
      }
      res.json(user);
  } catch (error) {
      console.error('User profile error:', error);
      res.status(500).send('Error fetching user profile');
  }
}); */


// Get number of registered users
router.get("/user-count", async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (error) {
    console.error("Error fetching user count:", error);
    res.status(500).send("Error fetching user count");
  }
});

router.post("/claim-daily-currency", async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = moment().tz("America/New_York");
    const lastClaim = moment(user.lastCurrencyClaimDate).tz("America/New_York");

    if (!user.lastCurrencyClaimDate || now.diff(lastClaim, 'days') >= 1) {
      user.currency += 10;
      user.lastCurrencyClaimDate = now.toDate();
      await user.save();
      res.json({ success: true, newBalance: user.currency });
    } else {
      res.status(400).json({ error: "You can only claim currency once per day" });
    }
  } catch (error) {
    console.error("Error claiming daily currency:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/user-info", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_development');
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      username: user.username,
      currency: user.currency
    });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/user/blurb", async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key_for_development');
    } catch (err) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const userId = decoded.userId;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { blurb } = req.body;
    if (typeof blurb !== 'string' || blurb.length > 500) {
      return res.status(400).json({ error: "Invalid blurb" });
    }

    const user = await User.findByIdAndUpdate(userId, { blurb }, { new: true });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ blurb: user.blurb });
  } catch (error) {
    console.error("Error updating user blurb:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Send friend request
router.post('/send-friend-request/:userId', authenticateToken, async (req, res) => {
  try {
    console.log('Authenticated user:', req.user);
    console.log('Target user ID:', req.params.userId);

    const sender = await User.findById(req.user.userId);
    const receiver = await User.findById(req.params.userId);

    console.log('Sender:', sender);
    console.log('Receiver:', receiver);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (sender.friends.includes(receiver._id)) {
      return res.status(400).json({ error: 'You are already friends with this user' });
    }

    if (receiver.friendRequests.includes(sender._id) || sender.friendRequests.includes(receiver._id)) {
      return res.status(400).json({ error: 'A friend request already exists between you and this user' });
    }

    if (sender.sentFriendRequests.includes(receiver._id)) {
      return res.status(400).json({ error: 'You have already sent a friend request to this user' });
    }

    receiver.friendRequests.push(sender._id);
    await receiver.save();

    sender.sentFriendRequests.push(receiver._id);
    await sender.save();


    console.log('Friend request sent successfully');
    res.json({ message: 'Friend request sent successfully' });
  } catch (error) {
    console.error("Error sending friend request:", error);
    res.status(500).json({ error: 'Error sending friend request' });
  }
});

// Accept friend request
router.post('/accept-friend-request/:userId', authenticateToken, async (req, res) => {
  try {
    const receiver = await User.findById(req.user.userId);
    const sender = await User.findById(req.params.userId);

    if (!sender || !receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!receiver.friendRequests.includes(sender._id)) {
      return res.status(400).json({ error: 'No friend request from this user' });
    }

    receiver.friendRequests = receiver.friendRequests.filter(id => !id.equals(sender._id));
    sender.sentFriendRequests = sender.sentFriendRequests.filter(id => !id.equals(receiver._id));
    receiver.friends.push(sender._id);
    sender.friends.push(receiver._id);


    await receiver.save();
    await sender.save();

    res.json({ message: 'Friend request accepted' });
  } catch (error) {
    console.error("Error accepting friend request:", error);
    res.status(500).json({ error: 'Error accepting friend request' });
  }
});

// Add this new route after the existing friend-related routes
router.get('/friendship-status/:username', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.userId);
    const targetUser = await User.findOne({ username: req.params.username });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isFriend = currentUser.friends.includes(targetUser._id);
    const friendRequestSent = targetUser.friendRequests.includes(currentUser._id);
    const friendRequestReceived = currentUser.friendRequests.includes(targetUser._id);

    res.json({
      isFriend,
      friendRequestSent,
      friendRequestReceived
    });
  } catch (error) {
    console.error('Error checking friendship status:', error);
    res.status(500).json({ error: 'Error checking friendship status' });
  }
});

// Unfriend
router.post('/unfriend/:userId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const friend = await User.findById(req.params.userId);

    if (!user || !friend) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.friends = user.friends.filter(id => !id.equals(friend._id));
    friend.friends = friend.friends.filter(id => !id.equals(user._id));

    await user.save();
    await friend.save();

    res.json({ message: 'Unfriended successfully' });
  } catch (error) {
    console.error("Error unfriending:", error);
    res.status(500).json({ error: 'Error unfriending' });
  }
});

// Decline friend request
router.post('/decline-friend-request/:userId', authenticateToken, async (req, res) => {
  try {
    const receiver = await User.findById(req.user.userId);
    const sender = await User.findById(req.params.userId);

    if (!receiver || !sender) {
      return res.status(404).json({ error: 'User not found' });
    }

    receiver.friendRequests = receiver.friendRequests.filter(id => !id.equals(sender._id));
    sender.sentFriendRequests = sender.sentFriendRequests.filter(id => !id.equals(receiver._id));

    await receiver.save();
    await sender.save();

    res.json({ message: 'Friend request declined' });
  } catch (error) {
    console.error("Error declining friend request:", error);
    res.status(500).json({ error: 'Error declining friend request' });
  }
});

// Get friend requests
router.get('/friend-requests', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('friendRequests', 'username');
    res.json(user.friendRequests);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching friend requests' });
  }
});

// Get friends list
router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('friends', 'username');
    res.json(user.friends);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching friends list' });
  }
});

module.exports = router;
