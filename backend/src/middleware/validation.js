const { body, param, query, validationResult } = require('express-validator');

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Please check your input data',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateRegistration = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  handleValidationErrors
];

const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Task validation rules
const validateTaskCreation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title is required and must be less than 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due date must be a valid date'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'Completed', 'Blocked'])
    .withMessage('Status must be To Do, In Progress, Completed, or Blocked'),
  body('parentTaskId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Parent task ID must be a valid positive integer'),
  handleValidationErrors
];

const validateTaskUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be less than 2000 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Due date must be a valid date'),
  body('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  body('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'Completed', 'Blocked'])
    .withMessage('Status must be To Do, In Progress, Completed, or Blocked'),
  handleValidationErrors
];

// Parameter validation
const validateTaskId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a valid positive integer'),
  handleValidationErrors
];

const validateDependencyId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a valid positive integer'),
  param('depId')
    .isInt({ min: 1 })
    .withMessage('Dependency ID must be a valid positive integer'),
  handleValidationErrors
];

// Dependency validation
const validateAddDependency = [
  body('dependsOnTaskId')
    .isInt({ min: 1 })
    .withMessage('Depends on task ID must be a valid positive integer'),
  handleValidationErrors
];

// Query validation
const validateTaskQuery = [
  query('status')
    .optional()
    .isIn(['To Do', 'In Progress', 'Completed', 'Blocked'])
    .withMessage('Status must be To Do, In Progress, Completed, or Blocked'),
  query('priority')
    .optional()
    .isIn(['Low', 'Medium', 'High'])
    .withMessage('Priority must be Low, Medium, or High'),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Search query must be less than 100 characters'),
  handleValidationErrors
];

// Validation for circular dependency check
const validateDependencyCheck = [
  body('taskId')
    .isInt({ min: 1 })
    .withMessage('Task ID must be a valid positive integer'),
  body('dependsOnTaskId')
    .isInt({ min: 1 })
    .withMessage('Depends on task ID must be a valid positive integer'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskId,
  validateDependencyId,
  validateAddDependency,
  validateTaskQuery,
  validateDependencyCheck,
  handleValidationErrors
};