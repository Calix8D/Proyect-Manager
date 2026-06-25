import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/dashboard" className="text-xl font-bold text-indigo-600">
        ProjectManager
      </Link>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{user?.name}</span>
        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
          {user?.role}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
