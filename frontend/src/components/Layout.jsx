import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FaHome, FaGlobe, FaUsers, FaMoneyBillWave, FaSignOutAlt, 
  FaBars, FaTimes, FaUserCircle, FaCog, FaMoon, FaSun 
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const { admin, logout, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: FaHome, label: 'Dashboard', roles: ['all'] },
    { path: '/sites', icon: FaGlobe, label: 'Websites', roles: ['all'] },
    { path: '/customers', icon: FaUsers, label: 'Customers', roles: ['super_admin'] },
    { path: '/payments', icon: FaMoneyBillWave, label: 'Payments', roles: ['all'] },
    { path: '/settings', icon: FaCog, label: 'Settings', roles: ['all'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes('all') || (isSuperAdmin() && item.roles.includes('super_admin'))
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed w-full z-30 top-0 transition-colors duration-200">
        <div className="px-3 py-2 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              {/* Mobile menu button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
              
              {/* Logo */}
              <Link to="/dashboard" className="flex ml-2 md:mr-24">
                <FaGlobe className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <span className="self-center text-lg font-semibold ml-2 whitespace-nowrap text-gray-900 dark:text-white">
                  WebsiteManager
                </span>
              </Link>
            </div>
            
            {/* User Menu */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDark ? <FaSun size={18} /> : <FaMoon size={18} />}
              </button>
              
              <div className="flex items-center gap-2 text-sm">
                <FaUserCircle className="h-6 w-6 text-gray-600 dark:text-gray-300" />
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{admin?.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{admin?.role === 'super_admin' ? 'Super Admin' : 'Customer Admin'}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-3 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  title="Logout"
                >
                  <FaSignOutAlt className="inline mr-1" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 w-56 h-screen pt-16 transition-all duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 lg:translate-x-0`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-1 font-medium">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center p-2 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
                    <span className="ml-3">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="p-3 lg:ml-56 mt-14">
        <div className="max-w-screen-2xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
