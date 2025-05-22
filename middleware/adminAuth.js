const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminAuth = async (req, res, next) => {
  try {
    // Check if user is authenticated first
    if (!req.userId) {
      return res.status(403).render('errors/403', {
        title: 'Ingen tilgang',
        message: 'Du må være logget inn for å se denne siden.'
      });
    }

    // Get user from database
    const user = await User.findById(req.userId);
    
    // Check if user exists and is admin
    if (!user || user.role !== 'admin') {
      return res.status(403).render('errors/403', {
        title: 'Ingen tilgang',
        message: 'Du har ikke tilgang til denne siden.'
      });
    }

    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(500).render('errors/error', {
      title: 'Server Feil',
      message: 'En feil oppstod under autentisering.'
    });
  }
};

module.exports = adminAuth;
