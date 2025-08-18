const express = require('express');
const router = express.Router();

const { 
  createSession, 
  getAllSessions, 
  getMyHostedSessions,
  getMyJoinedSessions,
  joinSession, 
  endSession,
  saveCodeToHistory,
  getSessionHistory,
  leaveSession,
  getMySessionHistory
} = require('../controllers/sessionController');
const { authMiddleware, requireStudent, requireTeacherOrAdmin } = require('../middleware/auth');
const { sessionValidation } = require('../middleware/validation');

// Routes for all authenticated users
router.post('/create', authMiddleware, sessionValidation, createSession);
router.get('/my-hosted', authMiddleware, getMyHostedSessions);
router.get('/my-joined', authMiddleware, getMyJoinedSessions);
router.get('/my-history', authMiddleware, getMySessionHistory);
router.post('/join', authMiddleware, joinSession);
router.put('/:sessionId/end', authMiddleware, endSession);
router.post('/:sessionId/code', authMiddleware, saveCodeToHistory);
router.get('/:sessionId/history', authMiddleware, getSessionHistory);
router.post('/:sessionId/leave', authMiddleware, leaveSession);

// Teacher and Admin routes
router.get('/all', authMiddleware, requireTeacherOrAdmin, getAllSessions);

module.exports = router;
