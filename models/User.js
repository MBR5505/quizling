const mongoose = require('mongoose');
const argon2 = require('argon2');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Brukernavn er påkrevd'],
    unique: true,
    trim: true,
    minlength: [3, 'Brukernavn må være minst 3 tegn'],
    maxlength: [30, 'Brukernavn kan ikke være mer enn 30 tegn']
  },
  email: {
    type: String,
    required: [true, 'E-post er påkrevd'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Vennligst oppgi en gyldig e-postadresse']
  },
  password: {
    type: String,
    required: [true, 'Passord er påkrevd'],
    minlength: [6, 'Passord må være minst 6 tegn']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  achievements: [{
    type: {
      type: String,
      enum: [
        'quiz_creator',       // Lagde sin første quiz
        'quiz_master',        // Fullførte 10 quizzer
        'perfect_score',      // Fikk 100% score på en quiz
        'quiz_champion',      // Vant en multiplayer quiz
        'contributor',        // Lagde 5 quizzer
        'expert',             // Fullførte 50 quizzer
        'fast_learner',       // Fullførte en quiz på under 2 minutter
        'dedicated',          // Logget inn 7 dager på rad
        'popular_creator'     // Fikk en quiz som er tatt over 50 ganger
      ]
    },
    earned: {
      type: Date,
      default: Date.now
    },
    displayed: {
      type: Boolean,
      default: true
    }
  }],
  lastLogin: {
    type: Date,
    default: null
  },
  loginHistory: [Date],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified (or new)
  if (!this.isModified('password')) return next();
  
  try {
    console.log('Hashing password...');
    this.password = await argon2.hash(this.password);
    next();
  } catch (error) {
    console.error('Error hashing password:', error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    console.log('Comparing passwords...');
    return await argon2.verify(this.password, candidatePassword);
  } catch (error) {
    console.error('Error comparing passwords:', error);
    throw error;
  }
};

const User = mongoose.model('User', userSchema);

module.exports = User;
