const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  username: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
