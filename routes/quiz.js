const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const { requireAuth } = require('../middleware/auth');

// Special routes need to come first
router.get('/categories', quizController.getCategories);
router.get('/create/new', requireAuth, quizController.createQuizForm);

// Public routes
router.get('/', quizController.getAllQuizzes);

// Make sure the create route is properly defined and comes before any other routes that use IDs
router.post('/create', requireAuth, quizController.createQuiz);

// Quiz specific routes (these need an ID)
router.get('/:id/edit', requireAuth, quizController.editQuizForm);
router.get('/:id', quizController.getQuiz);

// Add this route for multiplayer
router.get('/:id/multiplayer', quizController.getMultiplayerQuiz);

// Quiz statistics
router.get('/:id/stats', quizController.getQuizStats);

// Report a quiz
router.post('/report', quizController.reportQuiz);

// Protected API routes
router.put('/:id', requireAuth, quizController.updateQuiz);
router.delete('/:id', requireAuth, quizController.deleteQuiz);

module.exports = router;
