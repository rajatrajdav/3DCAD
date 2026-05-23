import React from 'react';

function Vec3Field({ label, value, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] text-slate-500 uppercase tracking-wider">{label}</label>
      <div className="grid grid-cols-3 gap-1">
        {['x', 'y', 'z'].map(axis => (
          <div key={axis} className="flex items-center gap-1">
            <span className="text-[10px] font-bold w-3" style={{ color: axis === 'x' ? '#fc8181' : axis === 'y' ? '#68d391' : '#63b3ed' }}>{axis.toUpperCase()}</span>
            <input type="number" step="0.1" value={value[axis].toFixed(2)}
              onChange={e => onChange({ ...value, [axis]: parseFloat(e.target.value) || 0 })}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-1.5 py-1 outline-none focus:border-blue-500 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PropertyPanel({ selectedObject, onUpdate }) {
  if (!selectedObject) {
    return (
      <div className="flex flex-col h-full" style={{ background: '#0a0f1e' }}>
        <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"
          style={{ borderBottom: '1px solid rgba(99,179,237,0.08)' }}>Properties</div>
        <p className="text-xs text-slate-600 px-3 py-4 text-center">Select an object to edit</p>
      </div>
    );
  }

  const { position, rotation, scale } = selectedObject;

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: '#0a0f1e' }}>
      <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider"
        style={{ borderBottom: '1px solid rgba(99,179,237,0.08)' }}>Properties</div>
      <div className="p-3 space-y-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Name</label>
          <input value={selectedObject.name}
            onChange={e => onUpdate({ ...selectedObject, name: e.target.value })}
            className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1.5 outline-none focus:border-blue-500 transition-colors" />
        </div>
        <Vec3Field label="Position" value={position} onChange={v => onUpdate({ ...selectedObject, position: v })} />
        <Vec3Field label="Rotation" value={rotation} onChange={v => onUpdate({ ...selectedObject, rotation: v })} />
        <Vec3Field label="Scale"    value={scale}    onChange={v => onUpdate({ ...selectedObject, scale: v })} />
        {/* Colour */}
        <div className="space-y-1">
          <label className="text-[10px] text-slate-500 uppercase tracking-wider">Colour</label>
          <div className="flex items-center gap-2">
            <input type="color" value={selectedObject.color || '#63b3ed'}
              onChange={e => onUpdate({ ...selectedObject, color: e.target.value })}
              className="w-8 h-8 rounded cursor-pointer bg-transparent border-0" />
            <span className="text-xs text-slate-400">{selectedObject.color || '#63b3ed'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
