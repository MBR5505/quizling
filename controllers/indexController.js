const Quiz = require('../models/Quiz');

// Home page controller
exports.homePage = async (req, res) => {
  try {
    // Get the latest published quizzes
    const quizzes = await Quiz.find({ isPublished: true })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('creator', 'username');
    
    res.render('index', { 
      title: 'Velkommen til IT Quiz', 
      quizzes
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', { 
      title: 'Serverfeil',
      message: 'Det oppstod en feil ved henting av data' 
    });
  }
};

// FAQ page controller
exports.faqPage = (req, res) => {
  res.render('faq', { title: 'Ofte stilte spørsmål' });
};

// About page controller
exports.aboutPage = (req, res) => {
  res.render('about', { title: 'Om oss' });
};
