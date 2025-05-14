const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, 'Spørsmålstekst er påkrevd'],
    trim: true
  },
  questionType: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'short-answer', 'poll'],
    default: 'multiple-choice'
  },
  options: [{
    text: String,
    isCorrect: Boolean
  }],
  correctAnswer: {
    type: String,
    required: function() { return this.questionType === 'short-answer'; }
  },
  image: {
    type: String, // Base64 encoded image or URL
    default: null
  },
  points: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  }
});

// Pre-save hook to optimize images if needed
questionSchema.pre('save', function(next) {
  // Skip if no image or already optimized
  if (!this.image || !this.image.startsWith('data:image')) {
    return next();
  }

  // Check if image is too large (> 500KB)
  if (this.image.length > 500000) {
    try {
      // In a real implementation, we'd compress the image here
      // But we'll leave this as a marker for future improvement
      console.log('Large image detected in question. Consider client-side compression.');
    } catch (error) {
      console.error('Error optimizing image:', error);
    }
  }
  next();
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Quiz tittel er påkrevd'],
    trim: true,
    minlength: [3, 'Tittel må være minst 3 tegn'],
    maxlength: [100, 'Tittel kan ikke være mer enn 100 tegn']
  },
  description: {
    type: String,
    required: [true, 'Beskrivelse er påkrevd'],
    trim: true,
    maxlength: [500, 'Beskrivelse kan ikke være mer enn 500 tegn']
  },
  category: {
    type: String,
    required: [true, 'Kategori er påkrevd'],
    trim: true
  },
  questions: [questionSchema],
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;
