const Quiz = require('../models/Quiz');

// Get all quizzes
exports.getAllQuizzes = async (req, res) => {
  try {
    // Build query based on filter parameters
    let query = { isPublished: true };
    let sortOption = { createdAt: -1 }; // Default: newest first
    
    // Apply category filter if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Apply sorting options
    if (req.query.sort) {
      switch(req.query.sort) {
        case 'oldest':
          sortOption = { createdAt: 1 };
          break;
        case 'az':
          sortOption = { title: 1 };
          break;
        case 'za':
          sortOption = { title: -1 };
          break;
        default:
          sortOption = { createdAt: -1 }; // newest first
      }
    }
    
    const quizzes = await Quiz.find(query)
      .sort(sortOption)
      .populate('creator', 'username');
    
    res.render('quiz/index', {
      title: 'Alle quizzer',
      quizzes
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av quizzer',
      error: err
    });
  }
};

// Get quiz by ID
exports.getQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id).populate('creator', 'username');
    
    if (!quiz) {
      return res.status(404).render('errors/404');
    }
    
    res.render('quiz/show', {
      title: quiz.title,
      quiz
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av quiz',
      error: err
    });
  }
};

// Create quiz form
exports.createQuizForm = (req, res) => {
  res.render('quiz/create', {
    title: 'Lag ny quiz'
  });
};

// Create new quiz
exports.createQuiz = async (req, res) => {
  try {
    const { title, description, category, questions, isPublished } = req.body;
    
    // Create new quiz
    const quiz = await Quiz.create({
      title,
      description,
      category,
      questions,
      creator: req.userId,
      isPublished: isPublished || false
    });
    
    res.status(201).json({ quiz });
  } catch (err) {
    console.error(err);
    res.status(400).json({ 
      errors: err.message 
    });
  }
};

// Edit quiz form
exports.editQuizForm = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).render('errors/404');
    }
    
    // Check if user is creator or admin
    const isCreator = quiz.creator.toString() === req.userId;
    const isAdmin = res.locals.user && res.locals.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).render('errors/403', {
        message: 'Du har ikke tilgang til å redigere denne quizen'
      });
    }
    
    res.render('quiz/edit', {
      title: `Rediger ${quiz.title}`,
      quiz
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av quiz',
      error: err
    });
  }
};

// Update quiz
exports.updateQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz ikke funnet' });
    }
    
    // Check if user is creator or admin
    const isCreator = quiz.creator.toString() === req.userId;
    const isAdmin = res.locals.user && res.locals.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Ingen tilgang' });
    }
    
    const { title, description, category, questions, isPublished } = req.body;
    
    // Update quiz
    const updatedQuiz = await Quiz.findByIdAndUpdate(
      req.params.id,
      { title, description, category, questions, isPublished },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ quiz: updatedQuiz });
  } catch (err) {
    console.error(err);
    res.status(400).json({ errors: err.message });
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz ikke funnet' });
    }
    
    // Check if user is creator or admin
    const isCreator = quiz.creator.toString() === req.userId;
    const isAdmin = res.locals.user && res.locals.user.role === 'admin';
    
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ error: 'Ingen tilgang' });
    }
    
    await Quiz.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Quiz slettet' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Serverfeil ved sletting av quiz' });
  }
};

// Get quiz statistics
exports.getQuizStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get all attempts for this quiz
    const attempts = await QuizAttempt.find({ quiz: id });
    
    if (!attempts || attempts.length === 0) {
      return res.status(200).json({
        totalAttempts: 0,
        averageScore: 0,
        averageTimeSpent: 0,
        questionStats: []
      });
    }
    
    // Calculate basic stats
    const totalAttempts = attempts.length;
    
    // Calculate average score
    const totalScorePercentage = attempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0);
    const averageScore = Math.round(totalScorePercentage / totalAttempts);
    
    // Calculate average time spent
    const totalTimeSpent = attempts.reduce((sum, attempt) => sum + attempt.timeSpent, 0);
    const averageTimeSpent = Math.round(totalTimeSpent / totalAttempts);
    
    // Calculate question stats
    const quiz = await Quiz.findById(id);
    const questionStats = [];
    
    if (quiz && quiz.questions) {
      for (let i = 0; i < quiz.questions.length; i++) {
        const question = quiz.questions[i];
        
        // Skip polls as they have no correct answers
        if (question.questionType === 'poll') continue;
        
        // Count how many got this question right
        let correctAnswers = 0;
        let totalAnswers = 0;
        
        attempts.forEach(attempt => {
          const answer = attempt.answers.find(a => a.questionId.toString() === question._id.toString());
          if (answer) {
            totalAnswers++;
            if (answer.isCorrect) correctAnswers++;
          }
        });
        
        const correctPercentage = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
        
        questionStats.push({
          questionId: question._id,
          questionIndex: i,
          questionText: question.questionText,
          correctAnswers,
          totalAnswers,
          correctPercentage
        });
      }
      
      // Sort by correctPercentage (highest first)
      questionStats.sort((a, b) => b.correctPercentage - a.correctPercentage);
    }
    
    res.status(200).json({
      totalAttempts,
      averageScore,
      averageTimeSpent,
      questionStats
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error getting quiz statistics' });
  }
};

// Report a quiz
exports.reportQuiz = async (req, res) => {
  try {
    const { quizId, questionId, reason, message } = req.body;
    
    // Validate quiz exists
    const quiz = await Quiz.findById(quizId);
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz ikke funnet' });
    }
    
    // Validate reason
    const validReasons = ['inappropriate', 'incorrect', 'offensive', 'copyright', 'other'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Ugyldig rapportårsak' });
    }
    
    // Create report
    const report = await Report.create({
      reporter: req.userId || null, // Allow anonymous reports
      quiz: quizId,
      question: questionId || null,
      reason,
      message
    });
    
    res.status(201).json({ report });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved rapportering av quiz' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categoryCounts = await Quiz.aggregate([
      { $match: { isPublished: true } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const categories = categoryCounts.map(cat => ({
      name: cat._id,
      slug: cat._id.toLowerCase().replace(/ /g, '-'),
      count: cat.count
    }));
    
    res.render('quiz/categories', {
      title: 'Quiz Kategorier',
      categories
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av kategorier',
      error: err
    });
  }
};

// Get quiz for multiplayer
exports.getMultiplayerQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quiz = await Quiz.findById(id).populate('creator', 'username');
    
    if (!quiz) {
      return res.status(404).render('errors/404');
    }
    
    // Only published quizzes can be played in multiplayer
    if (!quiz.isPublished) {
      return res.status(403).render('errors/403', { 
        message: 'Denne quizzen er ikke publisert ennå'
      });
    }
    
    res.render('quiz/multiplayer', {
      title: `Multiplayer: ${quiz.title}`,
      quiz,
      baseUrl: `${req.protocol}://${req.get('host')}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av quiz',
      error: err
    });
  }
};
