const { query, getClient } = require('../config/database');

class Task {
  static async create(taskData) {
    const { 
      userId, 
      title, 
      description, 
      parentTaskId, 
      dueDate, 
      priority = 'Medium', 
      status = 'To Do' 
    } = taskData;

    const result = await query(`
      INSERT INTO tasks (user_id, title, description, parent_task_id, due_date, priority, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, title, description, parentTaskId, dueDate, priority, status]);

    return result.rows[0];
  }

  static async findById(taskId, userId) {
    const result = await query(`
      SELECT t.*, 
             pt.title as parent_title,
             COALESCE(subtask_count.count, 0) as subtask_count
      FROM tasks t
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      LEFT JOIN (
        SELECT parent_task_id, COUNT(*) as count
        FROM tasks
        WHERE parent_task_id IS NOT NULL
        GROUP BY parent_task_id
      ) subtask_count ON t.id = subtask_count.parent_task_id
      WHERE t.id = $1 AND t.user_id = $2
    `, [taskId, userId]);

    return result.rows[0];
  }

  static async findByUser(userId, options = {}) {
    let whereClause = 'WHERE t.user_id = $1';
    let orderClause = 'ORDER BY t.due_date ASC NULLS LAST, t.priority DESC, t.created_at DESC';
    let params = [userId];

    // Add filtering options
    if (options.status) {
      params.push(options.status);
      whereClause += ` AND t.status = $${params.length}`;
    }

    if (options.priority) {
      params.push(options.priority);
      whereClause += ` AND t.priority = $${params.length}`;
    }

    if (options.search) {
      params.push(`%${options.search}%`);
      whereClause += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
    }

    const result = await query(`
      SELECT t.*, 
             pt.title as parent_title,
             COALESCE(subtask_count.count, 0) as subtask_count,
             COALESCE(dependency_count.count, 0) as dependency_count
      FROM tasks t
      LEFT JOIN tasks pt ON t.parent_task_id = pt.id
      LEFT JOIN (
        SELECT parent_task_id, COUNT(*) as count
        FROM tasks
        WHERE parent_task_id IS NOT NULL
        GROUP BY parent_task_id
      ) subtask_count ON t.id = subtask_count.parent_task_id
      LEFT JOIN (
        SELECT task_id, COUNT(*) as count
        FROM task_dependencies
        GROUP BY task_id
      ) dependency_count ON t.id = dependency_count.task_id
      ${whereClause}
      ${orderClause}
    `, params);

    return result.rows;
  }

  static async getTaskTree(userId) {
    const result = await query(`
      WITH RECURSIVE task_tree AS (
        -- Base case: root tasks (no parent)
        SELECT t.*, 0 as level, ARRAY[t.id] as path
        FROM tasks t
        WHERE t.user_id = $1 AND t.parent_task_id IS NULL
        
        UNION ALL
        
        -- Recursive case: subtasks
        SELECT t.*, tt.level + 1, tt.path || t.id
        FROM tasks t
        INNER JOIN task_tree tt ON t.parent_task_id = tt.id
        WHERE t.user_id = $1
      )
      SELECT * FROM task_tree
      ORDER BY level, due_date ASC NULLS LAST, priority DESC, created_at DESC
    `, [userId]);

    return result.rows;
  }

  static async update(taskId, userId, updateData) {
    const fields = [];
    const values = [];
    let paramCount = 0;

    // Build dynamic update query
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        paramCount++;
        fields.push(`${key} = $${paramCount}`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(taskId, userId);
    
    const result = await query(`
      UPDATE tasks 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount + 1} AND user_id = $${paramCount + 2}
      RETURNING *
    `, values);

    return result.rows[0];
  }

  static async delete(taskId, userId) {
    // This will cascade delete subtasks and dependencies due to foreign key constraints
    const result = await query(`
      DELETE FROM tasks 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `, [taskId, userId]);

    return result.rows[0];
  }

  static async getSubtasks(parentTaskId, userId) {
    const result = await query(`
      SELECT t.*,
             COALESCE(subtask_count.count, 0) as subtask_count
      FROM tasks t
      LEFT JOIN (
        SELECT parent_task_id, COUNT(*) as count
        FROM tasks
        WHERE parent_task_id IS NOT NULL
        GROUP BY parent_task_id
      ) subtask_count ON t.id = subtask_count.parent_task_id
      WHERE t.parent_task_id = $1 AND t.user_id = $2
      ORDER BY t.created_at ASC
    `, [parentTaskId, userId]);

    return result.rows;
  }

  // Challenge Feature: Dependencies
  static async addDependency(taskId, dependsOnTaskId, userId) {
    // First check if both tasks belong to the user
    const taskCheck = await query(`
      SELECT id FROM tasks 
      WHERE id IN ($1, $2) AND user_id = $3
    `, [taskId, dependsOnTaskId, userId]);

    if (taskCheck.rows.length !== 2) {
      throw new Error('One or both tasks not found or not owned by user');
    }

    // Check for circular dependency
    const hasCircular = await this.checkCircularDependency(taskId, dependsOnTaskId);
    if (hasCircular) {
      throw new Error('Adding this dependency would create a circular dependency');
    }

    try {
      const result = await query(`
        INSERT INTO task_dependencies (task_id, depends_on_task_id)
        VALUES ($1, $2)
        RETURNING *
      `, [taskId, dependsOnTaskId]);

      // Update task status to blocked if it has dependencies
      await this.updateTaskStatusBasedOnDependencies(taskId);

      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Dependency already exists');
      }
      throw error;
    }
  }

  static async removeDependency(taskId, dependsOnTaskId, userId) {
    // Verify task ownership
    const taskCheck = await query(`
      SELECT id FROM tasks WHERE id = $1 AND user_id = $2
    `, [taskId, userId]);

    if (taskCheck.rows.length === 0) {
      throw new Error('Task not found or not owned by user');
    }

    const result = await query(`
      DELETE FROM task_dependencies 
      WHERE task_id = $1 AND depends_on_task_id = $2
      RETURNING *
    `, [taskId, dependsOnTaskId]);

    // Update task status after removing dependency
    await this.updateTaskStatusBasedOnDependencies(taskId);

    return result.rows[0];
  }

  static async getDependencies(taskId, userId) {
    const result = await query(`
      SELECT t.*, td.created_at as dependency_created_at
      FROM task_dependencies td
      JOIN tasks t ON td.depends_on_task_id = t.id
      WHERE td.task_id = $1 AND t.user_id = $2
      ORDER BY td.created_at ASC
    `, [taskId, userId]);

    return result.rows;
  }

  static async getDependents(taskId, userId) {
    const result = await query(`
      SELECT t.*, td.created_at as dependency_created_at
      FROM task_dependencies td
      JOIN tasks t ON td.task_id = t.id
      WHERE td.depends_on_task_id = $1 AND t.user_id = $2
      ORDER BY td.created_at ASC
    `, [taskId, userId]);

    return result.rows;
  }

  // Circular dependency detection using DFS
  static async checkCircularDependency(fromTaskId, toTaskId, visited = new Set(), path = new Set()) {
    if (path.has(toTaskId)) {
      return true; // Found a cycle
    }

    if (visited.has(toTaskId)) {
      return false; // Already explored this path
    }

    visited.add(toTaskId);
    path.add(toTaskId);

    // Get all dependencies of toTaskId
    const dependencies = await query(`
      SELECT depends_on_task_id FROM task_dependencies WHERE task_id = $1
    `, [toTaskId]);

    for (const dep of dependencies.rows) {
      if (await this.checkCircularDependency(fromTaskId, dep.depends_on_task_id, visited, path)) {
        return true;
      }
    }

    path.delete(toTaskId);
    return false;
  }

  static async validateDependencies(taskId, dependsOnTaskId) {
    return await this.checkCircularDependency(taskId, dependsOnTaskId);
  }

  static async updateTaskStatusBasedOnDependencies(taskId) {
    // Get incomplete dependencies
    const incompleteDeps = await query(`
      SELECT COUNT(*) as count
      FROM task_dependencies td
      JOIN tasks t ON td.depends_on_task_id = t.id
      WHERE td.task_id = $1 AND t.status != 'Completed'
    `, [taskId]);

    const hasIncompleteDeps = parseInt(incompleteDeps.rows[0].count) > 0;

    // Get current task status
    const currentTask = await query(`
      SELECT status FROM tasks WHERE id = $1
    `, [taskId]);

    if (currentTask.rows.length === 0) return;

    const currentStatus = currentTask.rows[0].status;

    // Update status based on dependencies
    if (hasIncompleteDeps && currentStatus !== 'Blocked' && currentStatus !== 'Completed') {
      await query(`
        UPDATE tasks SET status = 'Blocked' WHERE id = $1
      `, [taskId]);
    } else if (!hasIncompleteDeps && currentStatus === 'Blocked') {
      await query(`
        UPDATE tasks SET status = 'To Do' WHERE id = $1
      `, [taskId]);
    }
  }

  static async canCompleteTask(taskId) {
    // Check if all subtasks are completed
    const incompleteSubtasks = await query(`
      SELECT COUNT(*) as count
      FROM tasks
      WHERE parent_task_id = $1 AND status != 'Completed'
    `, [taskId]);

    return parseInt(incompleteSubtasks.rows[0].count) === 0;
  }

  static async markAsCompleted(taskId, userId) {
    // Check if task can be completed
    const canComplete = await this.canCompleteTask(taskId);
    if (!canComplete) {
      throw new Error('Cannot complete task: subtasks are not completed');
    }

    const result = await this.update(taskId, userId, { status: 'Completed' });

    // Update dependent tasks status
    const dependents = await query(`
      SELECT task_id FROM task_dependencies WHERE depends_on_task_id = $1
    `, [taskId]);

    for (const dependent of dependents.rows) {
      await this.updateTaskStatusBasedOnDependencies(dependent.task_id);
    }

    return result;
  }
}

module.exports = Task;