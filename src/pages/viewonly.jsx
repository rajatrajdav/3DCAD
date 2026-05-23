import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Box } from 'lucide-react';
import SceneViewport from '../components/canvas/Sceneviewport';
import { getSession } from '../auth';

const PROJECTS_KEY = '3dcad_projects';

export default function ViewOnly() {
  const { id } = useParams();
  const navigate = useNavigate();
  const session = getSession();
  const [project, setProject] = useState(null);
  const [objects, setObjects] = useState([]);

  useEffect(() => {
    if (!session) { navigate('/login', { replace: true }); return; }
    try {
      const projects = JSON.parse(localStorage.getItem(`${PROJECTS_KEY}_${session.id}`)) || [];
      const p = projects.find(p => p.id === id);
      if (!p) { navigate('/projects', { replace: true }); return; }
      setProject(p);
      setObjects(p.objects || []);
    } catch { navigate('/projects', { replace: true }); }
  }, [id]);

  return (
    <div className="flex flex-col h-screen font-sans overflow-hidden" style={{ background: '#060b16', color: '#e2e8f0' }}>
      {/* Header */}
      <header className="h-12 flex items-center justify-between px-4 shrink-0"
        style={{ background: '#0d1117', borderBottom: '1px solid rgba(99,179,237,0.1)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/projects')} className="text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}>
              <Box size={12} color="#fff" />
            </div>
            <span className="text-sm font-extrabold text-white">3D<span style={{ color: '#63b3ed' }}>CAD</span></span>
          </div>
          {project && <span className="text-slate-500 text-sm">/ {project.name}</span>}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'rgba(99,179,237,0.1)', color: '#63b3ed', border: '1px solid rgba(99,179,237,0.2)' }}>
            View Only
          </span>
          <button onClick={() => navigate(`/cad/${id}`)}
            className="text-xs px-3 py-1.5 rounded-lg font-semibold text-white transition-all"
            style={{ background: 'linear-gradient(135deg,#63b3ed,#4299e1)' }}>
            Open Editor
          </button>
        </div>
      </header>

      {/* Viewport */}
      <div className="flex-1">
        <SceneViewport objects={objects} selectedId={null} onSelect={() => {}} readOnly />
      </div>

      {/* Bottom info bar */}
      <div className="h-7 flex items-center px-4 text-[11px]"
        style={{ background: '#0d1117', borderTop: '1px solid rgba(99,179,237,0.08)', color: '#475569' }}>
        <span>{objects.length} object{objects.length !== 1 ? 's' : ''} · Read-only mode</span>
      </div>
    </div>
  );
}
