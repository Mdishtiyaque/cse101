import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Plus, 
  Calendar,
  Clock,
  User,
  Link as LinkIcon,
  ChevronRight,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

import { tasksAPI } from '../services/api';
import { taskUtils, dateUtils } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import TaskForm from '../components/Tasks/TaskForm';
import SubtaskList from '../components/Tasks/SubtaskList';
import DependencyManager from '../components/Tasks/DependencyManager';
import toast from 'react-hot-toast';

const TaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditForm, setShowEditForm] = useState(false);
  const [activeTab, setActiveTab] = useState('details');

  useEffect(() => {
    fetchTask();
  }, [id]);

  const fetchTask = async () => {
    try {
      const response = await tasksAPI.getTaskById(id);
      setTask(response.data.task);
    } catch (error) {
      toast.error('Failed to fetch task details');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      const response = await tasksAPI.updateTask(id, taskData);
      setTask({ ...task, ...response.data.task });
      setShowEditForm(false);
      toast.success('Task updated successfully');
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const handleDeleteTask = async () => {
    if (!window.confirm('Are you sure you want to delete this task? This will also delete all subtasks.')) {
      return;
    }

    try {
      await tasksAPI.deleteTask(id);
      toast.success('Task deleted successfully');
      navigate('/tasks');
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleMarkCompleted = async () => {
    try {
      await tasksAPI.markAsCompleted(id);
      await fetchTask(); // Refresh to get updated data
      toast.success('Task marked as completed');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to complete task');
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await handleUpdateTask({ status: newStatus });
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Task not found</h2>
        <Link to="/tasks" className="btn-primary mt-4">
          Back to Tasks
        </Link>
      </div>
    );
  }

  const canComplete = taskUtils.canCompleteTask(task);
  const completionPercentage = taskUtils.getCompletionPercentage(task);

  const tabs = [
    { id: 'details', label: 'Details', count: null },
    { id: 'subtasks', label: 'Subtasks', count: task.subtasks?.length || 0 },
    { id: 'dependencies', label: 'Dependencies', count: task.dependencies?.length || 0 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/tasks')}
            className="btn-outline btn-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{task.title}</h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`badge ${taskUtils.getStatusBadgeClass(task.status)}`}>
                {task.status}
              </span>
              <span className={`badge ${taskUtils.getPriorityBadgeClass(task.priority)}`}>
                {task.priority}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {task.status !== 'Completed' && (
            <button
              onClick={handleMarkCompleted}
              disabled={!canComplete}
              className={`btn-success btn-sm ${!canComplete ? 'opacity-50 cursor-not-allowed' : ''}`}
              title={!canComplete ? 'Complete all subtasks first' : 'Mark as completed'}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Complete
            </button>
          )}
          <button
            onClick={() => setShowEditForm(true)}
            className="btn-outline btn-sm"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button
            onClick={handleDeleteTask}
            className="btn-danger btn-sm"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Progress Bar (if has subtasks) */}
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900">Progress</h3>
              <span className="text-sm text-gray-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs ${
                  activeTab === tab.id 
                    ? 'bg-primary-100 text-primary-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Task Details</h2>
              </div>
              <div className="card-body space-y-6">
                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Description</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {task.description ? (
                      <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
                    ) : (
                      <p className="text-gray-500 italic">No description provided</p>
                    )}
                  </div>
                </div>

                {/* Parent Task */}
                {task.parent_title && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Parent Task</h3>
                    <div className="flex items-center space-x-2">
                      <LinkIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-primary-600 hover:text-primary-800">
                        {task.parent_title}
                      </span>
                    </div>
                  </div>
                )}

                {/* Dependencies Warning */}
                {task.dependencies && task.dependencies.length > 0 && (
                  <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 mr-3" />
                      <div>
                        <h4 className="text-sm font-medium text-warning-800">Dependencies</h4>
                        <p className="text-sm text-warning-700 mt-1">
                          This task depends on {task.dependencies.length} other task(s). 
                          Complete those first to unlock this task.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Information</h2>
              </div>
              <div className="card-body space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-900">Status</label>
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="mt-1 input"
                  >
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900">Priority</label>
                  <p className="mt-1 text-sm text-gray-600">{task.priority}</p>
                </div>

                {task.due_date && (
                  <div>
                    <label className="text-sm font-medium text-gray-900">Due Date</label>
                    <div className={`mt-1 text-sm ${dateUtils.getDateColorClass(task.due_date)}`}>
                      <Calendar className="h-4 w-4 inline mr-1" />
                      {dateUtils.formatDate(task.due_date)}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-900">Created</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {dateUtils.formatDate(task.created_at)}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-900">Last Updated</label>
                  <p className="mt-1 text-sm text-gray-600">
                    {dateUtils.getRelativeTime(task.updated_at)}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="card-body space-y-2">
                <button
                  onClick={() => setActiveTab('subtasks')}
                  className="w-full btn-outline btn-sm justify-between"
                >
                  <span>Manage Subtasks</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setActiveTab('dependencies')}
                  className="w-full btn-outline btn-sm justify-between"
                >
                  <span>Manage Dependencies</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subtasks' && (
        <SubtaskList 
          task={task}
          onTaskUpdate={fetchTask}
        />
      )}

      {activeTab === 'dependencies' && (
        <DependencyManager 
          task={task}
          onTaskUpdate={fetchTask}
        />
      )}

      {/* Edit Form Modal */}
      {showEditForm && (
        <TaskForm
          task={task}
          onSubmit={handleUpdateTask}
          onCancel={() => setShowEditForm(false)}
        />
      )}
    </div>
  );
};

export default TaskDetail;