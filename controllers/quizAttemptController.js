const QuizAttempt = require('../models/QuizAttempt');
const Quiz = require('../models/Quiz');

// Save quiz attempt
exports.saveQuizAttempt = async (req, res) => {
  try {
    const { quizId, answers, score, totalPoints, timeSpent } = req.body;
    
    // Find the quiz
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }
    
    // Calculate percentage score
    const percentageScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
    
    // Create the quiz attempt
    const quizAttempt = new QuizAttempt({
      quiz: quizId,
      user: req.userId || null,
      answers,
      score,
      totalPoints,
      percentageScore,
      timeSpent,
      ipAddress: req.ip
    });
    
    await quizAttempt.save();
    
    res.status(201).json({ quizAttempt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error saving quiz attempt' });
  }
};

// Get quiz leaderboard
exports.getQuizLeaderboard = async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Get top 10 attempts for this quiz, sorted by score
    const leaderboard = await QuizAttempt.find({ quiz: quizId })
      .sort({ percentageScore: -1, timeSpent: 1 })
      .limit(10)
      .populate('user', 'username')
      .select('user score totalPoints percentageScore timeSpent completedAt');
    
    res.status(200).json({ leaderboard });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error getting leaderboard' });
  }
};

// Get user's quiz attempts
exports.getUserQuizAttempts = async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ user: req.userId })
      .sort({ completedAt: -1 })
      .populate('quiz', 'title category')
      .select('quiz score totalPoints percentageScore timeSpent completedAt');
    
    res.status(200).json({ attempts });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error getting user attempts' });
  }
};

// Get specific quiz attempt
exports.getQuizAttempt = async (req, res) => {
  try {
    const { attemptId } = req.params;
    
    const attempt = await QuizAttempt.findById(attemptId)
      .populate('quiz')
      .populate('user', 'username');
    
    if (!attempt) {
      return res.status(404).json({ error: 'Attempt not found' });
    }
    
    // Check if the user is allowed to view this attempt
    if (attempt.user && attempt.user._id.toString() !== req.userId && !req.isAdmin) {
      return res.status(403).json({ error: 'Not authorized to view this attempt' });
    }
    
    res.status(200).json({ attempt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error getting quiz attempt' });
  }
};
