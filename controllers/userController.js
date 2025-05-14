const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const achievementService = require('../services/achievementService');

// User profile page
exports.profile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.redirect('/auth/login');
    }
    
    // Get user's quizzes
    const quizzes = await Quiz.find({ creator: req.userId }).sort({ createdAt: -1 });
    
    // Get statistics for the user
    const quizzesCreated = quizzes.length;
    
    // Get quiz attempt stats
    const attempts = await QuizAttempt.find({ user: req.userId });
    const quizzesTaken = attempts.length;
    
    // Calculate average score
    let averageScore = 0;
    if (quizzesTaken > 0) {
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0);
      averageScore = Math.round(totalScore / quizzesTaken);
    }
    
    // Count perfect scores
    const perfectScores = attempts.filter(attempt => attempt.percentageScore === 100).length;
    
    // Check if user has a top leaderboard position
    const topLeaderboard = await QuizAttempt.findOne({
      user: req.userId,
      percentageScore: { $gte: 80 }
    }).sort({ percentageScore: -1, timeSpent: 1 }).limit(1);
    
    // Process achievements to add details
    const achievements = user.achievements?.map(achievement => {
      const details = achievementService.getAchievementDetails(achievement.type);
      return {
        ...achievement.toObject(),
        ...details
      };
    }) || [];
    
    res.render('user/profile', {
      title: `${user.username} - Profil`,
      user,
      quizzes,
      quizzesCreated,
      quizzesTaken,
      averageScore,
      perfectScores,
      topLeaderboard: !!topLeaderboard,
      achievements
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av profil',
      error: err
    });
  }
};

// User dashboard
exports.dashboard = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ creator: req.userId }).sort({ createdAt: -1 });
    
    res.render('user/dashboard', {
      title: 'Kontrollpanel',
      quizzes
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av kontrollpanel'
    });
  }
};

// Edit user form
exports.editProfileForm = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.redirect('/auth/login');
    }
    
    res.render('user/edit-profile', {
      title: 'Rediger profil',
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av profil'
    });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Update user
    const user = await User.findByIdAndUpdate(
      req.userId, 
      { username, email },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({ errors: err.errors });
    }
    
    // Handle duplicate key errors
    if (err.code === 11000) {
      const errors = {};
      
      if (err.keyPattern.email) {
        errors.email = 'Denne e-postadressen er allerede i bruk';
      }
      
      if (err.keyPattern.username) {
        errors.username = 'Dette brukernavnet er allerede i bruk';
      }
      
      return res.status(400).json({ errors });
    }
    
    res.status(500).json({ error: 'Serverfeil ved oppdatering av profil' });
  }
};

// Get all achievements
exports.getAchievements = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).render('errors/404');
    }
    
    // Get all possible achievements
    const allAchievements = achievementService.getAllAchievements();
    
    // Get user's achievements
    const userAchievements = user.achievements || [];
    
    res.render('user/achievements', {
      title: 'Merker',
      allAchievements,
      userAchievements,
      user
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av merker',
      error: err
    });
  }
};
