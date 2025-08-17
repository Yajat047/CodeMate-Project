const Session = require('../models/Session');
const User = require('../models/User');
const { validationResult } = require('express-validator');

// Create a new session (student only)
const createSession = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { title, description, maxParticipants } = req.body;

    // Generate unique session code
    let sessionCode;
    let isUnique = false;
    while (!isUnique) {
      sessionCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingSession = await Session.findOne({ sessionCode });
      if (!existingSession) {
        isUnique = true;
      }
    }

    const newSession = new Session({
      title,
      description,
      hostedBy: req.userId,
      sessionCode,
      maxParticipants: maxParticipants || 50
    });

    await newSession.save();
    await newSession.populate('hostedBy', 'fullName idNumber email role');

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      session: newSession
    });

  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all sessions (for admin and teacher)
const getAllSessions = async (req, res) => {
  try {
    const sessions = await Session.find()
      .populate('hostedBy', 'fullName idNumber email role')
      .populate('participants', 'fullName idNumber email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get all sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get sessions hosted by current user
const getMyHostedSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ hostedBy: req.userId })
      .populate('hostedBy', 'fullName idNumber email role')
      .populate('participants', 'fullName idNumber email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get my hosted sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Join a session
const joinSession = async (req, res) => {
  try {
    const { sessionCode } = req.body;

    const session = await Session.findOne({ sessionCode, isActive: true });
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or inactive'
      });
    }

    // Check if user is already a participant
    if (session.participants.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are already a participant in this session'
      });
    }

    // Check if session is full
    if (session.participants.length >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Session is full'
      });
    }

    session.participants.push(req.userId);
    await session.save();
    await session.populate('hostedBy', 'fullName idNumber email role');
    await session.populate('participants', 'fullName idNumber email role');

    res.json({
      success: true,
      message: 'Successfully joined session',
      session
    });

  } catch (error) {
    console.error('Join session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// End a session (only host can end)
const endSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is the host
    if (session.hostedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'Only the session host can end the session'
      });
    }

    session.isActive = false;
    session.endTime = new Date();
    await session.save();

    res.json({
      success: true,
      message: 'Session ended successfully'
    });

  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  createSession,
  getAllSessions,
  getMyHostedSessions,
  joinSession,
  endSession
};
