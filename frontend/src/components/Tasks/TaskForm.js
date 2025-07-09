import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Save, Calendar, FileText, Flag, Target } from 'lucide-react';

import { tasksAPI } from '../../services/api';
import { dateUtils, validationUtils } from '../../utils/helpers';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const TaskForm = ({ task, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [availableParentTasks, setAvailableParentTasks] = useState([]);
  const isEditing = !!task;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm({
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      dueDate: task?.due_date ? dateUtils.formatForInput(task.due_date) : '',
      priority: task?.priority || 'Medium',
      status: task?.status || 'To Do',
      parentTaskId: task?.parent_task_id || ''
    }
  });

  useEffect(() => {
    fetchAvailableParentTasks();
  }, []);

  const fetchAvailableParentTasks = async () => {
    try {
      const response = await tasksAPI.getAllTasks();
      // Filter out current task and its subtasks to prevent circular references
      const filteredTasks = response.data.tasks.filter(t => 
        t.id !== task?.id && 
        t.parent_task_id === null && // Only show parent tasks (not subtasks)
        t.status !== 'Completed' // Don't allow adding to completed tasks
      );
      setAvailableParentTasks(filteredTasks);
    } catch (error) {
      console.error('Failed to fetch parent tasks:', error);
    }
  };

  const handleFormSubmit = async (data) => {
    setLoading(true);

    try {
      // Format the data for API
      const formattedData = {
        title: data.title.trim(),
        description: data.description?.trim() || null,
        dueDate: data.dueDate || null,
        priority: data.priority,
        status: data.status,
        parentTaskId: data.parentTaskId || null
      };

      await onSubmit(formattedData);
    } catch (error) {
      toast.error('Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: 'Low', label: 'Low Priority', color: 'text-success-600' },
    { value: 'Medium', label: 'Medium Priority', color: 'text-warning-600' },
    { value: 'High', label: 'High Priority', color: 'text-danger-600' }
  ];

  const statusOptions = [
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Blocked', label: 'Blocked' }
  ];

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="flex items-center justify-center min-h-full p-4">
          <div className="modal-content w-full max-w-2xl">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEditing ? 'Edit Task' : 'Create New Task'}
                </h2>
                <button
                  onClick={onCancel}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(handleFormSubmit)} className="px-6 py-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 inline mr-2" />
                  Task Title *
                </label>
                <input
                  {...register('title', {
                    required: 'Task title is required',
                    maxLength: {
                      value: 255,
                      message: 'Title must be less than 255 characters'
                    }
                  })}
                  type="text"
                  className={`input ${errors.title ? 'input-error' : ''}`}
                  placeholder="Enter task title..."
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-danger-600">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description', {
                    maxLength: {
                      value: 2000,
                      message: 'Description must be less than 2000 characters'
                    }
                  })}
                  rows={4}
                  className={`input ${errors.description ? 'input-error' : ''}`}
                  placeholder="Enter task description..."
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-danger-600">{errors.description.message}</p>
                )}
              </div>

              {/* Grid for smaller fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="h-4 w-4 inline mr-2" />
                    Due Date
                  </label>
                  <input
                    {...register('dueDate')}
                    type="date"
                    className="input"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Flag className="h-4 w-4 inline mr-2" />
                    Priority
                  </label>
                  <select
                    {...register('priority')}
                    className="input"
                  >
                    {priorityOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Target className="h-4 w-4 inline mr-2" />
                    Status
                  </label>
                  <select
                    {...register('status')}
                    className="input"
                  >
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Parent Task */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Task
                  </label>
                  <select
                    {...register('parentTaskId')}
                    className="input"
                  >
                    <option value="">No parent task</option>
                    {availableParentTasks.map(parentTask => (
                      <option key={parentTask.id} value={parentTask.id}>
                        {parentTask.title}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a parent task to create this as a subtask
                  </p>
                </div>
              </div>

              {/* Info message */}
              {!isEditing && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <div className="ml-3">
                      <p className="text-sm text-blue-800">
                        <strong>Tip:</strong> You can manage task dependencies and add more subtasks after creating the task.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onCancel}
                  className="btn-outline"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" />
                      <span className="ml-2">
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      {isEditing ? 'Update Task' : 'Create Task'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskForm;