const express = require('express');
const router = express.Router();

const { 
  createSession, 
  getAllSessions, 
  getMyHostedSessions, 
  joinSession, 
  endSession 
} = require('../controllers/sessionController');
const { authMiddleware, requireStudent, requireTeacherOrAdmin } = require('../middleware/auth');
const { sessionValidation } = require('../middleware/validation');

// Student routes
router.post('/create', authMiddleware, requireStudent, sessionValidation, createSession);
router.get('/my-hosted', authMiddleware, getMyHostedSessions);
router.post('/join', authMiddleware, joinSession);
router.put('/:sessionId/end', authMiddleware, endSession);

// Teacher and Admin routes
router.get('/all', authMiddleware, requireTeacherOrAdmin, getAllSessions);

module.exports = router;
