import React, { useState, useEffect } from 'react';
import { Plus, Link as LinkIcon, X, AlertTriangle, CheckCircle } from 'lucide-react';

import { tasksAPI } from '../../services/api';
import { taskUtils, dateUtils } from '../../utils/helpers';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const DependencyManager = ({ task, onTaskUpdate }) => {
  const [availableTasks, setAvailableTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(false);

  const dependencies = task.dependencies || [];
  const dependents = task.dependents || [];

  useEffect(() => {
    fetchAvailableTasks();
  }, [task.id]);

  const fetchAvailableTasks = async () => {
    try {
      const response = await tasksAPI.getAllTasks();
      // Filter out current task, its subtasks, and already dependent tasks
      const existingDepIds = dependencies.map(dep => dep.id);
      const filteredTasks = response.data.tasks.filter(t => 
        t.id !== task.id && 
        t.parent_task_id !== task.id && // Not a subtask
        !existingDepIds.includes(t.id) && // Not already a dependency
        t.status !== 'Completed' // Don't depend on completed tasks
      );
      setAvailableTasks(filteredTasks);
    } catch (error) {
      console.error('Failed to fetch available tasks:', error);
    }
  };

  const handleAddDependency = async () => {
    if (!selectedTaskId) return;

    setValidating(true);
    try {
      // First validate for circular dependencies
      const validation = await tasksAPI.validateDependencies({
        taskId: task.id,
        dependsOnTaskId: parseInt(selectedTaskId)
      });

      if (validation.data.hasCircularDependency) {
        toast.error('Adding this dependency would create a circular dependency');
        return;
      }

      setLoading(true);
      await tasksAPI.addDependency(task.id, { dependsOnTaskId: parseInt(selectedTaskId) });
      setSelectedTaskId('');
      await onTaskUpdate();
      await fetchAvailableTasks();
      toast.success('Dependency added successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add dependency');
    } finally {
      setLoading(false);
      setValidating(false);
    }
  };

  const handleRemoveDependency = async (dependencyId) => {
    if (!window.confirm('Are you sure you want to remove this dependency?')) {
      return;
    }

    setLoading(true);
    try {
      await tasksAPI.removeDependency(task.id, dependencyId);
      await onTaskUpdate();
      await fetchAvailableTasks();
      toast.success('Dependency removed successfully');
    } catch (error) {
      toast.error('Failed to remove dependency');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Dependencies</h2>
        <p className="text-sm text-gray-600">
          Manage what this task depends on and what depends on it
        </p>
      </div>

      {/* Add Dependency */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-md font-semibold text-gray-900">Add Dependency</h3>
        </div>
        <div className="card-body">
          <div className="flex space-x-3">
            <div className="flex-1">
              <select
                value={selectedTaskId}
                onChange={(e) => setSelectedTaskId(e.target.value)}
                className="input"
                disabled={loading || validating}
              >
                <option value="">Select a task this depends on...</option>
                {availableTasks.map(availableTask => (
                  <option key={availableTask.id} value={availableTask.id}>
                    {availableTask.title} ({availableTask.status})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleAddDependency}
              disabled={!selectedTaskId || loading || validating}
              className="btn-primary"
            >
              {validating ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Validating...</span>
                </>
              ) : loading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">Adding...</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            This task will be blocked until the selected task is completed
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Current Dependencies */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-900">This task depends on</h3>
              <span className="badge badge-primary">{dependencies.length}</span>
            </div>
          </div>
          <div className="card-body">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            )}

            {!loading && dependencies.length > 0 && (
              <div className="space-y-3">
                {dependencies.map((dependency) => (
                  <div key={dependency.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {dependency.title}
                        </h4>
                        <span className={`badge ${taskUtils.getStatusBadgeClass(dependency.status)}`}>
                          {dependency.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className={`badge ${taskUtils.getPriorityBadgeClass(dependency.priority)}`}>
                          {dependency.priority}
                        </span>
                        {dependency.due_date && (
                          <span className={dateUtils.getDateColorClass(dependency.due_date)}>
                            Due {dateUtils.formatDate(dependency.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {dependency.status === 'Completed' ? (
                        <CheckCircle className="h-4 w-4 text-success-600" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning-600" />
                      )}
                      <button
                        onClick={() => handleRemoveDependency(dependency.id)}
                        className="p-1 rounded-md text-gray-400 hover:text-danger-600 hover:bg-gray-100"
                        title="Remove dependency"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loading && dependencies.length === 0 && (
              <div className="text-center py-6">
                <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No dependencies</p>
                <p className="text-gray-400 text-xs">This task can start immediately</p>
              </div>
            )}
          </div>
        </div>

        {/* Dependent Tasks */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="text-md font-semibold text-gray-900">Tasks depending on this</h3>
              <span className="badge badge-primary">{dependents.length}</span>
            </div>
          </div>
          <div className="card-body">
            {dependents.length > 0 && (
              <div className="space-y-3">
                {dependents.map((dependent) => (
                  <div key={dependent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {dependent.title}
                        </h4>
                        <span className={`badge ${taskUtils.getStatusBadgeClass(dependent.status)}`}>
                          {dependent.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        <span className={`badge ${taskUtils.getPriorityBadgeClass(dependent.priority)}`}>
                          {dependent.priority}
                        </span>
                        {dependent.due_date && (
                          <span className={dateUtils.getDateColorClass(dependent.due_date)}>
                            Due {dateUtils.formatDate(dependent.due_date)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center">
                      {task.status === 'Completed' ? (
                        <CheckCircle className="h-4 w-4 text-success-600" title="This task is completed" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning-600" title="Waiting for this task" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {dependents.length === 0 && (
              <div className="text-center py-6">
                <LinkIcon className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No dependent tasks</p>
                <p className="text-gray-400 text-xs">No other tasks are waiting for this one</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Circular Dependency Warning */}
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-warning-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-warning-800">Circular Dependencies</h4>
              <p className="text-sm text-warning-700 mt-1">
                The system automatically prevents circular dependencies (A → B → C → A) which would create infinite loops.
              </p>
            </div>
          </div>
        </div>

        {/* Smart Status Updates */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Smart Updates</h4>
              <p className="text-sm text-blue-700 mt-1">
                When dependencies are completed, blocked tasks automatically become available to work on.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DependencyManager;