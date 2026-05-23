import React from 'react';
import { Box, Circle, Triangle, Minus, Eye, EyeOff, ChevronRight } from 'lucide-react';

const ICONS = { box: <Box size={12} />, sphere: <Circle size={12} />, cone: <Triangle size={12} />, cylinder: <Minus size={12} /> };

export default function SceneGraph({ objects, selectedId, onSelect, onToggleVisible }) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0a0f1e' }}>
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"
        style={{ borderBottom: '1px solid rgba(99,179,237,0.08)' }}>
        Scene
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {objects.length === 0 && (
          <p className="text-xs text-slate-600 px-3 py-4 text-center">No objects in scene</p>
        )}
        {objects.map(obj => (
          <div key={obj.id}
            onClick={() => onSelect(obj.id)}
            className="flex items-center justify-between px-3 py-1.5 cursor-pointer group transition-colors"
            style={{
              background: selectedId === obj.id ? 'rgba(99,179,237,0.1)' : 'transparent',
              borderLeft: selectedId === obj.id ? '2px solid #63b3ed' : '2px solid transparent',
            }}>
            <div className="flex items-center gap-2">
              <ChevronRight size={10} className="text-slate-600" />
              <span style={{ color: selectedId === obj.id ? '#63b3ed' : '#64748b' }}>{ICONS[obj.type] ?? <Box size={12} />}</span>
              <span className="text-xs truncate max-w-[100px]" style={{ color: selectedId === obj.id ? '#e2e8f0' : '#94a3b8' }}>{obj.name}</span>
            </div>
            <button onClick={e => { e.stopPropagation(); onToggleVisible(obj.id); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-300">
              {obj.visible !== false ? <Eye size={11} /> : <EyeOff size={11} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
