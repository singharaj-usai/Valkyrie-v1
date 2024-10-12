const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const moment = require('moment-timezone');
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

const requestIp = require('request-ip');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const {
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require('../utils/emailService');
const nodemailer = require('nodemailer');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth header:', authHeader);
  console.log('Token:', token);

  if (token == null) {
    console.log('No token provided');
    return res.sendStatus(401);
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback_secret_key_for_development',
    (err, user) => {
      if (err) {
        console.error('Token verification error:', err);
        return res.sendStatus(403);
      }
      console.log('Decoded user:', user);
      req.user = user;
      next();
    }
  );
}

const router = express.Router();

// Helper function to get IP address
function getClientIp(req) {
  // For testing purposes, check for a custom header first
  const testIp = req.header('X-Test-IP');
  if (testIp) {
    return testIp;
  }
  return requestIp.getClientIp(req);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 mni
  max: 100,
  message: 'Too many requests from this IP, please try again in 10 minute',
});

// for accounts signed up without csrf protection
const flexibleCsrfProtection = (req, res, next) => {
  const csrfToken = req.headers['x-csrf-token'] || req.body._csrf;
  const isBootswatchRequest = req.path.includes('/bootswatch/');

  if (isBootswatchRequest) {
    // Allow Bootswatch requests without CSRF protection
    return next();
  }

  if (csrfToken) {
    csrfProtection(req, res, next);
  } else {
    console.warn('Request without CSRF token received');
    next();
  }
};

// Validation middleware
const validateUser = [
  body('username')
    .isLength({ min: 3, max: 18 })
    .withMessage('Username must be between 3 and 18 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('Username must contain only letters and numbers')
    .custom((value) => {
      const lowercaseValue = value.toLowerCase();
      if (inappropriateWords.some((word) => lowercaseValue.includes(word))) {
        throw new Error('Username contains inappropriate language');
      }
      return true;
    })
    .custom((value) => {
      const inappropriateWords = [
        'nlgga',
        'nigga',
        'sex',
        'raping',
        'tits',
        'wtf',
        'vag',
        'diemauer',
        'brickopolis',
        '.com',
        '.cf',
        'dicc',
        'nude',
        'kesner',
        'nobe',
        'idiot',
        'dildo',
        'cheeks',
        'anal',
        'boob',
        'horny',
        'tit',
        'fucking',
        'gay',
        'rape',
        'rapist',
        'incest',
        'beastiality',
        'cum',
        'maggot',
        'bloxcity',
        'bullshit',
        'fuck',
        'penis',
        'dick',
        'vagina',
        'faggot',
        'fag',
        'nigger',
        'asshole',
        'shit',
        'bitch',
        'anal',
        'stfu',
        'cunt',
        'pussy',
        'hump',
        'meatspin',
        'redtube',
        'porn',
        'kys',
        'xvideos',
        'hentai',
        'gangbang',
        'milf',
        'whore',
        'cock',
        'masturbate',
      ]; // Add more inappropriate words as needed
      const lowercaseValue = value.toLowerCase();
      if (inappropriateWords.some((word) => lowercaseValue.includes(word))) {
        throw new Error('Username contains inappropriate language');
      }
      return true;
    }),
  body('email')
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail()
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error('Email is already in use');
      }

      // Check for valid email domains
      const validDomains = [
        'outlook.com',
        'protonmail.com',
        'xdiscuss.net',
        'roblox.com',
        'icloud.com',
        'protonmail.ch',
        'google.com',
        'yahoo.com.br',
        'hotmail.com.br',
        'outlook.com.br',
        'uol.com.br',
        'bol.com.br',
        'terra.com.br',
        'ig.com.br',
        'itelefonica.com.br',
        'r7.com',
        'zipmail.com.br',
        'globo.com',
        'globomail.com',
        'oi.com.br',
        'yahoo.com.mx',
        'live.com.mx',
        'hotmail.es',
        'hotmail.com.mx',
        'prodigy.net.mx',
        'hotmail.com.ar',
        'live.com.ar',
        'yahoo.com.ar',
        'fibertel.com.ar',
        'speedy.com.ar',
        'arnet.com.ar',
        'hotmail.be',
        'live.be',
        'skynet.be',
        'voo.be',
        'tvcablenet.be',
        'telenet.be',
        'mail.ru',
        'rambler.ru',
        'yandex.ru',
        'ya.ru',
        'list.ru',
        'gmx.de',
        'hotmail.de',
        'live.de',
        'online.de',
        't-online.de',
        'web.de',
        'yahoo.de',
        'hotmail.fr',
        'live.fr',
        'laposte.net',
        'yahoo.fr',
        'wanadoo.fr',
        'orange.fr',
        'gmx.fr',
        'sfr.fr',
        'neuf.fr',
        'free.fr',
        'sina.com',
        'qq.com',
        'naver.com',
        'hanmail.net',
        'daum.net',
        'nate.com',
        'yahoo.co.jp',
        'yahoo.co.kr',
        'yahoo.co.id',
        'yahoo.co.in',
        'yahoo.com.sg',
        'yahoo.com.ph',
        'btinternet.com',
        'virginmedia.com',
        'blueyonder.co.uk',
        'freeserve.co.uk',
        'live.co.uk',
        'ntlworld.com',
        'o2.co.uk',
        'orange.net',
        'sky.com',
        'talktalk.co.uk',
        'tiscali.co.uk',
        'virgin.net',
        'wanadoo.co.uk',
        'bt.com',
        'bellsouth.net',
        'charter.net',
        'cox.net',
        'earthlink.net',
        'juno.com',
        'email.com',
        'games.com',
        'gmx.net',
        'hush.com',
        'hushmail.com',
        'icloud.com',
        'inbox.com',
        'lavabit.com',
        'love.com',
        'outlook.com',
        'pobox.com',
        'rocketmail.com',
        'safe-mail.net',
        'wow.com',
        'ygm.com',
        'ymail.com',
        'zoho.com',
        'fastmail.fm',
        'yandex.com',
        'iname.com',
        'aol.com',
        'att.net',
        'comcast.net',
        'facebook.com',
        'gmail.com',
        'gmx.com',
        'googlemail.com',
        'google.com',
        'hotmail.com',
        'hotmail.co.uk',
        'mac.com',
        'me.com',
        'mail.com',
        'msn.com',
        'live.com',
        'sbcglobal.net',
        'verizon.net',
        'yahoo.com',
        'yahoo.co.uk',
      ];
      const domain = value.split('@')[1];
      if (!validDomains.includes(domain)) {
        throw new Error('Invalid email domain');
      }
    }),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  // .matches(/\d/).withMessage('Password must contain at least one number')
  // .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
  // .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
  // .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),

  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Password confirmation does not match password');
    }
    return true;
  }),
];

// REgister account
router.post(
  '/register-create',
  flexibleCsrfProtection,
  authLimiter,
  validateUser,
  async (req, res) => {
    try {
      const { username, email, password } = req.body;
      console.log('Registration attempt for:', email);

      const hashedPassword = await bcrypt.hash(password, 10);
      const clientIp = getClientIp(req);
      const verificationToken = crypto.randomBytes(64).toString('hex');

      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      // Check if email already exists
      const existingEmail = await User.findOne({ email });
      if (existingEmail) {
        return res.status(409).json({ message: 'Email already exists' });
      }

      const user = new User({
        username,
        email,
        password: hashedPassword,
        signupDate: moment().tz('America/New_York').toDate(),
        signupIp: clientIp,
        verificationToken,
      });

      await user.save();

      // send email verification link
      const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email/${verificationToken}`;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Email Verification',
        html: `
            <p>Hello ${username},</p>
            <p>Thank you for registering an account on our website. Please click the link below to verify your email address:</p>
            <p><a href="${verificationLink}">${verificationLink}</a></p>
            <p>If you did not register an account, please ignore this email.</p>
        `,
      });

      res.status(201).json({
        message:
          'User registered. Please check your email to verify your account',
      });
    } catch (error) {
      console.error('Registration error:', error);
      if (error.name === 'ValidationError') {
        res
          .status(400)
          .json({ message: 'Invalid input data', details: error.errors });
      } else {
        res.status(500).json({
          message:
            'An unexpected error occurred during registration. Please try again.',
        });
      }
    }
  }
);

router.get('/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).send('Invalid or expired verification token');
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.redirect('/html/pages/authentication/email-verified.html');
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).send('Error verifying email. Please try again later.');
  }
});

router.get('/validate-session', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_key_for_development'
    );
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    res
      .status(200)
      .json({ message: 'Session is valid', username: user.username });
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(401).json({ error: 'Invalid session' });
  }
});

// Check if user is banned
router.get(
  '/check-ban',
  flexibleCsrfProtection,
  authenticateToken,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ isBanned: user.isBanned, banReason: user.banReason });
    } catch (error) {
      console.error('Error checking ban status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME = 2 * 60 * 1000; // 2 minutes

// Login endpoint
router.post('/login', flexibleCsrfProtection, authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    //    console.log("Login attempt for:", username);
    //   console.log("Captcha response received:", captchaResponse);

    const user = await User.findOne({
      username: { $regex: new RegExp(`^${username}$`, 'i') },
    });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username' });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: 'Please verify your email before logging in' });
    }

    if (user.isLocked) {
      return res.status(423).json({
        message:
          'Account is temporarily locked due to multiple failed login attempts. Please try again later.',
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      user.loginAttempts += 1;

      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = Date.now() + LOCK_TIME;
        await user.save();
        return res.status(423).json({
          message:
            'Account locked due to multiple failed login attempts. Please try again later.',
        });
      }

      await user.save();

      return res.status(400).json({ message: 'Invalid password' });
    }

    /*     try {

    // verify cloudflare captcha
    console.log("Verifying captcha with secret key:", process.env.CLOUDFLARE_SECRET_KEY);
    const response = await axios.post(
      'https://challenges.cloudflare.com/turnstile/v0/siteverify',
      new URLSearchParams({
        secret: process.env.CLOUDFLARE_SECRET_KEY,
        response: captchaResponse,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    console.log("Captcha verification response:", response.data);

    if (!response.data.success) {
      console.error("Captcha verification failed:", response.data);
      return res.status(400).json({ message: "Invalid captcha" });
    }
  } catch (error) {
    console.error("Error verifying captcha:", error);
    return res.status(500).json({ message: "Error verifying captcha" });
  } */

    const clientIp = requestIp.getClientIp(req);

    // Reset loginAttempts and lockUntil if you log in successuly
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoggedIn = moment().tz('America/New_York').toDate();
    user.lastLoginIp = clientIp;
    await user.save();

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET || 'fallback_secret_key_for_development',
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      maxAge: 24 * 60 * 60 * 1000, // 1  day
    });

    res.json({
      token,
      username: user.username,
      userId: user._id,
      signupDate: user.signupDate,
      lastLoggedIn: user.lastLoggedIn,
      isBanned: user.isBanned,
      banReason: user.banReason,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'An unexpected error occurred during login. Please try again.',
    });
  }
});

// Logout endpoint
router.post('/logout', flexibleCsrfProtection, async (req, res) => {
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, { isOnline: false });
  }
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Error logging out');
    }
    res.json({ message: 'Logged out successfully' });
  });
});

router.get('/csrf-token', csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

/*

router.post("/claim-daily-currency", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = moment().utc(); // Use UTC
    const lastClaim = moment(user.lastCurrencyClaimDate).utc();

    if (!user.lastCurrencyClaimDate || now.diff(lastClaim, 'hours') >= 24) {
      user.currency += 10;
      user.lastCurrencyClaimDate = now.toISOString(); // Store in ISO format
      await user.save();
      res.json({ success: true, newBalance: user.currency, lastClaimDate: user.lastCurrencyClaimDate });
    } else {
      const nextClaimTime = lastClaim.clone().add(24, 'hours');
      const timeUntilNextClaim = nextClaimTime.diff(now);
      res.status(400).json({
        error: "Currency can only be claimed once per day",
        lastClaimDate: user.lastCurrencyClaimDate
      });
    }
  } catch (error) {
    console.error("Error claiming daily currency:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}); */

router.post('/verify-upload-access', (req, res) => {
  const { accessKey } = req.body;
  if (accessKey === process.env.UPLOAD_ACCESS_KEY) {
    const token = jwt.sign({ accessKey }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.json({ success: true, token });
  } else {
    res.json({ success: false });
  }
});

module.exports = router;
