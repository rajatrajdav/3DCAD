import React from 'react';

export default function Statusbar({ activeTool, selectedObject, objectCount }) {
  return (
    <div className="flex items-center justify-between px-4 h-7 text-[11px] shrink-0"
      style={{ background: '#0d1117', borderTop: '1px solid rgba(99,179,237,0.08)', color: '#475569' }}>
      <div className="flex items-center gap-4">
        <span>Tool: <span style={{ color: '#63b3ed' }}>{activeTool}</span></span>
        {selectedObject && <span>Selected: <span className="text-slate-300">{selectedObject.name}</span></span>}
      </div>
      <div className="flex items-center gap-4">
        <span>{objectCount} object{objectCount !== 1 ? 's' : ''}</span>
        <span style={{ color: '#1e3a5f' }}>3DCAD Studio</span>
      </div>
    </div>
  );
}
