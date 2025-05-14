const User = require('../models/User');
const jwt = require('jsonwebtoken');
const achievementService = require('../services/achievementService');

// Create JWT token
const createToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '3d'
  });
};

// Handle errors
const handleErrors = (err) => {
  console.log('Error handling in authController:', err.message);
  let errors = { username: '', email: '', password: '' };

  // Duplicate error code
  if (err.code === 11000) {
    if (err.keyPattern && err.keyPattern.email) {
      errors.email = 'Denne e-postadressen er allerede registrert';
    }
    if (err.keyPattern && err.keyPattern.username) {
      errors.username = 'Dette brukernavnet er allerede tatt';
    }
    return errors;
  }

  // Validation errors
  if (err.message.includes('User validation failed')) {
    Object.values(err.errors || {}).forEach(({ properties } = {}) => {
      if (properties && properties.path) {
        errors[properties.path] = properties.message;
      }
    });
  }

  return errors;
};

// Register controller
exports.register = async (req, res) => {
  try {
    console.log('Registration request received:', req.body);
    const { username, email, password } = req.body;

    // Check if required fields are present
    if (!username || !email || !password) {
      return res.status(400).json({
        errors: {
          general: 'Alle feltene må fylles ut'
        }
      });
    }

    const user = await User.create({ username, email, password });
    console.log('User created successfully:', user._id);
    
    const token = createToken(user._id);
    
    // Set JWT as cookie
    res.cookie('jwt', token, { 
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      secure: process.env.NODE_ENV === 'production'
    });
    
    res.status(201).json({ user: user._id });
  } catch (err) {
    console.error('Error during registration:', err);
    const errors = handleErrors(err);
    res.status(400).json({ errors });
  }
};

// Login controller
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ errors: { email: 'Denne e-postadressen finnes ikke' } });
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    
    if (!isValid) {
      return res.status(401).json({ errors: { password: 'Feil passord' } });
    }

    // Create and set token
    const token = createToken(user._id);
    res.cookie('jwt', token, {
      httpOnly: true,
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
      secure: process.env.NODE_ENV === 'production'
    });

    // Record login
    user.lastLogin = new Date();
    
    // Add to login history (if not already set up)
    if (!user.loginHistory) {
      user.loginHistory = [];
    }
    
    // Only add today's date if not already in history for today
    const today = new Date().setHours(0, 0, 0, 0);
    const alreadyLoggedInToday = user.loginHistory.some(date => {
      return new Date(date).setHours(0, 0, 0, 0) === today;
    });
    
    if (!alreadyLoggedInToday) {
      user.loginHistory.push(new Date());
    }
    
    await user.save();
    
    // Check for login achievements
    await achievementService.checkLoginStreakAchievements(user._id);

    res.status(200).json({ user: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ errors: { general: 'Det oppstod en feil ved innlogging' } });
  }
};

// Logout controller
exports.logout = (req, res) => {
  console.log('User logging out');
  res.cookie('jwt', '', { maxAge: 1 });
  res.redirect('/');
};

// Render login page
exports.loginPage = (req, res) => {
  res.render('auth/login', { title: 'Logg inn' });
};

// Render register page
exports.registerPage = (req, res) => {
  res.render('auth/register', { title: 'Registrer deg' });
};
