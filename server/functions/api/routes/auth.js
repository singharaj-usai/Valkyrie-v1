const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const moment = require("moment-timezone");
const csrf = require("csurf");
const requestIp = require('request-ip');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../utils/emailService');

const router = express.Router();

// Setup CSRF protection
const csrfProtection = csrf({ cookie: true });



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
    .custom(async (value) => {
      const user = await User.findOne({ username: value });
      if (user) {
        throw new Error("Username is already in use");
      }
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
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    try {
      await sendVerificationEmail(email, verificationToken, baseUrl);
      res.status(201).json({ 
        message: "User created successfully. Please check your email to verify your account."
      });
    } catch (emailError) {
      console.error("Error sending verification email:", emailError);
      // Instead of sending a 201 status, send a 500 status with more detailed error information
      res.status(500).json({ 
        message: "User created successfully, but there was an issue sending the verification email.",
        error: emailError.message
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    if (error.code === 11000) {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
      res.status(500).json({ error: "Error creating user", details: error.message || "Unknown error" });
    }
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

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("Invalid username");
    }

    
    if (!user.isVerified) {
      return res.status(403).send("Please verify your email before logging in");
    }

    const isValidPassword = await bcrypt.compare(password, user.password); //password === user.password; //await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).send("Invalid password");
    }


    const clientIp = requestIp.getClientIp(req);
    user.lastLoggedIn = moment().tz("America/New_York").toDate();
    user.lastLoginIp = clientIp;
    await user.save();

    req.session.userId = user._id;
    res.json({
      username: user.username,
      signupDate: user.signupDate,
      lastLoggedIn: user.lastLoggedIn,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).send("Error logging in");
  }
});

// Logout endpoint
router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send("Error logging out");
    }
    res.send("Logged out successfully");
  });
});



// Search users endpoint
router.get("/search", async (req, res) => {
  try {
    const { username } = req.query;
    let users;
    if (username) {
      const regex = new RegExp(username, "i"); // 'i' flag for case-insensitive search
      users = await User.find({ username: regex }, "username");
    } else {
      users = await User.find({}, "username");
    }
    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).send("Error searching users");
  }
});

// User profile endpoint
router.get('/user/:username', async (req, res) => {
  try {
      const { username } = req.params;
      const user = await User.findOne({ username }, 'username signupDate lastLoggedIn');
      if (!user) {
          return res.status(404).send('User not found');
      }
      res.json(user);
  } catch (error) {
      console.error('User profile error:', error);
      res.status(500).send('Error fetching user profile');
  }
});

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

module.exports = router;
