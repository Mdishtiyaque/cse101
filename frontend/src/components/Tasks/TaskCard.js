import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CheckCircle,
  User,
  ArrowRight,
  Link as LinkIcon
} from 'lucide-react';

import { taskUtils, dateUtils } from '../../utils/helpers';

const TaskCard = ({ task, view = 'list', onEdit, onDelete, onStatusChange }) => {
  const [showMenu, setShowMenu] = useState(false);

  const statusOptions = [
    { value: 'To Do', label: 'To Do' },
    { value: 'In Progress', label: 'In Progress' },
    { value: 'Completed', label: 'Completed' },
    { value: 'Blocked', label: 'Blocked' }
  ];

  const handleStatusChange = (newStatus) => {
    onStatusChange(task.id, newStatus);
    setShowMenu(false);
  };

  const completionPercentage = taskUtils.getCompletionPercentage(task);

  // Grid view
  if (view === 'grid') {
    return (
      <div className="card animate-fade-in">
        <div className="card-body">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className={`badge ${taskUtils.getStatusBadgeClass(task.status)}`}>
                {task.status}
              </span>
              <span className={`badge ${taskUtils.getPriorityBadgeClass(task.priority)}`}>
                {task.priority}
              </span>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-32">
                  <button
                    onClick={() => { onEdit(task); setShowMenu(false); }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    className="flex items-center w-full px-3 py-2 text-sm text-danger-600 hover:bg-gray-100"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Title */}
          <Link 
            to={`/tasks/${task.id}`}
            className="block mb-3"
          >
            <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600 line-clamp-2">
              {task.title}
            </h3>
          </Link>

          {/* Description */}
          {task.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {task.description}
            </p>
          )}

          {/* Progress Bar (if has subtasks) */}
          {task.subtask_count > 0 && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div 
                  className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              {task.due_date && (
                <div className={`flex items-center space-x-1 ${dateUtils.getDateColorClass(task.due_date)}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{dateUtils.formatDate(task.due_date)}</span>
                </div>
              )}
              {task.subtask_count > 0 && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{task.subtask_count} subtasks</span>
                </div>
              )}
              {task.dependency_count > 0 && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="h-3 w-3" />
                  <span>{task.dependency_count} deps</span>
                </div>
              )}
            </div>
            <div className="text-gray-400">
              {dateUtils.getRelativeTime(task.updated_at)}
            </div>
          </div>

          {/* Status Change */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-xs input py-1"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="card animate-fade-in">
      <div className="card-body">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <Link 
                to={`/tasks/${task.id}`}
                className="flex-1 min-w-0"
              >
                <h3 className="text-lg font-medium text-gray-900 hover:text-primary-600 truncate">
                  {task.title}
                </h3>
              </Link>
              <div className="flex items-center space-x-2">
                <span className={`badge ${taskUtils.getStatusBadgeClass(task.status)}`}>
                  {task.status}
                </span>
                <span className={`badge ${taskUtils.getPriorityBadgeClass(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                {task.description}
              </p>
            )}

            {/* Meta information */}
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              {task.due_date && (
                <div className={`flex items-center space-x-1 ${dateUtils.getDateColorClass(task.due_date)}`}>
                  <Calendar className="h-3 w-3" />
                  <span>{dateUtils.formatDate(task.due_date)}</span>
                </div>
              )}
              {task.subtask_count > 0 && (
                <div className="flex items-center space-x-1">
                  <User className="h-3 w-3" />
                  <span>{task.subtask_count} subtasks</span>
                </div>
              )}
              {task.dependency_count > 0 && (
                <div className="flex items-center space-x-1">
                  <LinkIcon className="h-3 w-3" />
                  <span>{task.dependency_count} dependencies</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>Updated {dateUtils.getRelativeTime(task.updated_at)}</span>
              </div>
            </div>

            {/* Progress Bar (if has subtasks) */}
            {task.subtask_count > 0 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress: {completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div 
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 ml-4">
            {/* Status dropdown */}
            <select
              value={task.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="text-sm input py-1 w-32"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {/* Actions */}
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              {showMenu && (
                <div className="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10 w-32">
                  <Link
                    to={`/tasks/${task.id}`}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowMenu(false)}
                  >
                    <ArrowRight className="h-3 w-3 mr-2" />
                    View
                  </Link>
                  <button
                    onClick={() => { onEdit(task); setShowMenu(false); }}
                    className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Edit className="h-3 w-3 mr-2" />
                    Edit
                  </button>
                  <button
                    onClick={() => { onDelete(task.id); setShowMenu(false); }}
                    className="flex items-center w-full px-3 py-2 text-sm text-danger-600 hover:bg-gray-100"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;