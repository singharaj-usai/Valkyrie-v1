const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const connectDB = require('./functions/api/config/database');
const authRoutes = require('./functions/api/routes/auth');
const pageRoutes = require('./functions/api/routes/pages');

const app = express();
const port = process.env.PORT || 3000;

require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;

let isConnected = false;

app.use(async (req, res, next) => {
  if (!isConnected) {
    try {
      await connectDB(MONGODB_URI);
      isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('Error connecting to database:', error);
      return res.status(500).json({ error: 'Internal Server Error', details: 'Database connection failed' });
    }
  }
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
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

if (process.env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}

module.exports = app;