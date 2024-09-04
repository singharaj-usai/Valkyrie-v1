const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const path = require('path');
const connectDB = require('./functions/api/config/database');
const authRoutes = require('./functions/api/routes/auth');
const pageRoutes = require('./functions/api/routes/pages');
const Counter = require('./functions/api/models/Counter');

const app = express();
const port = process.env.PORT || 3000;


require('dotenv').config();
const MONGODB_URI = process.env.MONGODB_URI;
let dbConnection;

app.use(async (req, res, next) => {
  if (!dbConnection) {
    dbConnection = await connectDB(MONGODB_URI);
  }
  req.dbConnection = dbConnection;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('client', { extensions: ['html'] }));
app.use(cookieParser());

const MongoStore = require('connect-mongo');

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      }
    }));
    
// Error handler for CSRF token errors
app.use((err, req, res, next) => {
    if (err.code !== 'EBADCSRFTOKEN') return next(err);
    res.status(403).json({ error: 'Invalid CSRF token' });
  });


// Routes
app.use('/api', authRoutes);
app.use('/', pageRoutes);



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});