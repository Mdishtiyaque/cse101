import React, { useState } from 'react';
import { Plus, CheckCircle, Edit, Trash2, Calendar } from 'lucide-react';

import { tasksAPI } from '../../services/api';
import { taskUtils, dateUtils } from '../../utils/helpers';
import TaskForm from './TaskForm';
import LoadingSpinner from '../UI/LoadingSpinner';
import toast from 'react-hot-toast';

const SubtaskList = ({ task, onTaskUpdate }) => {
  const [showSubtaskForm, setShowSubtaskForm] = useState(false);
  const [editingSubtask, setEditingSubtask] = useState(null);
  const [loading, setLoading] = useState(false);

  const subtasks = task.subtasks || [];

  const handleCreateSubtask = async (subtaskData) => {
    setLoading(true);
    try {
      await tasksAPI.createSubtask(task.id, subtaskData);
      setShowSubtaskForm(false);
      await onTaskUpdate();
      toast.success('Subtask created successfully');
    } catch (error) {
      toast.error('Failed to create subtask');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSubtask = async (subtaskId, subtaskData) => {
    setLoading(true);
    try {
      await tasksAPI.updateTask(subtaskId, subtaskData);
      setEditingSubtask(null);
      await onTaskUpdate();
      toast.success('Subtask updated successfully');
    } catch (error) {
      toast.error('Failed to update subtask');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm('Are you sure you want to delete this subtask?')) {
      return;
    }

    setLoading(true);
    try {
      await tasksAPI.deleteTask(subtaskId);
      await onTaskUpdate();
      toast.success('Subtask deleted successfully');
    } catch (error) {
      toast.error('Failed to delete subtask');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (subtaskId, newStatus) => {
    try {
      await tasksAPI.updateTask(subtaskId, { status: newStatus });
      await onTaskUpdate();
      
      if (newStatus === 'Completed') {
        toast.success('Subtask marked as completed');
      }
    } catch (error) {
      toast.error('Failed to update subtask status');
    }
  };

  const completedSubtasks = subtasks.filter(subtask => subtask.status === 'Completed').length;
  const totalSubtasks = subtasks.length;
  const completionPercentage = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Subtasks</h2>
          <p className="text-sm text-gray-600">
            {completedSubtasks} of {totalSubtasks} completed ({completionPercentage}%)
          </p>
        </div>
        <button
          onClick={() => setShowSubtaskForm(true)}
          className="btn-primary btn-sm"
          disabled={loading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subtask
        </button>
      </div>

      {/* Progress Bar */}
      {totalSubtasks > 0 && (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-primary-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Subtasks List */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {!loading && subtasks.length > 0 && (
        <div className="space-y-4">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="card">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <button
                        onClick={() => handleStatusChange(
                          subtask.id, 
                          subtask.status === 'Completed' ? 'To Do' : 'Completed'
                        )}
                        className={`flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                          subtask.status === 'Completed'
                            ? 'bg-success-600 border-success-600 text-white'
                            : 'border-gray-300 hover:border-success-400'
                        }`}
                      >
                        {subtask.status === 'Completed' && (
                          <CheckCircle className="h-3 w-3" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-medium ${
                          subtask.status === 'Completed' 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-900'
                        }`}>
                          {subtask.title}
                        </h4>
                        {subtask.description && (
                          <p className={`text-sm mt-1 ${
                            subtask.status === 'Completed' 
                              ? 'text-gray-400' 
                              : 'text-gray-600'
                          }`}>
                            {subtask.description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Subtask meta */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500 ml-8">
                      <span className={`badge ${taskUtils.getStatusBadgeClass(subtask.status)}`}>
                        {subtask.status}
                      </span>
                      <span className={`badge ${taskUtils.getPriorityBadgeClass(subtask.priority)}`}>
                        {subtask.priority}
                      </span>
                      {subtask.due_date && (
                        <div className={`flex items-center space-x-1 ${dateUtils.getDateColorClass(subtask.due_date)}`}>
                          <Calendar className="h-3 w-3" />
                          <span>{dateUtils.formatDate(subtask.due_date)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => setEditingSubtask(subtask)}
                      className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      title="Edit subtask"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1 rounded-md text-gray-400 hover:text-danger-600 hover:bg-gray-100"
                      title="Delete subtask"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && subtasks.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-300 mb-4">
            <CheckCircle className="h-full w-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subtasks yet</h3>
          <p className="text-gray-500 mb-6">
            Break down this task into smaller, manageable subtasks
          </p>
          <button
            onClick={() => setShowSubtaskForm(true)}
            className="btn-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add First Subtask
          </button>
        </div>
      )}

      {/* Important note */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The parent task cannot be marked as completed until all subtasks are completed.
            </p>
          </div>
        </div>
      </div>

      {/* Subtask Form Modal */}
      {(showSubtaskForm || editingSubtask) && (
        <TaskForm
          task={editingSubtask ? { 
            ...editingSubtask, 
            parent_task_id: task.id 
          } : { 
            parent_task_id: task.id, 
            parentTaskId: task.id 
          }}
          onSubmit={editingSubtask ? 
            (data) => handleUpdateSubtask(editingSubtask.id, data) : 
            handleCreateSubtask
          }
          onCancel={() => {
            setShowSubtaskForm(false);
            setEditingSubtask(null);
          }}
        />
      )}
    </div>
  );
};

export default SubtaskList;