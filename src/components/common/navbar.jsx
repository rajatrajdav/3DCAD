import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { logout, getSession } from '../../auth';

export default function Navbar({ title, showBack = false }) {
  const navigate = useNavigate();
  const session = getSession();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-12 flex items-center justify-between px-4 shrink-0"
      style={{ background: '#0d1117', borderBottom: '1px solid rgba(99,179,237,0.1)' }}>
      <div className="flex items-center gap-3">
        {showBack && (
          <button onClick={() => navigate('/projects')} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
        )}
        <Link to={session ? '/projects' : '/'} className="flex items-center gap-2 no-underline">
          <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}>
            <Box size={12} color="#fff" />
          </div>
          <span className="text-sm font-extrabold text-white">3D<span style={{ color: '#63b3ed' }}>CAD</span></span>
        </Link>
        {title && <span className="text-slate-500 text-sm">/ {title}</span>}
      </div>
      <div className="flex items-center gap-3">
        {session && <span className="text-xs text-slate-500 hidden sm:block">{session.firstName} {session.lastName}</span>}
        <button onClick={() => navigate('/settings')} className="text-slate-400 hover:text-white transition-colors"><Settings size={16} /></button>
        <button onClick={handleLogout} className="text-slate-400 hover:text-red-400 transition-colors"><LogOut size={16} /></button>
      </div>
    </header>
  );
}
