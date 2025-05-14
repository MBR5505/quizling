const { parseJwt } = require('../utils/jwtUtils');
const Quiz = require('../models/Quiz');
const User = require('../models/User');
const achievementService = require('../services/achievementService');

// Store active game sessions
const activeGames = new Map();

module.exports = (io) => {
  // Middleware to authenticate socket connections with JWT
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                    socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        // Allow anonymous connections but mark them as guests
        socket.userInfo = { isGuest: true };
        return next();
      }
      
      // Verify the token
      const decoded = parseJwt(token);
      
      if (!decoded || !decoded.id) {
        return next(new Error('Invalid token'));
      }
      
      // Get user info
      const user = await User.findById(decoded.id).select('_id username role');
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Attach user info to socket
      socket.userInfo = {
        id: user._id.toString(),
        username: user.username,
        role: user.role,
        isGuest: false
      };
      
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id, socket.userInfo?.isGuest ? 'Guest' : socket.userInfo.username);

    // Handle creating a new game session
    socket.on('create-game', async ({ quizId }) => {
      try {
        // Verify quiz exists
        const quiz = await Quiz.findById(quizId);
        if (!quiz) {
          return socket.emit('error', { message: 'Quiz not found' });
        }
        
        // Generate a unique room code
        const roomCode = generateRoomCode();
        
        // Store game session info
        activeGames.set(roomCode, {
          host: socket.userInfo.isGuest ? { id: socket.id, username: 'Host (Guest)' } : 
            { id: socket.userInfo.id, username: socket.userInfo.username },
          quiz: {
            id: quiz._id.toString(),
            title: quiz.title
          },
          participants: [],
          status: 'waiting',
          currentQuestion: -1,
          startTime: null
        });
        
        // Join the room
        socket.join(roomCode);
        
        // Send room code to host
        socket.emit('game-created', { 
          roomCode, 
          quiz: { 
            id: quiz._id.toString(), 
            title: quiz.title 
          }
        });
        
      } catch (error) {
        console.error('Error creating game:', error);
        socket.emit('error', { message: 'Failed to create game' });
      }
    });

    // Handle joining a game session
    socket.on('join-game', ({ roomCode, username }) => {
      // Check if the game exists
      if (!activeGames.has(roomCode)) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      const game = activeGames.get(roomCode);
      
      // Check if the game is already in progress
      if (game.status !== 'waiting') {
        return socket.emit('error', { message: 'Game already in progress' });
      }
      
      // Create participant info
      const participant = {
        id: socket.userInfo.isGuest ? socket.id : socket.userInfo.id,
        username: socket.userInfo.isGuest ? (username || 'Guest') : socket.userInfo.username,
        score: 0,
        answers: [],
        isReady: false
      };
      
      // Add participant to the game
      game.participants.push(participant);
      
      // Join the room
      socket.join(roomCode);
      
      // Send participant list to everyone
      io.to(roomCode).emit('participants-updated', {
        participants: game.participants.map(p => ({
          id: p.id,
          username: p.username,
          isReady: p.isReady
        }))
      });
      
      // Send game info to the new participant
      socket.emit('game-joined', {
        roomCode,
        quiz: game.quiz,
        host: game.host
      });
    });

    // Handle participant ready status
    socket.on('toggle-ready', ({ roomCode }) => {
      // Check if the game exists
      if (!activeGames.has(roomCode)) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      const game = activeGames.get(roomCode);
      
      // Find the participant
      const participantId = socket.userInfo.isGuest ? socket.id : socket.userInfo.id;
      const participantIndex = game.participants.findIndex(p => p.id === participantId);
      
      if (participantIndex === -1) {
        return socket.emit('error', { message: 'You are not in this game' });
      }
      
      // Toggle ready status
      game.participants[participantIndex].isReady = !game.participants[participantIndex].isReady;
      
      // Update everyone
      io.to(roomCode).emit('participants-updated', {
        participants: game.participants.map(p => ({
          id: p.id,
          username: p.username,
          isReady: p.isReady
        }))
      });
    });

    // Handle starting the game (host only)
    socket.on('start-game', ({ roomCode }) => {
      // Check if the game exists
      if (!activeGames.has(roomCode)) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      const game = activeGames.get(roomCode);
      
      // Check if the requester is the host
      const hostId = game.host.id;
      const requesterId = socket.userInfo.isGuest ? socket.id : socket.userInfo.id;
      
      if (hostId !== requesterId) {
        return socket.emit('error', { message: 'Only the host can start the game' });
      }
      
      // Check if there are any participants
      if (game.participants.length === 0) {
        return socket.emit('error', { message: 'Cannot start a game with no participants' });
      }
      
      // Start the game
      game.status = 'in-progress';
      game.currentQuestion = 0;
      game.startTime = Date.now();
      
      // Notify all participants
      io.to(roomCode).emit('game-started', { 
        message: 'The game has started!' 
      });
      
      // Send the first question (implementation depends on how you want to structure this)
      sendCurrentQuestion(roomCode);
    });

    // Handle submitting an answer
    socket.on('submit-answer', ({ roomCode, answer, timeSpent }) => {
      // Check if the game exists
      if (!activeGames.has(roomCode)) {
        return socket.emit('error', { message: 'Game not found' });
      }
      
      const game = activeGames.get(roomCode);
      
      // Check if the game is in progress
      if (game.status !== 'in-progress') {
        return socket.emit('error', { message: 'Game is not in progress' });
      }
      
      // Find the participant
      const participantId = socket.userInfo.isGuest ? socket.id : socket.userInfo.id;
      const participantIndex = game.participants.findIndex(p => p.id === participantId);
      
      if (participantIndex === -1) {
        return socket.emit('error', { message: 'You are not in this game' });
      }
      
      // Record the answer
      game.participants[participantIndex].answers[game.currentQuestion] = {
        answerValue: answer,
        timeSpent: timeSpent
      };
      
      // Notify the participant that their answer was received
      socket.emit('answer-recorded', { questionIndex: game.currentQuestion });
      
      // Check if all participants have answered
      const allAnswered = game.participants.every(p => 
        p.answers[game.currentQuestion] !== undefined
      );
      
      if (allAnswered) {
        // Calculate scores for this question
        calculateScores(roomCode, game.currentQuestion);
        
        // Send updated scores to everyone
        const scores = game.participants.map(p => ({
          id: p.id,
          username: p.username,
          score: p.score
        }));
        
        io.to(roomCode).emit('question-completed', { scores });
        
        // Check if there are more questions
        // Implement next question logic here
      }
    });

    // Handle disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Handle removing participant from any active games
      activeGames.forEach((game, roomCode) => {
        const participantId = socket.userInfo?.isGuest ? socket.id : socket.userInfo?.id;
        
        // Check if this was a host
        if (game.host.id === participantId) {
          // End the game if the host disconnects
          io.to(roomCode).emit('game-ended', { message: 'Host disconnected' });
          activeGames.delete(roomCode);
        } else {
          // Check if this was a participant
          const participantIndex = game.participants.findIndex(p => p.id === participantId);
          
          if (participantIndex !== -1) {
            // Remove the participant
            game.participants.splice(participantIndex, 1);
            
            // Update remaining participants
            io.to(roomCode).emit('participants-updated', {
              participants: game.participants.map(p => ({
                id: p.id,
                username: p.username,
                isReady: p.isReady
              }))
            });
          }
        }
      });
    });
  });

  // Helper functions
  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Make sure code is unique
    if (activeGames.has(code)) {
      return generateRoomCode();
    }
    
    return code;
  }

  function sendCurrentQuestion(roomCode) {
    const game = activeGames.get(roomCode);
    if (!game) return;
    
    // Fetch the quiz to get question details
    Quiz.findById(game.quiz.id)
      .then(quiz => {
        if (!quiz || game.currentQuestion >= quiz.questions.length) {
          // End game if no more questions
          endGame(roomCode);
          return;
        }
        
        const question = quiz.questions[game.currentQuestion];
        
        // Send question to all participants, but without correct answers
        io.to(roomCode).emit('new-question', {
          index: game.currentQuestion,
          total: quiz.questions.length,
          question: {
            text: question.questionText,
            type: question.questionType,
            image: question.image,
            options: question.options?.map(o => ({
              text: o.text,
              // Don't send isCorrect flag
            }))
          },
          timeLimit: 20 // seconds per question
        });
      })
      .catch(err => {
        console.error('Error sending question:', err);
        io.to(roomCode).emit('error', { message: 'Failed to load question' });
      });
  }

  function calculateScores(roomCode, questionIndex) {
    const game = activeGames.get(roomCode);
    if (!game) return;
    
    Quiz.findById(game.quiz.id)
      .then(quiz => {
        if (!quiz || questionIndex >= quiz.questions.length) return;
        
        const question = quiz.questions[questionIndex];
        
        // Calculate scores for each participant
        game.participants.forEach(participant => {
          const answer = participant.answers[questionIndex];
          if (!answer) return;
          
          let isCorrect = false;
          let points = 0;
          
          if (question.questionType === 'multiple-choice') {
            if (question.options[answer.answerValue]?.isCorrect) {
              isCorrect = true;
              const basePoints = question.points || 1;
              // Award more points for fast answers
              const timeBonus = Math.max(0, 10 - Math.floor(answer.timeSpent / 1000));
              points = basePoints + timeBonus;
            }
          } else if (question.questionType === 'true-false') {
            const correctAnswer = question.options.findIndex(o => o.isCorrect);
            if (answer.answerValue === correctAnswer) {
              isCorrect = true;
              points = question.points || 1;
            }
          } else if (question.questionType === 'short-answer') {
            if (answer.answerValue.toLowerCase().trim() === question.correctAnswer.toLowerCase().trim()) {
              isCorrect = true;
              points = question.points || 1;
            }
          }
          
          // Update participant's score
          participant.score += points;
        });
      })
      .catch(err => {
        console.error('Error calculating scores:', err);
      });
  }

  function endGame(roomCode) {
    const game = activeGames.get(roomCode);
    if (!game) return;
    
    // Set game as ended
    game.status = 'ended';
    
    // Sort participants by score
    const results = [...game.participants].sort((a, b) => b.score - a.score);
    
    // Award achievement to winner if not a guest
    if (results.length > 0) {
      const winner = results[0];
      if (winner && !winner.isGuest && winner.id) {
        achievementService.recordMultiplayerWin(winner.id);
      }
    }
    
    // Send final results
    io.to(roomCode).emit('game-ended', { 
      results: results.map((p, index) => ({
        username: p.username,
        score: p.score,
        position: index + 1
      }))
    });
    
    // Delete the game after some time
    setTimeout(() => {
      activeGames.delete(roomCode);
    }, 3600000); // Keep for 1 hour for results viewing
  }
};
