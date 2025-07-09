import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';
import { useAuth } from '../../App';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      logout();
      toast.success('Logged out successfully');
    } catch (error) {
      // Even if the API call fails, we should still logout locally
      logout();
      toast.success('Logged out successfully');
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed w-full top-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 lg:hidden"
            >
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex-shrink-0 ml-4 lg:ml-0">
              <h1 className="text-xl font-bold text-gray-900">Task Manager</h1>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">{user?.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;