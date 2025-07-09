import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { User, Lock, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuth } from '../App';
import { authAPI, apiHelpers } from '../services/api';
import { validationUtils } from '../utils/helpers';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const Profile = () => {
  const { user, updateUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordForm = useForm();
  const deleteForm = useForm();

  const handlePasswordUpdate = async (data) => {
    setLoading(true);
    
    try {
      await authAPI.updatePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
      
      toast.success('Password updated successfully');
      passwordForm.reset();
    } catch (error) {
      const errorMessage = apiHelpers.handleError(error);
      
      if (error.response?.status === 401) {
        passwordForm.setError('currentPassword', {
          type: 'manual',
          message: 'Current password is incorrect'
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAccountDelete = async (data) => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and will delete all your tasks.')) {
      return;
    }

    setLoading(true);
    
    try {
      await authAPI.deleteAccount({ password: data.password });
      toast.success('Account deleted successfully');
      logout();
    } catch (error) {
      const errorMessage = apiHelpers.handleError(error);
      
      if (error.response?.status === 401) {
        deleteForm.setError('password', {
          type: 'manual',
          message: 'Password is incorrect'
        });
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const newPassword = passwordForm.watch('newPassword', '');
  const passwordValidation = validationUtils.validatePassword(newPassword);

  const PasswordRequirement = ({ met, text }) => (
    <div className={`flex items-center space-x-2 text-xs ${met ? 'text-success-600' : 'text-gray-500'}`}>
      <div className={`w-2 h-2 rounded-full ${met ? 'bg-success-600' : 'bg-gray-300'}`} />
      <span>{text}</span>
    </div>
  );

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              </div>
              <div className="card-body space-y-6">
                {/* Profile Info */}
                <div className="flex items-center space-x-6">
                  <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="h-10 w-10 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{user?.email}</h3>
                    <p className="text-gray-600">Member since {new Date(user?.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {/* Account Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="mt-1 input bg-gray-50 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed at this time</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Account Type</label>
                    <input
                      type="text"
                      value="Standard User"
                      disabled
                      className="mt-1 input bg-gray-50 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Account Statistics</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">-</div>
                      <div className="text-sm text-gray-600">Total Tasks</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">-</div>
                      <div className="text-sm text-gray-600">Completed</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-gray-900">-</div>
                      <div className="text-sm text-gray-600">In Progress</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h2 className="text-lg font-semibold text-gray-900">Password & Security</h2>
              </div>
              <div className="card-body">
                <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Current Password</label>
                    <div className="relative mt-1">
                      <input
                        {...passwordForm.register('currentPassword', {
                          required: 'Current password is required'
                        })}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className={`input pr-10 ${passwordForm.formState.errors.currentPassword ? 'input-error' : ''}`}
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-danger-600">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">New Password</label>
                    <div className="relative mt-1">
                      <input
                        {...passwordForm.register('newPassword', {
                          required: 'New password is required',
                          validate: (value) => {
                            const validation = validationUtils.validatePassword(value);
                            return validation.isValid || validation.errors[0];
                          }
                        })}
                        type={showNewPassword ? 'text' : 'password'}
                        className={`input pr-10 ${passwordForm.formState.errors.newPassword ? 'input-error' : ''}`}
                        placeholder="Enter your new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-danger-600">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}

                    {/* Password Requirements */}
                    {newPassword && (
                      <div className="mt-3 space-y-1">
                        <PasswordRequirement 
                          met={newPassword.length >= 8} 
                          text="At least 8 characters" 
                        />
                        <PasswordRequirement 
                          met={/[a-z]/.test(newPassword)} 
                          text="One lowercase letter" 
                        />
                        <PasswordRequirement 
                          met={/[A-Z]/.test(newPassword)} 
                          text="One uppercase letter" 
                        />
                        <PasswordRequirement 
                          met={/\d/.test(newPassword)} 
                          text="One number" 
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                    <div className="relative mt-1">
                      <input
                        {...passwordForm.register('confirmPassword', {
                          required: 'Please confirm your new password',
                          validate: (value) => value === newPassword || 'Passwords do not match'
                        })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`input pr-10 ${passwordForm.formState.errors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirm your new password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400" />
                        )}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-danger-600">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !passwordValidation.isValid}
                    className="btn-primary"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Updating...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="card border-danger-200">
              <div className="card-header bg-danger-50">
                <h2 className="text-lg font-semibold text-danger-900">Danger Zone</h2>
                <p className="text-sm text-danger-700 mt-1">
                  These actions cannot be undone. Please be careful.
                </p>
              </div>
              <div className="card-body">
                <form onSubmit={deleteForm.handleSubmit(handleAccountDelete)} className="space-y-6">
                  <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
                    <h3 className="text-lg font-medium text-danger-900 mb-2">Delete Account</h3>
                    <p className="text-sm text-danger-700 mb-4">
                      Once you delete your account, there is no going back. This will permanently delete:
                    </p>
                    <ul className="text-sm text-danger-700 list-disc list-inside space-y-1">
                      <li>Your user account and profile</li>
                      <li>All your tasks and subtasks</li>
                      <li>All task dependencies and relationships</li>
                      <li>Your account statistics and history</li>
                    </ul>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Confirm with your password
                    </label>
                    <input
                      {...deleteForm.register('password', {
                        required: 'Password is required to delete account'
                      })}
                      type="password"
                      className={`mt-1 input ${deleteForm.formState.errors.password ? 'input-error' : ''}`}
                      placeholder="Enter your password to confirm deletion"
                    />
                    {deleteForm.formState.errors.password && (
                      <p className="mt-1 text-sm text-danger-600">
                        {deleteForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-danger"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" />
                        <span className="ml-2">Deleting...</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Account Permanently
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;