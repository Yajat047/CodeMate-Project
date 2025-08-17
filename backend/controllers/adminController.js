const User = require('../models/User');
const Session = require('../models/Session');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      users
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all students (teacher and admin)
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      students
    });

  } catch (error) {
    console.error('Get all students error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get all teachers (admin only)
const getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      teachers
    });

  } catch (error) {
    console.error('Get all teachers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Change user role (admin only)
const changeUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;

    // Validate role
    if (!['student', 'teacher', 'admin'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be student, teacher, or admin'
      });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from changing their own role
    if (user._id.toString() === req.userId && newRole !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'You cannot change your own admin role'
      });
    }

    const oldRole = user.role;
    user.role = newRole;
    await user.save();

    res.json({
      success: true,
      message: `User role changed from ${oldRole} to ${newRole}`,
      user
    });

  } catch (error) {
    console.error('Change user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Toggle user active status (admin only)
const toggleUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account'
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      user
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get dashboard stats (admin only)
const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalAdmins = await User.countDocuments({ role: 'admin' });
    const activeUsers = await User.countDocuments({ isActive: true });
    
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ isActive: true });
    const completedSessions = await Session.countDocuments({ isActive: false });

    res.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          students: totalStudents,
          teachers: totalTeachers,
          admins: totalAdmins,
          active: activeUsers,
          inactive: totalUsers - activeUsers
        },
        sessions: {
          total: totalSessions,
          active: activeSessions,
          completed: completedSessions
        }
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

module.exports = {
  getAllUsers,
  getAllStudents,
  getAllTeachers,
  changeUserRole,
  toggleUserStatus,
  getDashboardStats
};
