import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  CheckSquare, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  Plus,
  Calendar,
  ArrowRight
} from 'lucide-react';

import { tasksAPI } from '../services/api';
import { taskUtils, dateUtils } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await tasksAPI.getAllTasks();
      const tasksData = response.data.tasks;
      setTasks(tasksData);
      setStats(taskUtils.getTaskStats(tasksData));
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const recentTasks = tasks
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  const overdueTasks = tasks.filter(task => 
    task.due_date && dateUtils.isOverdue(task.due_date) && task.status !== 'Completed'
  );

  const dueTodayTasks = tasks.filter(task =>
    task.due_date && dateUtils.formatDate(task.due_date) === 'Today' && task.status !== 'Completed'
  );

  const statCards = [
    {
      title: 'Total Tasks',
      value: stats.total || 0,
      icon: CheckSquare,
      color: 'primary',
      description: 'All tasks'
    },
    {
      title: 'In Progress',
      value: stats.inProgress || 0,
      icon: Clock,
      color: 'warning',
      description: 'Active tasks'
    },
    {
      title: 'Completed',
      value: stats.completed || 0,
      icon: TrendingUp,
      color: 'success',
      description: 'Finished tasks'
    },
    {
      title: 'Overdue',
      value: overdueTasks.length,
      icon: AlertCircle,
      color: 'danger',
      description: 'Need attention'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your task overview.</p>
        </div>
        <Link to="/tasks" className="btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          New Task
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="card">
              <div className="card-body">
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                    <Icon className={`h-6 w-6 text-${stat.color}-600`} />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-xs text-gray-500">{stat.description}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Recent Tasks</h2>
              <Link to="/tasks" className="text-primary-600 hover:text-primary-500 text-sm font-medium">
                View all
                <ArrowRight className="h-4 w-4 ml-1 inline" />
              </Link>
            </div>
          </div>
          <div className="card-body">
            {recentTasks.length > 0 ? (
              <div className="space-y-3">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <Link 
                        to={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600"
                      >
                        {task.title}
                      </Link>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`badge ${taskUtils.getStatusBadgeClass(task.status)}`}>
                          {task.status}
                        </span>
                        <span className={`badge ${taskUtils.getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    {task.due_date && (
                      <div className="text-right">
                        <div className={`text-xs ${dateUtils.getDateColorClass(task.due_date)}`}>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {dateUtils.formatDate(task.due_date)}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No tasks yet. Create your first task!</p>
                <Link to="/tasks" className="btn-primary btn-sm mt-3">
                  Create Task
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Due Today & Overdue */}
        <div className="space-y-6">
          {/* Due Today */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Due Today</h2>
            </div>
            <div className="card-body">
              {dueTodayTasks.length > 0 ? (
                <div className="space-y-2">
                  {dueTodayTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-warning-50 rounded-lg">
                      <Link 
                        to={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 flex-1"
                      >
                        {task.title}
                      </Link>
                      <span className={`badge ${taskUtils.getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                  {dueTodayTasks.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{dueTodayTasks.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No tasks due today</p>
              )}
            </div>
          </div>

          {/* Overdue Tasks */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Overdue Tasks</h2>
            </div>
            <div className="card-body">
              {overdueTasks.length > 0 ? (
                <div className="space-y-2">
                  {overdueTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-danger-50 rounded-lg">
                      <Link 
                        to={`/tasks/${task.id}`}
                        className="text-sm font-medium text-gray-900 hover:text-primary-600 flex-1"
                      >
                        {task.title}
                      </Link>
                      <div className="text-right">
                        <span className={`badge ${taskUtils.getPriorityBadgeClass(task.priority)}`}>
                          {task.priority}
                        </span>
                        <div className="text-xs text-danger-600 mt-1">
                          {dateUtils.getRelativeTime(task.due_date)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {overdueTasks.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{overdueTasks.length - 3} more
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No overdue tasks</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;