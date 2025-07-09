const express = require('express');
const TaskController = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/auth');
const {
  validateTaskCreation,
  validateTaskUpdate,
  validateTaskId,
  validateDependencyId,
  validateAddDependency,
  validateTaskQuery,
  validateDependencyCheck
} = require('../middleware/validation');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Core task routes
router.get('/', validateTaskQuery, TaskController.getAllTasks);
router.post('/', validateTaskCreation, TaskController.createTask);
router.get('/tree', TaskController.getTaskTree);

// Single task operations
router.get('/:id', validateTaskId, TaskController.getTaskById);
router.put('/:id', validateTaskId, validateTaskUpdate, TaskController.updateTask);
router.delete('/:id', validateTaskId, TaskController.deleteTask);

// Mark task as completed (special endpoint for validation)
router.patch('/:id/complete', validateTaskId, TaskController.markAsCompleted);

// Subtask routes
router.post('/:id/subtasks', validateTaskId, validateTaskCreation, TaskController.createSubtask);
router.get('/:id/subtasks', validateTaskId, TaskController.getSubtasks);

// Challenge Feature: Dependency routes
router.post('/:id/dependencies', validateTaskId, validateAddDependency, TaskController.addDependency);
router.delete('/:id/dependencies/:depId', validateDependencyId, TaskController.removeDependency);
router.get('/:id/dependencies', validateTaskId, TaskController.getDependencies);
router.get('/:id/dependents', validateTaskId, TaskController.getDependents);

// Validation endpoint for circular dependencies
router.post('/validate-dependencies', validateDependencyCheck, TaskController.validateDependencies);

module.exports = router;