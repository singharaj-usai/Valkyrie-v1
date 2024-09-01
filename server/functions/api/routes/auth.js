const express = require("express");
const bcrypt = require("bcrypt");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");
const moment = require("moment-timezone");
const csrf = require("csurf");
const requestIp = require('request-ip');

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

// Signup endpoint
router.post("/register", validateUser, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const clientIp = requestIp.getClientIp(req);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      signupDate: moment().tz("America/New_York").toDate(),
      signupIp: clientIp,
    });
    await user.save();
    res.status(201).send("User created successfully");
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).send("Error creating user");
  }
});

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send("Invalid username or password");
    }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).send("Invalid username or password");
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
    const regex = new RegExp(username, "i"); // 'i' flag for case-insensitive search
    const users = await User.find({ username: regex }, "username");
    res.json(users);
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).send("Error searching users");
  }
});

module.exports = router;
