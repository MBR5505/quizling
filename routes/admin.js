const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');

// Apply requireAdmin middleware to all routes
router.use(requireAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// Users management
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserDetails);
router.put('/users/:id/role', adminController.changeUserRole);
router.delete('/users/:id', adminController.deleteUser);

// Quizzes management
router.get('/quizzes', adminController.getQuizzes);
router.delete('/quizzes/:id', adminController.deleteQuiz);
router.put('/quizzes/:id/publish', adminController.togglePublishQuiz);

// Reports management
router.get('/reports', adminController.getReports);
router.post('/reports/:id/handle', adminController.handleReport);

// Settings
router.get('/settings', adminController.getSettings);
router.post('/settings', adminController.updateSettings);

module.exports = router;
