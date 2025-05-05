const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../middleware/auth');

// All routes require authentication
router.use(requireAuth);

router.get('/profile', userController.profile);
router.get('/dashboard', userController.dashboard);
router.get('/edit-profile', userController.editProfileForm);
router.put('/update-profile', userController.updateProfile);

module.exports = router;
