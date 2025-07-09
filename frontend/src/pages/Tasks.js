import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown,
  Calendar,
  Clock,
  User,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';

import { tasksAPI } from '../services/api';
import { taskUtils, dateUtils, uiUtils } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TaskCard from '../components/Tasks/TaskCard';
import TaskForm from '../components/Tasks/TaskForm';
import FilterDropdown from '../components/UI/FilterDropdown';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });
  const [sortBy, setSortBy] = useState('dueDate');
  const [view, setView] = useState('list'); // 'list' or 'grid'

  const debouncedSearch = uiUtils.debounce((searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm }));
  }, 300);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAllTasks(filters);
      setTasks(response.data.tasks);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      const response = await tasksAPI.createTask(taskData);
      setTasks([response.data.task, ...tasks]);
      setShowTaskForm(false);
      toast.success('Task created successfully');
    } catch (error) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateTask = async (taskId, taskData) => {
    try {
      const response = await tasksAPI.updateTask(taskId, taskData);
      setTasks(tasks.map(task => 
        task.id === taskId ? response.data.task : task
      ));
      setEditingTask(null);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await tasksAPI.deleteTask(taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await handleUpdateTask(taskId, { status: newStatus });
    } catch (error) {
      toast.error('Failed to update task status');
    }
  };

  // Apply filters and sorting
  const filteredTasks = taskUtils.filterTasks(tasks, filters);
  const sortedTasks = taskUtils.sortTasks(filteredTasks, sortBy);

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Blocked', label: 'Blocked' }
  ];

  const priorityOptions = [
    { value: '', label: 'All Priority' },
    { value: 'High', label: 'High Priority' },
    { value: 'Medium', label: 'Medium Priority' },
    { value: 'Low', label: 'Low Priority' }
  ];

  const sortOptions = [
    { value: 'dueDate', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'created', label: 'Created Date' },
    { value: 'updated', label: 'Last Updated' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600 mt-1">
            {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <button
          onClick={() => setShowTaskForm(true)}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </button>
      </div>

      {/* Filters and Search */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="input pl-10"
                  onChange={(e) => debouncedSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2">
              <FilterDropdown
                label="Status"
                value={filters.status}
                options={statusOptions}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              />
              
              <FilterDropdown
                label="Priority"
                value={filters.priority}
                options={priorityOptions}
                onChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
              />
              
              <FilterDropdown
                label="Sort by"
                value={sortBy}
                options={sortOptions}
                onChange={setSortBy}
              />
            </div>

            {/* View Toggle */}
            <div className="flex border border-gray-300 rounded-lg">
              <button
                onClick={() => setView('list')}
                className={`px-3 py-2 text-sm font-medium rounded-l-lg ${
                  view === 'list' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                List
              </button>
              <button
                onClick={() => setView('grid')}
                className={`px-3 py-2 text-sm font-medium rounded-r-lg ${
                  view === 'grid' 
                    ? 'bg-primary-100 text-primary-700' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Grid
              </button>
            </div>
          </div>

          {/* Active Filters */}
          {(filters.status || filters.priority || filters.search) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {filters.status && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Status: {filters.status}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.priority && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Priority: {filters.priority}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, priority: '' }))}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                  Search: {filters.search}
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                    className="ml-2 text-primary-600 hover:text-primary-800"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={() => setFilters({ status: '', priority: '', search: '' })}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task List/Grid */}
      {sortedTasks.length > 0 ? (
        <div className={
          view === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {sortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              view={view}
              onEdit={setEditingTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <Clock className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500 mb-6">
            {Object.values(filters).some(f => f) 
              ? 'Try adjusting your filters or search terms'
              : 'Get started by creating your first task'
            }
          </p>
          {!Object.values(filters).some(f => f) && (
            <button
              onClick={() => setShowTaskForm(true)}
              className="btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </button>
          )}
        </div>
      )}

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? 
            (data) => handleUpdateTask(editingTask.id, data) : 
            handleCreateTask
          }
          onCancel={() => {
            setShowTaskForm(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
};

export default Tasks;