const express = require('express');
const router = express.Router();

const { 
  getAllUsers, 
  getAllStudents, 
  getAllTeachers, 
  changeUserRole, 
  toggleUserStatus, 
  getDashboardStats 
} = require('../controllers/adminController');
const { authMiddleware, requireAdmin, requireTeacherOrAdmin } = require('../middleware/auth');

// Admin only routes
router.get('/users', authMiddleware, requireAdmin, getAllUsers);
router.get('/teachers', authMiddleware, requireAdmin, getAllTeachers);
router.put('/users/:userId/role', authMiddleware, requireAdmin, changeUserRole);
router.put('/users/:userId/status', authMiddleware, requireAdmin, toggleUserStatus);
router.get('/stats', authMiddleware, requireAdmin, getDashboardStats);

// Teacher and Admin routes
router.get('/students', authMiddleware, requireTeacherOrAdmin, getAllStudents);

module.exports = router;
