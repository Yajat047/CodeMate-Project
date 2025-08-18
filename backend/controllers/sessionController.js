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
      maxParticipants: maxParticipants || 100,
      participants: [req.userId], // Host automatically joins the session
      activeParticipants: [req.userId],
      participationHistory: [{
        user: req.userId,
        joinedAt: new Date(),
        role: 'host'
      }]
    });

    await newSession.save();
    await newSession.populate('hostedBy', 'fullName idNumber email role');
    await newSession.populate('participants', 'fullName idNumber email role');

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

    // Check if user is already in an active session
    const activeSession = await Session.findOne({
      activeParticipants: req.userId,
      isActive: true
    });

    if (activeSession) {
      return res.status(400).json({
        success: false,
        message: 'You are already in an active session. Please leave the current session before joining a new one.',
        activeSessionId: activeSession._id
      });
    }

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

    // Get user role
    const user = await User.findById(req.userId);
    const isTeacherOrAdmin = ['teacher', 'admin'].includes(user.role);

    // Check if session is full (skip check for teachers and admins)
    if (!isTeacherOrAdmin && session.participants.length >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        message: 'Session is full'
      });
    }

    session.participants.push(req.userId);
    await session.save();
    await session.populate('hostedBy', 'fullName idNumber email role');
    await session.populate('participants', 'fullName idNumber email role');

    // Emit session update event
    const { io } = require('../server');
    io.to(session._id.toString()).emit('session-updated', {
      participants: session.participants,
      host: session.hostedBy
    });

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

    // Check if user is authorized to end the session
    const user = await User.findById(req.userId);
    const isTeacherOrAdmin = ['teacher', 'admin'].includes(user.role);
    const isHost = session.hostedBy.toString() === req.userId;

    if (!isHost && !isTeacherOrAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the session host, teachers, or admins can end the session'
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

// Get sessions where user is/was a participant
const getMyJoinedSessions = async (req, res) => {
  try {
    const sessions = await Session.find({ participants: req.userId })
      .populate('hostedBy', 'fullName idNumber email role')
      .populate('participants', 'fullName idNumber email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      sessions
    });

  } catch (error) {
    console.error('Get joined sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Save code to session history
const saveCodeToHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { code } = req.body;
    const { io } = require('../server');

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is a participant or host
    if (!session.participants.includes(req.userId) && session.hostedBy.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this session'
      });
    }

    const codeEntry = {
      code,
      author: req.userId,
      timestamp: new Date()
    };

    session.codeHistory.push(codeEntry);
    await session.save();

    // Emit real-time update to all participants in the session
    io.to(sessionId).emit('code-updated', {
      code,
      userId: req.userId,
      timestamp: codeEntry.timestamp
    });

    res.json({
      success: true,
      message: 'Code saved to session history'
    });

  } catch (error) {
    console.error('Save code history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get session history
const getSessionHistory = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId)
      .populate('codeHistory.author', 'fullName idNumber email role')
      .populate('hostedBy', 'fullName idNumber email role')
      .populate('participants', 'fullName idNumber email role');

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is a participant, host, teacher, or admin
    const user = await User.findById(req.userId);
    if (!session.participants.includes(req.userId) && 
        session.hostedBy.toString() !== req.userId && 
        !['teacher', 'admin'].includes(user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this session history'
      });
    }

    res.json({
      success: true,
      session
    });

  } catch (error) {
    console.error('Get session history error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Leave a session
const leaveSession = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    // Check if user is in the session
    if (!session.participants.includes(req.userId)) {
      return res.status(400).json({
        success: false,
        message: 'You are not a participant in this session'
      });
    }

    // Don't allow host to leave without ending session
    if (session.hostedBy.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'Session host must end the session instead of leaving'
      });
    }

    // Remove user from active participants
    session.activeParticipants = session.activeParticipants.filter(
      participant => participant.toString() !== req.userId
    );

    // Update participation history
    const participationRecord = session.participationHistory.find(
      record => record.user.toString() === req.userId && !record.leftAt
    );
    if (participationRecord) {
      participationRecord.leftAt = new Date();
    }

    await session.save();
    await session.populate('hostedBy', 'fullName idNumber email role');
    await session.populate('participants', 'fullName idNumber email role');

    res.json({
      success: true,
      message: 'Successfully left the session',
      session
    });

  } catch (error) {
    console.error('Leave session error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get user's session participation history
const getMySessionHistory = async (req, res) => {
  try {
    const sessions = await Session.find({
      'participationHistory.user': req.userId
    })
    .populate('hostedBy', 'fullName idNumber email role')
    .populate('participationHistory.user', 'fullName idNumber email role')
    .sort({ createdAt: -1 });

    // Format the history for each session
    const formattedHistory = sessions.map(session => ({
      sessionId: session._id,
      title: session.title,
      sessionCode: session.sessionCode,
      host: session.hostedBy,
      isActive: session.isActive,
      createdAt: session.createdAt,
      endedAt: session.endTime,
      // Get user's participation records for this session
      participations: session.participationHistory
        .filter(record => record.user._id.toString() === req.userId)
        .map(record => ({
          joinedAt: record.joinedAt,
          leftAt: record.leftAt,
          role: record.role
        }))
    }));

    res.json({
      success: true,
      history: formattedHistory
    });

  } catch (error) {
    console.error('Get session history error:', error);
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
  getMyJoinedSessions,
  joinSession,
  leaveSession,
  endSession,
  saveCodeToHistory,
  getSessionHistory,
  getMySessionHistory
};
