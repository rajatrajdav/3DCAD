import React from 'react';
import ProjectCard from './ProjectCard';
import { FolderOpen } from 'lucide-react';

export default function ProjectGrid({ projects, onDelete, onRename }) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <FolderOpen size={52} className="mb-4" style={{ color: 'rgba(99,179,237,0.15)' }} />
        <p className="text-slate-400 font-semibold text-base">No projects here</p>
        <p className="text-slate-600 text-sm mt-1">Click "New Project" to get started</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {projects.map(p => (
        <ProjectCard key={p.id} project={p} onDelete={onDelete} onRename={onRename} />
      ))}
    </div>
  );
}
