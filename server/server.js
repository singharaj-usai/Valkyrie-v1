const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const MongoStore = require('connect-mongo');

const connectDB = require('./functions/api/config/database');
const authRoutes = require('./functions/api/routes/auth');
const pageRoutes = require('./functions/api/routes/pages');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

async function connectToDatabase() {
  if (!isConnected) {
    try {
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

const updateUserStatus = require('./functions/api/middleware/updateUserStatus');
app.use(updateUserStatus);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

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
    sameSite: 'none'
  }
}));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error', details: err.message || 'Unknown error' });
});

app.use('/api', authRoutes);
app.use('/', express.static(path.join(__dirname, '../client')));
app.use('/', pageRoutes);

// Add this new route handler
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const adminRoutes = require('./functions/api/routes/admin');
app.use('/api/admin', adminRoutes);

const User = require('./functions/api/models/User');

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

// Call this function after the server starts
if (process.env.NODE_ENV !== 'production') {
  app.listen(port, async () => {
    console.log(`Server running at http://localhost:${port}`);
    await resetUserIdsIfNeeded();
  });
}

module.exports = app;