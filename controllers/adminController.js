const User = require('../models/User');
const Quiz = require('../models/Quiz');
const QuizAttempt = require('../models/QuizAttempt');
const Report = require('../models/Report');
const ActivityLog = require('../models/ActivityLog');

// Admin dashboard
exports.dashboard = async (req, res) => {
  try {
    // Get stats
    const userCount = await User.countDocuments();
    const quizCount = await Quiz.countDocuments();
    const attemptCount = await QuizAttempt.countDocuments();
    const reportCount = await Report.countDocuments({ status: 'pending' });
    
    // Get recent users
    const recentUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);
    
    // Get recent quizzes
    const recentQuizzes = await Quiz.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('creator', 'username');
    
    // Get activity log
    const activityLog = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      stats: {
        userCount,
        quizCount,
        attemptCount,
        reportCount
      },
      recentUsers,
      recentQuizzes,
      activityLog
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av admin dashboard',
      error: err
    });
  }
};

// Get all users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    
    res.render('admin/users', {
      title: 'Administrer brukere',
      users
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av brukere',
      error: err
    });
  }
};

// Get all quizzes
exports.getQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find()
      .sort({ createdAt: -1 })
      .populate('creator', 'username');
    
    res.render('admin/quizzes', {
      title: 'Administrer quizzer',
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

// Get reports
exports.getReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .populate('reporter', 'username')
      .populate('quiz', 'title')
      .populate('question', 'questionText');
    
    res.render('admin/reports', {
      title: 'Håndter rapporter',
      reports
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av rapporter',
      error: err
    });
  }
};

// Handle report
exports.handleReport = async (req, res) => {
  try {
    const { reportId, action, message } = req.body;
    
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ error: 'Rapporten ble ikke funnet' });
    }
    
    report.status = action === 'resolve' ? 'resolved' : 'dismissed';
    report.adminMessage = message;
    report.handledBy = req.userId;
    report.handledAt = Date.now();
    
    await report.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.userId,
      username: res.locals.user.username,
      action: `${action === 'resolve' ? 'Løste' : 'Avviste'} rapport`,
      details: `Rapport ID: ${reportId}`,
      timestamp: Date.now()
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved håndtering av rapporten' });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Check if trying to delete an admin
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'Brukeren ble ikke funnet' });
    }
    
    if (user.role === 'admin') {
      return res.status(403).json({ error: 'Kan ikke slette admin-brukere' });
    }
    
    // Delete user and their quizzes
    await Quiz.deleteMany({ creator: userId });
    await QuizAttempt.deleteMany({ user: userId });
    await User.findByIdAndDelete(userId);
    
    // Log activity
    await ActivityLog.create({
      user: req.userId,
      username: res.locals.user.username,
      action: 'Slettet bruker',
      details: `Bruker: ${user.username}`,
      timestamp: Date.now()
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved sletting av brukeren' });
  }
};

// Get admin settings
exports.getSettings = async (req, res) => {
  try {
    res.render('admin/settings', {
      title: 'Admin innstillinger'
    });
  } catch (err) {
    console.error(err);
    res.status(500).render('errors/error', {
      message: 'Det oppstod en feil ved henting av innstillinger',
      error: err
    });
  }
};

// Get user details
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'Bruker ikke funnet' });
    }
    
    // Get stats for this user
    const createdQuizzes = await Quiz.countDocuments({ creator: id });
    
    // Get completed quizzes and average score
    const attempts = await QuizAttempt.find({ user: id });
    const completedQuizzes = attempts.length;
    
    let averageScore = 0;
    if (completedQuizzes > 0) {
      const totalScore = attempts.reduce((sum, attempt) => sum + attempt.percentageScore, 0);
      averageScore = Math.round(totalScore / completedQuizzes);
    }
    
    // Get user activities
    const activities = await ActivityLog.find({ user: id })
      .sort({ timestamp: -1 })
      .limit(10);
    
    res.status(200).json({
      user,
      stats: {
        createdQuizzes,
        completedQuizzes,
        averageScore,
        lastLogin: user.lastLogin
      },
      activities
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved henting av brukerdetaljer' });
  }
};

// Change user role
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    // Validate role
    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Ugyldig rolle' });
    }
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: 'Bruker ikke funnet' });
    }
    
    // Prevent changing own role (prevent admin from demoting themselves)
    if (user._id.toString() === req.userId) {
      return res.status(403).json({ error: 'Kan ikke endre egen rolle' });
    }
    
    user.role = role;
    await user.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.userId,
      username: res.locals.user.username,
      action: 'Endret brukerrolle',
      details: `Bruker: ${user.username}, Ny rolle: ${role}`,
      timestamp: Date.now()
    });
    
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved endring av brukerrolle' });
  }
};

// Delete quiz
exports.deleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quiz = await Quiz.findById(id).populate('creator', 'username');
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz ikke funnet' });
    }
    
    await Quiz.findByIdAndDelete(id);
    await QuizAttempt.deleteMany({ quiz: id });
    await Report.deleteMany({ quiz: id });
    
    // Log activity
    await ActivityLog.create({
      user: req.userId,
      username: res.locals.user.username,
      action: 'Slettet quiz',
      details: `Quiz: ${quiz.title}, Opprettet av: ${quiz.creator.username}`,
      timestamp: Date.now()
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved sletting av quiz' });
  }
};

// Toggle quiz publish status
exports.togglePublishQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quiz = await Quiz.findById(id).populate('creator', 'username');
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz ikke funnet' });
    }
    
    // Toggle publish status
    quiz.isPublished = !quiz.isPublished;
    await quiz.save();
    
    // Log activity
    await ActivityLog.create({
      user: req.userId,
      username: res.locals.user.username,
      action: quiz.isPublished ? 'Publiserte quiz' : 'Upubliserte quiz',
      details: `Quiz: ${quiz.title}, Opprettet av: ${quiz.creator.username}`,
      timestamp: Date.now()
    });
    
    res.status(200).json({ success: true, isPublished: quiz.isPublished });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved endring av publiseringsstatus' });
  }
};

// Update settings
exports.updateSettings = async (req, res) => {
  try {
    const { setting, value } = req.body;
    
    // For now, we'll just log the changes since there's no Settings model yet
    await ActivityLog.create({
      user: req.userId,
      username: res.locals.user.username,
      action: 'Oppdaterte innstilling',
      details: `Setting: ${setting}, Verdi: ${value}`,
      timestamp: Date.now()
    });
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Det oppstod en feil ved oppdatering av innstillinger' });
  }
};
