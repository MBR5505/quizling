require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const argon2 = require('argon2');

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB...');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@quiz.no' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await argon2.hash('admin123');
    const admin = new User({
      username: 'Admin',
      email: 'admin@quiz.no',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@quiz.no');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error seeding admin:', error);
  } finally {
    await mongoose.connection.close();
  }
}

seedAdmin();
