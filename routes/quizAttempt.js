const express = require('express');
const router = express.Router();
const quizAttemptController = require('../controllers/quizAttemptController');
const { requireAuth } = require('../middleware/auth');

// Save a quiz attempt (available to both logged-in and anonymous users)
router.post('/save', quizAttemptController.saveQuizAttempt);

// Get quiz leaderboard
router.get('/leaderboard/:quizId', quizAttemptController.getQuizLeaderboard);

// Get user's quiz attempts (requires auth)
router.get('/user', requireAuth, quizAttemptController.getUserQuizAttempts);

// Get specific quiz attempt
router.get('/:attemptId', requireAuth, quizAttemptController.getQuizAttempt);

module.exports = router;
