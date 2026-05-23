import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/common/navbar';
import { getSession, logout } from '../auth';
import { User, Palette, Trash2, LogOut } from 'lucide-react';

export default function Setting() {
  const navigate = useNavigate();
  const session = getSession();
  const [theme, setTheme] = useState('dark');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!session) { navigate('/login', { replace: true }); return null; }

  const handleDeleteAccount = () => {
    localStorage.removeItem('3dcad_session');
    localStorage.removeItem(`3dcad_projects_${session.id}`);
    const users = JSON.parse(localStorage.getItem('3dcad_users') || '[]');
    localStorage.setItem('3dcad_users', JSON.stringify(users.filter(u => u.id !== session.id)));
    navigate('/register');
  };

  const Section = ({ icon, title, children }) => (
    <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1117', border: '1px solid rgba(99,179,237,0.08)' }}>
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid rgba(99,179,237,0.06)' }}>
        <span style={{ color: '#63b3ed' }}>{icon}</span>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );

  const Field = ({ label, value }) => (
    <div className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-slate-300">{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen font-sans" style={{ background: '#060b16', color: '#e2e8f0' }}>
      <Navbar />
      <div className="max-w-2xl mx-auto w-full px-6 py-10 space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account and preferences</p>
        </div>

        <Section icon={<User size={16} />} title="Account">
          <Field label="First name"  value={session.firstName} />
          <Field label="Last name"   value={session.lastName} />
          <Field label="Email"       value={session.email} />
          <Field label="Preference"  value={session.preference || '—'} />
        </Section>

        <Section icon={<Palette size={16} />} title="Appearance">
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Theme</span>
            <div className="flex gap-2">
              {['dark', 'darker'].map(t => (
                <button key={t} onClick={() => setTheme(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
                  style={{
                    background: theme === t ? 'rgba(99,179,237,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${theme === t ? 'rgba(99,179,237,0.4)' : 'rgba(255,255,255,0.07)'}`,
                    color: theme === t ? '#63b3ed' : '#64748b',
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Section>

        <Section icon={<Trash2 size={16} />} title="Danger Zone">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Delete account</p>
              <p className="text-xs text-slate-500 mt-0.5">Permanently removes your account and all projects</p>
            </div>
            {!confirmDelete
              ? <button onClick={() => setConfirmDelete(true)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-red-400 transition-all"
                  style={{ border: '1px solid rgba(245,101,101,0.3)', background: 'rgba(245,101,101,0.05)' }}>
                  Delete
                </button>
              : <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 transition-all"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>Cancel</button>
                  <button onClick={handleDeleteAccount}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-red-600 hover:bg-red-500 transition-all">
                    Confirm Delete
                  </button>
                </div>
            }
          </div>
        </Section>

        <button onClick={() => { logout(); navigate('/login'); }}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-red-400 transition-colors">
          <LogOut size={15} /> Sign out
        </button>
      </div>
    </div>
  );
}
