const express = require('express');
const router = express.Router();
const quizAttemptController = require('../controllers/quizAttemptController');
const { requireAuth, checkUser } = require('../middleware/auth');

// Public routes - anyone can submit a quiz attempt
router.post('/save', checkUser, quizAttemptController.saveQuizAttempt);
router.get('/:quizId/leaderboard', quizAttemptController.getQuizLeaderboard);

// Protected routes - only logged in users
router.get('/user', requireAuth, quizAttemptController.getUserQuizAttempts);
router.get('/:attemptId', requireAuth, quizAttemptController.getQuizAttempt);

module.exports = router;
