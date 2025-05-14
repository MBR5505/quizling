const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');

/**
 * Achievement descriptions and requirements
 */
const ACHIEVEMENTS = {
  quiz_creator: {
    name: 'Quizskaperen',
    description: 'Lagde sin første quiz',
    icon: 'bi-plus-circle',
    color: 'bg-primary'
  },
  quiz_master: {
    name: 'Quiz-mester',
    description: 'Fullførte 10 quizzer',
    icon: 'bi-award',
    color: 'bg-success'
  },
  perfect_score: {
    name: 'Perfeksjonist', 
    description: 'Fikk 100% score på en quiz',
    icon: 'bi-trophy',
    color: 'bg-warning'
  },
  quiz_champion: {
    name: 'Quiz-champion',
    description: 'Vant en multiplayer quiz',
    icon: 'bi-cup-hot',
    color: 'bg-danger'
  },
  contributor: {
    name: 'Bidragsyter',
    description: 'Lagde 5 quizzer',
    icon: 'bi-pencil-square',
    color: 'bg-info'
  },
  expert: {
    name: 'Ekspert',
    description: 'Fullførte 50 quizzer',
    icon: 'bi-mortarboard',
    color: 'bg-secondary'
  },
  fast_learner: {
    name: 'Rask lærling',
    description: 'Fullførte en quiz på under 2 minutter',
    icon: 'bi-stopwatch', 
    color: 'bg-primary'
  },
  dedicated: {
    name: 'Dedikert',
    description: 'Logget inn 7 dager på rad',
    icon: 'bi-calendar-check',
    color: 'bg-success'
  },
  popular_creator: {
    name: 'Populær skaper',
    description: 'Fikk en quiz som er tatt over 50 ganger',
    icon: 'bi-star',
    color: 'bg-warning'
  }
};

/**
 * Get achievement details by type
 * @param {string} type Achievement type
 * @returns Achievement details
 */
exports.getAchievementDetails = (type) => {
  return ACHIEVEMENTS[type] || {
    name: 'Ukjent',
    description: 'Ukjent achievement',
    icon: 'bi-question-mark',
    color: 'bg-secondary'
  };
};

/**
 * Get all achievements with details
 */
exports.getAllAchievements = () => {
  return Object.entries(ACHIEVEMENTS).map(([key, value]) => ({
    type: key,
    ...value
  }));
};

/**
 * Add an achievement to a user
 * @param {string} userId User ID
 * @param {string} type Achievement type
 */
exports.addAchievement = async (userId, type) => {
  try {
    // Check if the achievement type is valid
    if (!ACHIEVEMENTS[type]) {
      console.error(`Invalid achievement type: ${type}`);
      return false;
    }
    
    // Check if user already has this achievement
    const user = await User.findById(userId);
    if (!user) {
      console.error(`User not found: ${userId}`);
      return false;
    }
    
    const hasAchievement = user.achievements?.some(a => a.type === type);
    if (hasAchievement) {
      return false; // Already has this achievement
    }
    
    // Add the achievement
    user.achievements = user.achievements || [];
    user.achievements.push({
      type: type,
      earned: new Date(),
      displayed: true
    });
    
    await user.save();
    return true;
  } catch (error) {
    console.error('Error adding achievement:', error);
    return false;
  }
};

/**
 * Check for quiz creation achievements
 * @param {string} userId User ID
 */
exports.checkQuizCreationAchievements = async (userId) => {
  try {
    // Count quizzes created by this user
    const quizCount = await Quiz.countDocuments({ creator: userId });
    
    // First quiz created
    if (quizCount === 1) {
      await this.addAchievement(userId, 'quiz_creator');
    }
    
    // Created 5 quizzes
    if (quizCount === 5) {
      await this.addAchievement(userId, 'contributor');
    }
    
    // Check for popular quizzes
    const popularQuizzes = await Quiz.countDocuments({ 
      creator: userId, 
      attemptCount: { $gte: 50 } 
    });
    
    if (popularQuizzes > 0) {
      await this.addAchievement(userId, 'popular_creator');
    }
    
  } catch (error) {
    console.error('Error checking quiz creation achievements:', error);
  }
};

/**
 * Check for quiz completion achievements
 * @param {string} userId User ID
 * @param {Object} attemptData Quiz attempt data
 */
exports.checkQuizCompletionAchievements = async (userId, attemptData) => {
  try {
    // If perfect score
    if (attemptData.percentageScore === 100) {
      await this.addAchievement(userId, 'perfect_score');
    }
    
    // If completed quickly (under 2 minutes)
    if (attemptData.timeSpent < 120000) { // 2 minutes in milliseconds
      await this.addAchievement(userId, 'fast_learner');
    }
    
    // Count total completed quizzes
    const attemptCount = await QuizAttempt.countDocuments({ user: userId });
    
    // Completed 10 quizzes
    if (attemptCount === 10) {
      await this.addAchievement(userId, 'quiz_master');
    }
    
    // Completed 50 quizzes
    if (attemptCount === 50) {
      await this.addAchievement(userId, 'expert');
    }
    
  } catch (error) {
    console.error('Error checking quiz completion achievements:', error);
  }
};

/**
 * Record a multiplayer win
 * @param {string} userId User ID
 */
exports.recordMultiplayerWin = async (userId) => {
  try {
    await this.addAchievement(userId, 'quiz_champion');
  } catch (error) {
    console.error('Error recording multiplayer win:', error);
  }
};

/**
 * Check for login streak achievements
 * @param {string} userId User ID
 */
exports.checkLoginStreakAchievements = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.loginHistory || user.loginHistory.length < 7) {
      return;
    }
    
    // Sort login history by date (newest first)
    const sortedLogins = [...user.loginHistory].sort((a, b) => b - a);
    
    // Check if we have 7 consecutive days
    let streak = 1;
    for (let i = 1; i < sortedLogins.length; i++) {
      const prevDay = new Date(sortedLogins[i-1]);
      const currDay = new Date(sortedLogins[i]);
      
      // Check if dates are consecutive days
      const diffTime = Math.abs(prevDay - currDay);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      
      if (diffDays === 1) {
        streak++;
        if (streak >= 7) {
          await this.addAchievement(userId, 'dedicated');
          break;
        }
      } else {
        streak = 1; // Reset streak
      }
    }
  } catch (error) {
    console.error('Error checking login streak achievements:', error);
  }
};
