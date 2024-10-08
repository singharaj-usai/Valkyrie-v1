const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const MongoStore = require('connect-mongo');
const fs = require('fs');
const crypto = require('crypto');
const dotenv = require('dotenv');


// load env vars
dotenv.config();

// Import  api funcs and stuff
const connectDB = require('./functions/api/config/database');
const authRoutes = require('./functions/api/routes/auth');
const pageRoutes = require('./functions/api/routes/pages');
const adminRoutes = require('./functions/api/routes/admin');
const gamesRouter = require('./functions/api/routes/games');
const chatRoutes = require('./functions/api/routes/chat');
const updateUserStatus = require('./functions/api/middleware/updateUserStatus');
const User = require('./functions/api/models/User');
const shirtRoutes = require('./functions/api/routes/shirt');
const friendsRoutes = require('./functions/api/routes/friends');

// Init Expressjs
const app = express();
const port = process.env.PORT || 3000;

// Environment vars
const MONGODB_URI = process.env.MONGODB_URI;
const MAINTENANCE_MODE = process.env.MAINTENANCE_MODE === 'true';
const SECRET_KEY = process.env.MAINTENANCE_SECRET_KEY || 'default_secret_key';


// Use  middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// encrypt secret key
function encryptSecretKey(key) {
  const iv = crypto.randomBytes(16);
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
  const cipher = crypto.createCipheriv('aes-256-cbc', derivedKey, iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return salt.toString('hex') + ':' + iv.toString('hex') + ':' + encrypted;
}

// decrypt secret key fn
function decryptSecretKey(encryptedKey) {
  const parts = encryptedKey.split(':');
  const salt = Buffer.from(parts.shift(), 'hex');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = Buffer.from(parts.join(':'), 'hex');
  const derivedKey = crypto.pbkdf2Sync(process.env.ENCRYPTION_KEY, salt, 100000, 32, 'sha256');
  const decipher = crypto.createDecipheriv('aes-256-cbc', derivedKey, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Maintenance mode middleware
app.use((req, res, next) => {
  console.log('Checking maintenance mode...'); 

  if (req.path.startsWith('/game/players/') || req.path.startsWith('/moderation/filtertext/') || req.path.startsWith('/js/') || req.path === '/images/Valkyrie404.png' || req.path.startsWith('/video/')) {
    return next();  // Skip maintenance check for these routes
  }
  
  if (MAINTENANCE_MODE && !req.path.startsWith('/api/verify-secret-key')) {
    const bypassCookie = req.cookies.maintenanceBypass;
    if (!bypassCookie || decryptSecretKey(bypassCookie) !== SECRET_KEY) {

    console.log('Maintenance mode is active, serving maintenance page');
    return res.sendFile(path.join(__dirname, '../client/html/pages/maintenance/maintenance.html'));
  }
}
  next();
});



let isConnected = false;

async function connectToDatabase() {
  if (!isConnected) {
    try {
      console.log('Attempting to connect to MongoDB...');
      await connectDB(MONGODB_URI);
      isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to database:', error);
      throw error;
    }
  }
}

app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error', details: 'Database connection failed' });
  }
});

// session config
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost/my-app',
    ttl: 24 * 60 * 60 // 1 day
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// update user status
app.use(updateUserStatus);

// error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message || 'Unknown error' });
});

app.use('/api', authRoutes);
app.use('/', pageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/games', gamesRouter);
app.use('/api/chat', chatRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/shirts', shirtRoutes);
app.use('/video', express.static(path.join(__dirname, '../video')));
// Serve static files from the client directory
app.use('/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  next();
}, express.static(path.join(__dirname, '../client')));

// Serve static files from the images directory
app.use('/images', express.static(path.join(__dirname, '../images'), {
  setHeaders: (res, path) => {
    res.set('X-Content-Type-Options', 'nosniff');
  }
}));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Handle clean URLs for HTML files
app.get('*', (req, res, next) => {
  const filePath = path.join(__dirname, '../client', req.path + '.html');
  
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    next();
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/html/pages/home/index.html'));
});

app.get('/game/players/:id', (req, res) => {
    res.json({ ChatFilter: 'blacklist' });
});

app.post('/moderation/filtertext', (req, res) => {
    const { text } = req.body; // Extract 'text' from the request body
  
    const whiteText = text;  // Original posted text
  
    const response = {
        message: "",
        success: true,
        data: {
            white: whiteText, // Can represent the original text or censored version
            black: whiteText,
        }
    };
  
    res.json(response);
});

app.post('/api/verify-secret-key', (req, res) => {
  const { secretKey } = req.body;
  if (secretKey === SECRET_KEY) {
    const encryptedKey = encryptSecretKey(SECRET_KEY);
    res.cookie('maintenanceBypass', encryptedKey, 
      
      { httpOnly: true, maxAge: 24 * 60 * 60 * 1000, sameSite: "strict" }); // Set cookie for 24 hours
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});





const uploadsDir = process.env.NODE_ENV === 'production' 
  ? '/tmp/uploads'  // Use /tmp in production (Vercel)
  : path.join(__dirname, '../uploads');  // Use local path in development

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

//app.use('/uploads', express.static(uploadsDir));


async function resetUserIdsIfNeeded() {
  try {
    await connectToDatabase();
    const count = await User.countDocuments();
    if (count === 0) {
      await User.resetCounter();
      console.log('User ID counter has been reset.');
    }
  } catch (error) {
    console.error('Error resetting user IDs:', error);
  }
}

//  404 handler
app.use((req, res, next) => {
  if (MAINTENANCE_MODE) {
    const bypassCookie = req.cookies.maintenanceBypass;
    if (bypassCookie && decryptSecretKey(bypassCookie) === SECRET_KEY) {
      res.status(404).sendFile(path.join(__dirname, '../client/html/pages/404/404.html'));
    } else {
      res.sendFile(path.join(__dirname, '../client/html/pages/maintenance/maintenance.html'));
    }
  } else {
    res.status(404).sendFile(path.join(__dirname, '../client/html/pages/404/404.html'));
  }
});

// Call this function after the server starts
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    await resetUserIdsIfNeeded();
  });
}

module.exports = app;
