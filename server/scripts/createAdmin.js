require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI;

async function createAdminUser() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Register the Counter model
    require('../functions/api/models/Counter');
    
    // Now register and import the User model
    require('../functions/api/models/User');
    const User = mongoose.model('User');

    const adminPassword = 'admin123'; // Change this to a secure password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true,
      signupIp: '127.0.0.1',
    });

    await adminUser.save();
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    mongoose.disconnect();
  }
}

createAdminUser();