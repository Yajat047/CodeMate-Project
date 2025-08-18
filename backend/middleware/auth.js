const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader); // Debug log
    
    let token = null;
    if (authHeader) {
      // Handle case where Bearer might be duplicated
      token = authHeader.replace(/^Bearer\s+Bearer\s+/, 'Bearer ');
      token = token.startsWith('Bearer ') ? token.substring(7) : token;
    }
      
    console.log('Extracted token:', token ? 'present' : 'null'); // Debug log

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expired',
          expired: true
        });
      }
      throw err;
    }
    
    // Check if user exists and is active
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive',
        userNotFound: true
      });
    }

    // Add user ID to request object
    req.userId = decoded.userId;
    req.userRole = user.role;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Middleware to check if user is a teacher
const requireTeacher = (req, res, next) => {
  if (req.userRole !== 'teacher') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher role required.'
    });
  }
  next();
};

// Middleware to check if user is an admin
const requireAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.'
    });
  }
  next();
};

// Middleware to check if user is a student
const requireStudent = (req, res, next) => {
  if (req.userRole !== 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Student role required.'
    });
  }
  next();
};

// Middleware to check if user is teacher or admin
const requireTeacherOrAdmin = (req, res, next) => {
  if (!['teacher', 'admin'].includes(req.userRole)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Teacher or Admin role required.'
    });
  }
  next();
};

module.exports = {
  authMiddleware,
  requireTeacher,
  requireAdmin,
  requireStudent,
  requireTeacherOrAdmin
};
