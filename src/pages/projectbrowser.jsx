import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Plus, Search, LayoutGrid, Clock, Folder,
  Settings, LogOut, Box, Menu, X
} from 'lucide-react';
import ProjectGrid from '../components/dashboard/ProjectGrid';
import NewProjectModal from '../components/dashboard/Newprojectmodal';
import { getSession, logout } from '../auth';

const PROJECTS_KEY = '3dcad_projects';

function loadProjects(userId) {
  try { return JSON.parse(localStorage.getItem(`${PROJECTS_KEY}_${userId}`)) || []; }
  catch { return []; }
}
function saveProjects(userId, projects) {
  localStorage.setItem(`${PROJECTS_KEY}_${userId}`, JSON.stringify(projects));
}

export default function ProjectBrowser() {
  const navigate = useNavigate();
  const session = getSession();

  const [projects, setProjects]     = useState([]);
  const [search, setSearch]         = useState('');
  const [view, setView]             = useState('all');   // 'all' | 'recent'
  const [modalOpen, setModalOpen]   = useState(false);
  const [sidebarOpen, setSidebar]   = useState(false);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    setProjects(loadProjects(session.id));
  }, []);

  /* ── helpers ── */
  const persist = (updated) => {
    setProjects(updated);
    saveProjects(session.id, updated);
  };

  const handleCreate = ({ name, template }) => {
    const p = { id: Date.now().toString(), name, template, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    const updated = [p, ...projects];
    persist(updated);
    navigate(`/cad/${p.id}`);
  };

  const handleDelete = (id) => persist(projects.filter(p => p.id !== id));

  const handleRename = (id, newName) => {
    persist(projects.map(p => p.id === id ? { ...p, name: newName, updatedAt: new Date().toISOString() } : p));
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── filtering ── */
  const now = Date.now();
  const filtered = projects
    .filter(p => {
      if (view === 'recent') return now - new Date(p.updatedAt || p.createdAt).getTime() < 7 * 24 * 60 * 60 * 1000;
      return true;
    })
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const initials = session ? `${session.firstName[0]}${session.lastName[0]}`.toUpperCase() : '?';

  /* ── sidebar content ── */
  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="h-14 flex items-center px-5 shrink-0" style={{ borderBottom: '1px solid rgba(99,179,237,0.08)' }}>
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}>
            <Box size={14} color="#fff" />
          </div>
          <span className="text-base font-extrabold text-white">3D<span style={{ color: '#63b3ed' }}>CAD</span></span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {[
          { id: 'all',    icon: <LayoutGrid size={16} />, label: 'All Projects' },
          { id: 'recent', icon: <Clock size={16} />,      label: 'Recent' },
        ].map(item => (
          <button key={item.id} onClick={() => { setView(item.id); setSidebar(false); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: view === item.id ? 'rgba(99,179,237,0.12)' : 'transparent',
              color: view === item.id ? '#63b3ed' : '#64748b',
              border: view === item.id ? '1px solid rgba(99,179,237,0.2)' : '1px solid transparent',
            }}>
            {item.icon} {item.label}
          </button>
        ))}

        <div className="pt-4 pb-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2" style={{ color: '#334155' }}>Workspace</p>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all text-left"
            style={{ color: '#64748b' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
            <Folder size={16} /> Shared with me
          </button>
        </div>
      </nav>

      {/* User + actions */}
      <div className="px-3 py-4 shrink-0" style={{ borderTop: '1px solid rgba(99,179,237,0.08)' }}>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg mb-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{ background: 'linear-gradient(135deg,#63b3ed,#9f7aea)' }}>
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{session?.firstName} {session?.lastName}</p>
            <p className="text-[10px] truncate" style={{ color: '#475569' }}>{session?.email}</p>
          </div>
        </div>
        <button onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: '#64748b' }}
          onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
          onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
          <Settings size={15} /> Settings
        </button>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all"
          style={{ color: '#64748b' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#fc8181'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; }}>
          <LogOut size={15} /> Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen font-sans overflow-hidden" style={{ background: '#060b16', color: '#e2e8f0' }}>

      {/* ── SIDEBAR desktop ── */}
      <aside className="hidden md:flex flex-col w-56 shrink-0"
        style={{ background: '#0a0f1e', borderRight: '1px solid rgba(99,179,237,0.08)' }}>
        <SidebarContent />
      </aside>

      {/* ── SIDEBAR mobile overlay ── */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebar(false)} />
          <aside className="relative z-10 flex flex-col w-56 shrink-0"
            style={{ background: '#0a0f1e', borderRight: '1px solid rgba(99,179,237,0.08)' }}>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Top bar */}
        <header className="h-14 flex items-center justify-between px-5 shrink-0"
          style={{ background: '#0a0f1e', borderBottom: '1px solid rgba(99,179,237,0.08)' }}>
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button className="md:hidden text-slate-400 hover:text-white transition-colors" onClick={() => setSidebar(true)}>
              <Menu size={20} />
            </button>
            <h1 className="text-base font-bold text-white">
              {view === 'all' ? 'All Projects' : 'Recent'}
            </h1>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(99,179,237,0.1)', color: '#63b3ed' }}>
              {filtered.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="pl-8 pr-3 py-1.5 rounded-lg text-xs outline-none transition-all placeholder:text-slate-600"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#e2e8f0', width: 200 }}
                onFocus={e => e.currentTarget.style.borderColor = 'rgba(99,179,237,0.4)'}
                onBlur={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'} />
            </div>

            {/* New Project */}
            <button onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-semibold text-sm text-white transition-all"
              style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              <Plus size={15} /> New Project
            </button>
          </div>
        </header>

        {/* Mobile search */}
        <div className="sm:hidden px-4 py-2" style={{ borderBottom: '1px solid rgba(99,179,237,0.06)' }}>
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#475569' }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search projects…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-xs outline-none"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#e2e8f0' }} />
          </div>
        </div>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-5">
          <ProjectGrid projects={filtered} onDelete={handleDelete} onRename={handleRename} />
        </main>
      </div>

      <NewProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreate={handleCreate} />
    </div>
  );
}
