import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  CheckSquare, 
  User, 
  BarChart3,
  X
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose }) => {
  const navItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home
    },
    {
      name: 'Tasks',
      href: '/tasks',
      icon: CheckSquare
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: BarChart3
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User
    }
  ];

  const sidebarClasses = `
    fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    lg:translate-x-0 lg:static lg:inset-0
  `;

  return (
    <aside className={sidebarClasses}>
      {/* Sidebar header */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        <button
          onClick={onClose}
          className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.name}>
                <NavLink
                  to={item.href}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-200 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-500'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 text-center">
          Task Management v1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;