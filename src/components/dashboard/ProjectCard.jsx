import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit2, Eye, Trash2, MoreVertical, Box, Pencil, Check, X } from 'lucide-react';

const COLORS = ['#63b3ed', '#9f7aea', '#68d391', '#f6ad55', '#fc8181', '#f687b3'];

export default function ProjectCard({ project, onDelete, onRename }) {
  const navigate = useNavigate();
  const [menu, setMenu]       = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [nameVal, setNameVal]   = useState(project.name);
  const menuRef  = useRef(null);
  const inputRef = useRef(null);

  const color = COLORS[parseInt(project.id, 10) % COLORS.length] || COLORS[0];

  // Close menu on outside click
  useEffect(() => {
    if (!menu) return;
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenu(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menu]);

  // Focus input when rename starts
  useEffect(() => {
    if (renaming) inputRef.current?.focus();
  }, [renaming]);

  const commitRename = () => {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== project.name) onRename(project.id, trimmed);
    else setNameVal(project.name);
    setRenaming(false);
  };

  const cancelRename = () => { setNameVal(project.name); setRenaming(false); };

  const handleKeyDown = e => {
    if (e.key === 'Enter') commitRename();
    if (e.key === 'Escape') cancelRename();
  };

  const timeAgo = (iso) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(iso).toLocaleDateString();
  };

  return (
    <div className="rounded-xl overflow-visible group transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
      style={{ background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = `${color}55`}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>

      {/* Preview thumbnail */}
      <div className="h-36 flex items-center justify-center relative overflow-hidden rounded-t-xl cursor-pointer"
        style={{ background: `linear-gradient(135deg,#0a0f1e,#111827)` }}
        onClick={() => navigate(`/cad/${project.id}`)}>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'linear-gradient(rgba(99,179,237,0.3) 1px,transparent 1px),linear-gradient(90deg,rgba(99,179,237,0.3) 1px,transparent 1px)', backgroundSize: '24px 24px' }} />

        <Box size={36} style={{ color: `${color}55`, position: 'relative', zIndex: 1 }} />

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(2px)' }}>
          <button onClick={e => { e.stopPropagation(); navigate(`/cad/${project.id}`); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: color }}>
            <Edit2 size={11} /> Edit
          </button>
          <button onClick={e => { e.stopPropagation(); navigate(`/view/${project.id}`); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all active:scale-95"
            style={{ background: 'rgba(255,255,255,0.12)', border: `1px solid ${color}66` }}>
            <Eye size={11} /> View
          </button>
        </div>

        {/* Colour accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: `linear-gradient(90deg,${color},transparent)` }} />
      </div>

      {/* Card footer */}
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          {renaming ? (
            <div className="flex items-center gap-1">
              <input ref={inputRef} value={nameVal} onChange={e => setNameVal(e.target.value)}
                onKeyDown={handleKeyDown} onBlur={commitRename}
                className="flex-1 min-w-0 bg-transparent border-b text-sm font-semibold text-white outline-none"
                style={{ borderColor: color }} />
              <button onClick={commitRename} className="text-green-400 hover:text-green-300 shrink-0"><Check size={13} /></button>
              <button onClick={cancelRename} className="text-slate-500 hover:text-slate-300 shrink-0"><X size={13} /></button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-white truncate">{project.name}</p>
          )}
          <p className="text-[10px] mt-0.5 truncate" style={{ color: '#475569' }}>
            {project.template || 'blank'} · {timeAgo(project.updatedAt || project.createdAt)}
          </p>
        </div>

        {/* 3-dot menu */}
        <div ref={menuRef} className="relative shrink-0">
          <button onClick={() => setMenu(m => !m)}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: '#475569' }}
            onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
            onMouseLeave={e => e.currentTarget.style.color = '#475569'}>
            <MoreVertical size={14} />
          </button>

          {menu && (
            <div className="absolute right-0 bottom-full mb-1 z-30 rounded-xl overflow-hidden shadow-2xl"
              style={{ background: '#1e293b', border: '1px solid rgba(99,179,237,0.15)', minWidth: 148 }}>
              <button onClick={() => { navigate(`/cad/${project.id}`); setMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Edit2 size={12} /> Open Editor
              </button>
              <button onClick={() => { navigate(`/view/${project.id}`); setMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Eye size={12} /> View Only
              </button>
              <button onClick={() => { setRenaming(true); setMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                style={{ color: '#94a3b8' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Pencil size={12} /> Rename
              </button>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />
              <button onClick={() => { onDelete(project.id); setMenu(false); }}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs transition-colors"
                style={{ color: '#fc8181' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,101,101,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Trash2 size={12} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
