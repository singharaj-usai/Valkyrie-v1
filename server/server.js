const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const session = require('express-session');
const { body, validationResult } = require('express-validator');


const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost/myapp', { useNewUrlParser: true, useUnifiedTopology: true });

// User model with Mongoose schema
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        minlength: 3,
        maxlength: 30
    },
    password: {
        type: String,
        required: true
    }
});

const User = mongoose.model('User', userSchema);


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('client'));
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Validation middleware
const validateUser = [
    body('username')
        .isLength({ min: 3, max: 14 }).withMessage('Username must be between 3 and 14 characters')
        .custom(async (value) => {
            const user = await User.findOne({ username: value });
            if (user) {
                throw new Error('Username is already in use');
            }
        }),
    body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters long')
];

// Signup endpoint
app.post('/api/signup', validateUser, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { username, password } = req.body;
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).send('Username already exists');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).send('User created successfully');
    } catch (error) {
        res.status(500).send('Error creating user');
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).send('Invalid username or password');
        }
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(400).send('Invalid username or password');
        }
        req.session.userId = user._id;
        res.json({ username: user.username });
    } catch (error) {
        res.status(500).send('Error logging in');
    }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).send('Error logging out');
        }
        res.send('Logged out successfully');
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});