import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const { dark, toggle } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm px-4 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1
          className="text-xl font-bold text-blue-600 dark:text-white cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          {title || 'Task Tracker'}
        </h1>
        <div className="flex items-center gap-4">
          <button
            onClick={toggle}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white px-2 py-1 rounded-md text-lg transition-colors"
            title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <span className="text-sm text-gray-600 dark:text-gray-300">Hello, {user?.name}</span>
          <button
            onClick={handleLogout}
            className="bg-red-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
