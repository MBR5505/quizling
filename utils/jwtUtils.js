const jwt = require('jsonwebtoken');

// Parse and verify JWT without using async/await
exports.parseJwt = (token) => {
  try {
    // Verify and decode the token
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    console.error('JWT parsing error:', error.message);
    return null;
  }
};
