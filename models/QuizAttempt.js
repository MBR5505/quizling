const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema({
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Allow anonymous attempts
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    answer: mongoose.Schema.Types.Mixed, // Can be index number, boolean, string, etc.
    isCorrect: Boolean
  }],
  score: {
    type: Number,
    required: true
  },
  totalPoints: {
    type: Number,
    required: true
  },
  percentageScore: {
    type: Number,
    required: true
  },
  timeSpent: {
    type: Number, // In milliseconds
    required: true
  },
  ipAddress: {
    type: String,
    default: null
  },
  completedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Virtual property for time spent formatted
quizAttemptSchema.virtual('timeSpentFormatted').get(function() {
  const totalSeconds = Math.floor(this.timeSpent / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Index for better query performance
quizAttemptSchema.index({ quiz: 1, completedAt: -1 });
quizAttemptSchema.index({ user: 1, completedAt: -1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);

module.exports = QuizAttempt;
