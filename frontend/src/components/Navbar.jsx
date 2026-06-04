import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm px-4 py-3">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1
          className="text-xl font-bold text-blue-600 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          {title || 'Task Tracker'}
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hello, {user?.name}</span>
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
