const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Check if user is logged in
const requireAuth = (req, res, next) => {
  const token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  // Check if token exists
  if (!token) {
    return res.redirect('/auth/login');
  }

  // Verify token
  jwt.verify(token, process.env.JWT_SECRET, (err, decodedToken) => {
    if (err) {
      console.log(err.message);
      return res.redirect('/auth/login');
    } else {
      req.userId = decodedToken.id;
      next();
    }
  });
};

// Check if user is an admin
const requireAdmin = (req, res, next) => {
  const token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    return res.redirect('/auth/login');
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      console.log(err.message);
      return res.redirect('/auth/login');
    } else {
      const user = await User.findById(decodedToken.id);
      if (!user || user.role !== 'admin') {
        return res.status(403).render('errors/403', { 
          title: 'Ikke tilgang', 
          message: 'Du har ikke tilgang til denne siden' 
        });
      }
      req.userId = decodedToken.id;
      next();
    }
  });
};

// Check current user for all routes
const checkUser = (req, res, next) => {
  const token = req.cookies.jwt || (req.headers.authorization && req.headers.authorization.split(' ')[1]);

  if (!token) {
    res.locals.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
    if (err) {
      res.locals.user = null;
      next();
    } else {
      const user = await User.findById(decodedToken.id).select('-password');
      res.locals.user = user;
      next();
    }
  });
};

module.exports = { requireAuth, requireAdmin, checkUser };
