const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// GET routes
router.get('/login', authController.loginPage);
router.get('/register', authController.registerPage);
router.get('/logout', authController.logout);

// POST routes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Debug route to check if auth routes are working
router.get('/test', (req, res) => {
  res.json({ message: 'Auth routes are working!' });
});

module.exports = router;
