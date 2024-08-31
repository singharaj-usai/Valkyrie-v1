const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/database');
const authRoutes = require('./routes/auth');
const pageRoutes = require('./routes/pages');

const app = express();
const port = 3000;

// Connect to MongoDB
connectDB();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('client'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Routes
app.use('/api', authRoutes);
app.use('/', pageRoutes);

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});