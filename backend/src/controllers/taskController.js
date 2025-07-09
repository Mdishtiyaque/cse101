const Task = require('../models/Task');

class TaskController {
  // Get all tasks for the authenticated user
  static async getAllTasks(req, res) {
    try {
      const userId = req.user.id;
      const options = {
        status: req.query.status,
        priority: req.query.priority,
        search: req.query.search
      };

      const tasks = await Task.findByUser(userId, options);

      res.json({
        message: 'Tasks retrieved successfully',
        tasks,
        count: tasks.length
      });

    } catch (error) {
      console.error('Get tasks error:', error);
      res.status(500).json({
        error: 'Failed to retrieve tasks',
        message: 'An error occurred while fetching tasks'
      });
    }
  }

  // Get task tree (hierarchical view)
  static async getTaskTree(req, res) {
    try {
      const userId = req.user.id;
      const tasks = await Task.getTaskTree(userId);

      res.json({
        message: 'Task tree retrieved successfully',
        tasks,
        count: tasks.length
      });

    } catch (error) {
      console.error('Get task tree error:', error);
      res.status(500).json({
        error: 'Failed to retrieve task tree',
        message: 'An error occurred while fetching hierarchical tasks'
      });
    }
  }

  // Get single task by ID
  static async getTaskById(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      const task = await Task.findById(taskId, userId);

      if (!task) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The requested task does not exist or you do not have access to it'
        });
      }

      // Get additional information
      const [subtasks, dependencies, dependents] = await Promise.all([
        Task.getSubtasks(taskId, userId),
        Task.getDependencies(taskId, userId),
        Task.getDependents(taskId, userId)
      ]);

      res.json({
        message: 'Task retrieved successfully',
        task: {
          ...task,
          subtasks,
          dependencies,
          dependents
        }
      });

    } catch (error) {
      console.error('Get task by ID error:', error);
      res.status(500).json({
        error: 'Failed to retrieve task',
        message: 'An error occurred while fetching the task'
      });
    }
  }

  // Create new task
  static async createTask(req, res) {
    try {
      const userId = req.user.id;
      const { title, description, parentTaskId, dueDate, priority, status } = req.body;

      // If creating a subtask, verify parent exists and belongs to user
      if (parentTaskId) {
        const parentTask = await Task.findById(parentTaskId, userId);
        if (!parentTask) {
          return res.status(404).json({
            error: 'Parent task not found',
            message: 'The specified parent task does not exist or you do not have access to it'
          });
        }

        // Check if parent is already a subtask (only one level deep allowed)
        if (parentTask.parent_task_id) {
          return res.status(400).json({
            error: 'Invalid parent task',
            message: 'Cannot create subtask of a subtask. Only one level of nesting is allowed.'
          });
        }
      }

      const taskData = {
        userId,
        title,
        description,
        parentTaskId,
        dueDate,
        priority,
        status
      };

      const task = await Task.create(taskData);

      res.status(201).json({
        message: 'Task created successfully',
        task
      });

    } catch (error) {
      console.error('Create task error:', error);
      res.status(500).json({
        error: 'Failed to create task',
        message: 'An error occurred while creating the task'
      });
    }
  }

  // Update task
  static async updateTask(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;
      const updateData = req.body;

      // Check if task exists and belongs to user
      const existingTask = await Task.findById(taskId, userId);
      if (!existingTask) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The requested task does not exist or you do not have access to it'
        });
      }

      // If updating status to completed, check if it's allowed
      if (updateData.status === 'Completed') {
        const canComplete = await Task.canCompleteTask(taskId);
        if (!canComplete) {
          return res.status(400).json({
            error: 'Cannot complete task',
            message: 'All subtasks must be completed before completing the parent task'
          });
        }
      }

      const updatedTask = await Task.update(taskId, userId, updateData);

      if (!updatedTask) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'Task not found or no changes made'
        });
      }

      // If task was completed, update dependent tasks
      if (updateData.status === 'Completed') {
        const dependents = await Task.getDependents(taskId, userId);
        for (const dependent of dependents) {
          await Task.updateTaskStatusBasedOnDependencies(dependent.id);
        }
      }

      res.json({
        message: 'Task updated successfully',
        task: updatedTask
      });

    } catch (error) {
      console.error('Update task error:', error);
      res.status(500).json({
        error: 'Failed to update task',
        message: 'An error occurred while updating the task'
      });
    }
  }

  // Delete task
  static async deleteTask(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      const deletedTask = await Task.delete(taskId, userId);

      if (!deletedTask) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The requested task does not exist or you do not have access to it'
        });
      }

      res.json({
        message: 'Task deleted successfully',
        task: deletedTask
      });

    } catch (error) {
      console.error('Delete task error:', error);
      res.status(500).json({
        error: 'Failed to delete task',
        message: 'An error occurred while deleting the task'
      });
    }
  }

  // Create subtask
  static async createSubtask(req, res) {
    try {
      const parentTaskId = req.params.id;
      const userId = req.user.id;
      const { title, description, dueDate, priority } = req.body;

      // Verify parent task exists and belongs to user
      const parentTask = await Task.findById(parentTaskId, userId);
      if (!parentTask) {
        return res.status(404).json({
          error: 'Parent task not found',
          message: 'The specified parent task does not exist or you do not have access to it'
        });
      }

      // Check if parent is already a subtask (only one level deep allowed)
      if (parentTask.parent_task_id) {
        return res.status(400).json({
          error: 'Invalid parent task',
          message: 'Cannot create subtask of a subtask. Only one level of nesting is allowed.'
        });
      }

      const taskData = {
        userId,
        title,
        description,
        parentTaskId,
        dueDate,
        priority,
        status: 'To Do'
      };

      const subtask = await Task.create(taskData);

      res.status(201).json({
        message: 'Subtask created successfully',
        task: subtask
      });

    } catch (error) {
      console.error('Create subtask error:', error);
      res.status(500).json({
        error: 'Failed to create subtask',
        message: 'An error occurred while creating the subtask'
      });
    }
  }

  // Get subtasks
  static async getSubtasks(req, res) {
    try {
      const parentTaskId = req.params.id;
      const userId = req.user.id;

      // Verify parent task exists and belongs to user
      const parentTask = await Task.findById(parentTaskId, userId);
      if (!parentTask) {
        return res.status(404).json({
          error: 'Parent task not found',
          message: 'The specified parent task does not exist or you do not have access to it'
        });
      }

      const subtasks = await Task.getSubtasks(parentTaskId, userId);

      res.json({
        message: 'Subtasks retrieved successfully',
        subtasks,
        count: subtasks.length
      });

    } catch (error) {
      console.error('Get subtasks error:', error);
      res.status(500).json({
        error: 'Failed to retrieve subtasks',
        message: 'An error occurred while fetching subtasks'
      });
    }
  }

  // Challenge Feature: Add dependency
  static async addDependency(req, res) {
    try {
      const taskId = req.params.id;
      const { dependsOnTaskId } = req.body;
      const userId = req.user.id;

      // Verify task exists and belongs to user
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The specified task does not exist or you do not have access to it'
        });
      }

      const dependency = await Task.addDependency(taskId, dependsOnTaskId, userId);

      res.status(201).json({
        message: 'Dependency added successfully',
        dependency
      });

    } catch (error) {
      console.error('Add dependency error:', error);
      
      if (error.message.includes('circular dependency')) {
        return res.status(400).json({
          error: 'Circular dependency detected',
          message: 'Adding this dependency would create a circular dependency chain'
        });
      }

      if (error.message.includes('not found')) {
        return res.status(404).json({
          error: 'Task not found',
          message: error.message
        });
      }

      if (error.message.includes('already exists')) {
        return res.status(409).json({
          error: 'Dependency already exists',
          message: 'This dependency relationship already exists'
        });
      }

      res.status(500).json({
        error: 'Failed to add dependency',
        message: 'An error occurred while adding the dependency'
      });
    }
  }

  // Remove dependency
  static async removeDependency(req, res) {
    try {
      const taskId = req.params.id;
      const dependsOnTaskId = req.params.depId;
      const userId = req.user.id;

      const removedDependency = await Task.removeDependency(taskId, dependsOnTaskId, userId);

      if (!removedDependency) {
        return res.status(404).json({
          error: 'Dependency not found',
          message: 'The specified dependency does not exist'
        });
      }

      res.json({
        message: 'Dependency removed successfully',
        dependency: removedDependency
      });

    } catch (error) {
      console.error('Remove dependency error:', error);
      res.status(500).json({
        error: 'Failed to remove dependency',
        message: 'An error occurred while removing the dependency'
      });
    }
  }

  // Get task dependencies
  static async getDependencies(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      // Verify task exists and belongs to user
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The specified task does not exist or you do not have access to it'
        });
      }

      const dependencies = await Task.getDependencies(taskId, userId);

      res.json({
        message: 'Dependencies retrieved successfully',
        dependencies,
        count: dependencies.length
      });

    } catch (error) {
      console.error('Get dependencies error:', error);
      res.status(500).json({
        error: 'Failed to retrieve dependencies',
        message: 'An error occurred while fetching dependencies'
      });
    }
  }

  // Get tasks that depend on this task
  static async getDependents(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      // Verify task exists and belongs to user
      const task = await Task.findById(taskId, userId);
      if (!task) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The specified task does not exist or you do not have access to it'
        });
      }

      const dependents = await Task.getDependents(taskId, userId);

      res.json({
        message: 'Dependents retrieved successfully',
        dependents,
        count: dependents.length
      });

    } catch (error) {
      console.error('Get dependents error:', error);
      res.status(500).json({
        error: 'Failed to retrieve dependents',
        message: 'An error occurred while fetching dependents'
      });
    }
  }

  // Validate dependencies (check for circular dependencies)
  static async validateDependencies(req, res) {
    try {
      const { taskId, dependsOnTaskId } = req.body;

      const hasCircular = await Task.validateDependencies(taskId, dependsOnTaskId);

      res.json({
        message: 'Dependency validation completed',
        hasCircularDependency: hasCircular,
        canAddDependency: !hasCircular
      });

    } catch (error) {
      console.error('Validate dependencies error:', error);
      res.status(500).json({
        error: 'Failed to validate dependencies',
        message: 'An error occurred while validating dependencies'
      });
    }
  }

  // Mark task as completed (with validation)
  static async markAsCompleted(req, res) {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      const task = await Task.markAsCompleted(taskId, userId);

      if (!task) {
        return res.status(404).json({
          error: 'Task not found',
          message: 'The specified task does not exist or you do not have access to it'
        });
      }

      res.json({
        message: 'Task marked as completed successfully',
        task
      });

    } catch (error) {
      console.error('Mark as completed error:', error);
      
      if (error.message.includes('subtasks are not completed')) {
        return res.status(400).json({
          error: 'Cannot complete task',
          message: 'All subtasks must be completed before completing the parent task'
        });
      }

      res.status(500).json({
        error: 'Failed to mark task as completed',
        message: 'An error occurred while updating the task status'
      });
    }
  }
}

module.exports = TaskController;