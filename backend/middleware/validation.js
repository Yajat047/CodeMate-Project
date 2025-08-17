const { body } = require('express-validator');

// Validation rules for user signup
const signupValidation = [
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Full name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Full name should only contain letters and spaces'),

  body('idNumber')
    .trim()
    .isLength({ min: 3, max: 20 })
    .withMessage('ID number must be between 3 and 20 characters')
    .matches(/^[a-zA-Z0-9]+$/)
    .withMessage('ID number should only contain letters and numbers'),

  body('email')
    .isEmail()
    .withMessage('Please enter a valid email address')
    .normalizeEmail(),

  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
];

// Validation rules for user login
const loginValidation = [
  body('emailOrId')
    .notEmpty()
    .withMessage('Email or ID number is required')
    .trim(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Validation rules for session creation
const sessionValidation = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Session title must be between 3 and 100 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),

  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Max participants must be between 1 and 200')
];

module.exports = {
  signupValidation,
  loginValidation,
  sessionValidation
};
