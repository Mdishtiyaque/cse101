import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status >= 500) {
      toast.error('Server error. Please try again later.');
    } else {
      // Don't show toast for validation errors (400) as they're handled in forms
      if (error.response?.status !== 400) {
        toast.error(message);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/password', data),
  deleteAccount: (data) => api.delete('/auth/account', { data }),
};

// Tasks API
export const tasksAPI = {
  // Core task operations
  getAllTasks: (params) => api.get('/tasks', { params }),
  getTaskById: (id) => api.get(`/tasks/${id}`),
  createTask: (data) => api.post('/tasks', data),
  updateTask: (id, data) => api.put(`/tasks/${id}`, data),
  deleteTask: (id) => api.delete(`/tasks/${id}`),
  
  // Tree view
  getTaskTree: () => api.get('/tasks/tree'),
  
  // Mark as completed
  markAsCompleted: (id) => api.patch(`/tasks/${id}/complete`),
  
  // Subtasks
  createSubtask: (parentId, data) => api.post(`/tasks/${parentId}/subtasks`, data),
  getSubtasks: (parentId) => api.get(`/tasks/${parentId}/subtasks`),
  
  // Dependencies (Challenge Feature)
  addDependency: (taskId, data) => api.post(`/tasks/${taskId}/dependencies`, data),
  removeDependency: (taskId, depId) => api.delete(`/tasks/${taskId}/dependencies/${depId}`),
  getDependencies: (taskId) => api.get(`/tasks/${taskId}/dependencies`),
  getDependents: (taskId) => api.get(`/tasks/${taskId}/dependents`),
  
  // Validation
  validateDependencies: (data) => api.post('/tasks/validate-dependencies', data),
};

// Helper functions
export const apiHelpers = {
  // Handle API errors and extract error messages
  handleError: (error) => {
    if (error.response?.data?.details) {
      // Validation errors
      return error.response.data.details.map(detail => detail.msg).join(', ');
    }
    return error.response?.data?.message || error.message || 'An error occurred';
  },
  
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },
  
  // Get current user from localStorage
  getCurrentUser: () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  },
  
  // Set authentication data
  setAuth: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  },
  
  // Clear authentication data
  clearAuth: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  // Format date for API
  formatDate: (date) => {
    if (!date) return null;
    if (typeof date === 'string') return date;
    return date.toISOString().split('T')[0];
  },
  
  // Parse date from API
  parseDate: (dateString) => {
    if (!dateString) return null;
    return new Date(dateString);
  },
};

export default api;