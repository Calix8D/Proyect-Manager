import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-[#0b0e14] text-slate-200">
      <Sidebar />

      {/* Header móvil (sidebar oculto en pantallas pequeñas) */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-[#0e131c]/90 backdrop-blur border-b border-white/[0.06]">
        <span className="font-bold text-white">Proyecta</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">{user?.name}</span>
          <button onClick={handleLogout} className="text-xs text-slate-400 hover:text-red-300">Salir</button>
        </div>
      </header>

      <div className="md:pl-60">
        <main className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
