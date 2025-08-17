const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Session title is required'],
    trim: true,
    minlength: [3, 'Session title must be at least 3 characters long'],
    maxlength: [100, 'Session title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  hostedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionCode: {
    type: String,
    unique: true,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    default: 50
  }
}, {
  timestamps: true
});

// Generate unique session code before saving
sessionSchema.pre('save', function(next) {
  if (!this.sessionCode) {
    this.sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

// Remove sensitive data from JSON output
sessionSchema.methods.toJSON = function() {
  const sessionObject = this.toObject();
  return sessionObject;
};

module.exports = mongoose.model('Session', sessionSchema);
