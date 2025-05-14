require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

// Import routes
const indexRoutes = require('./routes/index');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const quizRoutes = require('./routes/quiz');
const quizAttemptRoutes = require('./routes/quizAttempt');

// Import middleware
const { checkUser } = require('./middleware/auth');

// Initialize app
const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Could not connect to MongoDB:', err));

// Middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));  // Increased limit to 50mb
app.use(express.urlencoded({ extended: true, limit: '50mb' }));  // Also increase urlencoded limit
app.use(cookieParser());

// Make sure public folder path is correct
app.use(express.static(path.join(__dirname, 'public')));

// Add express-ejs-layouts middleware
const expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Setup WebSocket server for multiplayer features
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// WebSocket connection handling
require('./socket/socketHandler')(io);

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 24 hours
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Apply checkUser middleware to all routes
app.use('*', checkUser);

// Routes
app.use('/', indexRoutes);
app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/quiz', quizRoutes);
app.use('/attempts', quizAttemptRoutes);

// 404 Route
app.use((req, res) => {
  res.status(404).render('errors/404');
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Uncaught error:', err);
  console.error('Error stack:', err.stack);
  
  // If it's an API request, return JSON error
  if (req.xhr || req.path.includes('/api/') || req.headers.accept.includes('application/json')) {
    return res.status(err.status || 500).json({
      errors: err.message || 'Server error'
    });
  }
  
  // Otherwise render error page
  res.status(err.status || 500).render('errors/error', {
    message: err.message || 'Det oppstod en feil på serveren',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// Update to use the http server instead of the app directly
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, server, io };
