import { format, formatDistanceToNow, isToday, isTomorrow, isPast } from 'date-fns';

// Date formatting utilities
export const dateUtils = {
  // Format date for display
  formatDate: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isToday(dateObj)) return 'Today';
    if (isTomorrow(dateObj)) return 'Tomorrow';
    
    return format(dateObj, 'MMM d, yyyy');
  },
  
  // Format date for input fields
  formatForInput: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'yyyy-MM-dd');
  },
  
  // Get relative time
  getRelativeTime: (date) => {
    if (!date) return '';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistanceToNow(dateObj, { addSuffix: true });
  },
  
  // Check if date is overdue
  isOverdue: (date) => {
    if (!date) return false;
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return isPast(dateObj) && !isToday(dateObj);
  },
  
  // Get date color class based on due date
  getDateColorClass: (date) => {
    if (!date) return 'text-gray-500';
    
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isPast(dateObj) && !isToday(dateObj)) {
      return 'text-danger-600'; // Overdue
    }
    
    if (isToday(dateObj)) {
      return 'text-warning-600'; // Due today
    }
    
    if (isTomorrow(dateObj)) {
      return 'text-warning-500'; // Due tomorrow
    }
    
    return 'text-gray-600'; // Future dates
  }
};

// Task utility functions
export const taskUtils = {
  // Get priority color class
  getPriorityClass: (priority) => {
    const classes = {
      'Low': 'priority-low',
      'Medium': 'priority-medium',
      'High': 'priority-high'
    };
    return classes[priority] || 'badge-gray';
  },
  
  // Get status color class
  getStatusClass: (status) => {
    const classes = {
      'To Do': 'status-todo',
      'In Progress': 'status-progress',
      'Completed': 'status-completed',
      'Blocked': 'status-blocked'
    };
    return classes[status] || 'badge-gray';
  },
  
  // Get priority badge color
  getPriorityBadgeClass: (priority) => {
    const classes = {
      'Low': 'badge-success',
      'Medium': 'badge-warning',
      'High': 'badge-danger'
    };
    return classes[priority] || 'badge-gray';
  },
  
  // Get status badge color
  getStatusBadgeClass: (status) => {
    const classes = {
      'To Do': 'badge-gray',
      'In Progress': 'badge-primary',
      'Completed': 'badge-success',
      'Blocked': 'badge-danger'
    };
    return classes[status] || 'badge-gray';
  },
  
  // Check if task can be completed
  canCompleteTask: (task) => {
    if (!task) return false;
    
    // If task has subtasks, all must be completed
    if (task.subtasks && task.subtasks.length > 0) {
      return task.subtasks.every(subtask => subtask.status === 'Completed');
    }
    
    return true;
  },
  
  // Check if task is blocked by dependencies
  isBlockedByDependencies: (task) => {
    if (!task || !task.dependencies) return false;
    
    return task.dependencies.some(dep => dep.status !== 'Completed');
  },
  
  // Get task completion percentage
  getCompletionPercentage: (task) => {
    if (!task || !task.subtasks || task.subtasks.length === 0) {
      return task?.status === 'Completed' ? 100 : 0;
    }
    
    const completedSubtasks = task.subtasks.filter(subtask => subtask.status === 'Completed').length;
    return Math.round((completedSubtasks / task.subtasks.length) * 100);
  },
  
  // Sort tasks by priority and due date
  sortTasks: (tasks, sortBy = 'dueDate') => {
    const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
    
    return [...tasks].sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityDiff = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
      }
      
      // Secondary sort by due date
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      
      return new Date(a.due_date) - new Date(b.due_date);
    });
  },
  
  // Filter tasks based on criteria
  filterTasks: (tasks, filters) => {
    return tasks.filter(task => {
      if (filters.status && task.status !== filters.status) return false;
      if (filters.priority && task.priority !== filters.priority) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const titleMatch = task.title.toLowerCase().includes(searchLower);
        const descMatch = task.description?.toLowerCase().includes(searchLower) || false;
        if (!titleMatch && !descMatch) return false;
      }
      if (filters.overdue && !dateUtils.isOverdue(task.due_date)) return false;
      if (filters.dueToday && !isToday(new Date(task.due_date))) return false;
      
      return true;
    });
  },
  
  // Get task statistics
  getTaskStats: (tasks) => {
    const stats = {
      total: tasks.length,
      completed: 0,
      inProgress: 0,
      toDo: 0,
      blocked: 0,
      overdue: 0,
      dueToday: 0,
      high: 0,
      medium: 0,
      low: 0
    };
    
    tasks.forEach(task => {
      // Status counts
      switch (task.status) {
        case 'Completed':
          stats.completed++;
          break;
        case 'In Progress':
          stats.inProgress++;
          break;
        case 'To Do':
          stats.toDo++;
          break;
        case 'Blocked':
          stats.blocked++;
          break;
      }
      
      // Priority counts
      switch (task.priority) {
        case 'High':
          stats.high++;
          break;
        case 'Medium':
          stats.medium++;
          break;
        case 'Low':
          stats.low++;
          break;
      }
      
      // Due date counts
      if (task.due_date) {
        if (dateUtils.isOverdue(task.due_date)) {
          stats.overdue++;
        }
        if (isToday(new Date(task.due_date))) {
          stats.dueToday++;
        }
      }
    });
    
    return stats;
  }
};

// Form validation utilities
export const validationUtils = {
  // Validate email
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  // Validate password strength
  validatePassword: (password) => {
    const errors = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  },
  
  // Validate task title
  validateTaskTitle: (title) => {
    if (!title || title.trim().length === 0) {
      return { isValid: false, error: 'Title is required' };
    }
    
    if (title.length > 255) {
      return { isValid: false, error: 'Title must be less than 255 characters' };
    }
    
    return { isValid: true };
  },
  
  // Validate due date
  validateDueDate: (date) => {
    if (!date) return { isValid: true }; // Optional field
    
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      return { isValid: false, error: 'Invalid date format' };
    }
    
    return { isValid: true };
  }
};

// UI utility functions
export const uiUtils = {
  // Generate unique IDs
  generateId: () => {
    return Math.random().toString(36).substr(2, 9);
  },
  
  // Scroll to element
  scrollToElement: (elementId) => {
    const element = document.getElementById(elementId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  },
  
  // Copy text to clipboard
  copyToClipboard: async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  },
  
  // Debounce function
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
  
  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },
  
  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
};

// Export all utilities
export default {
  dateUtils,
  taskUtils,
  validationUtils,
  uiUtils
};